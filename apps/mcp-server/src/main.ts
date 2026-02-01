import "dotenv/config";
import express from "express";
import { randomUUID } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { mcpAuthMetadataRouter, getOAuthProtectedResourceMetadataUrl } from "@modelcontextprotocol/sdk/server/auth/router.js";
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  isInitializeRequest,
  type CallToolRequest
} from "@modelcontextprotocol/sdk/types.js";

const MGMT_BASE_URL = process.env.MGMT_BASE_URL || "http://localhost:4002/api";
const HTTP_PORT = Number(process.env.MCP_HTTP_PORT || "4003");
const MCP_PATH = process.env.MCP_PATH || "/mcp";
const PUBLIC_BASE = process.env.MCP_PUBLIC_URL || `http://localhost:${HTTP_PORT}`;
const RESOURCE_URL = process.env.MCP_RESOURCE_URL || `${PUBLIC_BASE}${MCP_PATH}`;
const ACCOUNT_ISSUER = process.env.ACCOUNT_ISSUER || "http://localhost:4001/oauth/oidc";

const oauthMetadata = {
  issuer: ACCOUNT_ISSUER,
  authorization_endpoint: `${ACCOUNT_ISSUER}/authorize`,
  token_endpoint: `${ACCOUNT_ISSUER}/token`,
  response_types_supported: ["code"],
  code_challenge_methods_supported: ["S256"],
  token_endpoint_auth_methods_supported: ["client_secret_post", "none"],
  grant_types_supported: ["authorization_code", "refresh_token"],
  scopes_supported: ["files.read", "openid", "profile", "email"]
};

const resourceServerUrl = new URL(RESOURCE_URL);
const resourceMetadataUrl = getOAuthProtectedResourceMetadataUrl(resourceServerUrl);
const jwks = createRemoteJWKSet(new URL(new URL(".well-known/jwks.json", ACCOUNT_ISSUER).toString()));

const authMiddleware = requireBearerAuth({
  verifier: {
    verifyAccessToken: async (token) => {
      const { payload } = await jwtVerify(token, jwks, { issuer: ACCOUNT_ISSUER });
      const scopesRaw = (payload.scope as string | undefined) || "";
      const scopes = scopesRaw ? scopesRaw.split(" ") : [];
      const expiresAt = typeof payload.exp === "number" ? payload.exp : Math.floor(Date.now() / 1000) + 300;
      return {
        token,
        clientId: (payload.client_id as string | undefined) || (payload.azp as string | undefined) || "unknown",
        scopes,
        expiresAt
      };
    }
  },
  requiredScopes: ["files.read"],
  resourceMetadataUrl
});

function buildServer() {
  const server = new Server(
    { name: "sdisk-mcp", version: "0.1.0" },
    { capabilities: { tools: {} } }
  );

  function getToken(request: CallToolRequest) {
    const args = request.params.arguments as Record<string, any> | undefined;
    const raw = args?.accessToken || (request as any).meta?.authorization || (request as any).meta?.token;
    if (!raw) return undefined;
    if (typeof raw === "string" && raw.toLowerCase().startsWith("bearer ")) {
      return raw.slice(7).trim();
    }
    return raw as string;
  }

  function oauthChallenge() {
    const resourceMeta = `${PUBLIC_BASE}/.well-known/oauth-protected-resource`;
    return {
      "mcp/www_authenticate": [
        `Bearer resource_metadata=\"${resourceMeta}\", error=\"insufficient_scope\", error_description=\"OAuth login required\"`
      ]
    };
  }

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "list_files",
        description: "List files owned by the current user (ACTIVE/EXPIRED/etc).",
        inputSchema: {
          type: "object",
          properties: {
            status: { type: "string" },
            page: { type: "number" },
            size: { type: "number" },
            accessToken: { type: "string", description: "OAuth access token" }
          }
        },
        securitySchemes: [{ type: "oauth2", scopes: ["files.read"] }]
      },
      {
        name: "get_file_info",
        description: "Get metadata for a single file by id.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
            accessToken: { type: "string", description: "OAuth access token" }
          },
          required: ["id"]
        },
        securitySchemes: [{ type: "oauth2", scopes: ["files.read"] }]
      }
    ]
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
    const token = getToken(request);
    if (!token) {
      return {
        content: [{ type: "text", text: "Missing access token." }],
        _meta: oauthChallenge(),
        isError: true
      };
    }

    const args = request.params.arguments as Record<string, any> | undefined;

    switch (request.params.name) {
      case "list_files": {
        const url = new URL("/files", MGMT_BASE_URL);
        if (args?.status) url.searchParams.set("status", args.status);
        if (args?.page) url.searchParams.set("page", String(args.page));
        if (args?.size) url.searchParams.set("size", String(args.size));

        const response = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 401) {
          return { content: [{ type: "text", text: "Unauthorized." }], _meta: oauthChallenge(), isError: true };
        }
        const data = await response.json();
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      }
      case "get_file_info": {
        const response = await fetch(`${MGMT_BASE_URL}/files/${args?.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.status === 401) {
          return { content: [{ type: "text", text: "Unauthorized." }], _meta: oauthChallenge(), isError: true };
        }
        const data = await response.json();
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      }
      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${request.params.name}` }],
          isError: true
        };
    }
  });

  return server;
}

async function main() {
  const app = createMcpExpressApp({ host: process.env.MCP_HOST || "127.0.0.1" });

  app.get("/health", (_req, res) => res.json({ ok: true }));
  const proxyWellKnown = async (req: express.Request, res: express.Response, path: string) => {
    try {
      const url = new URL(path, ACCOUNT_ISSUER);
      const upstream = await fetch(url.toString());
      const body = await upstream.text();
      res.status(upstream.status).set("Content-Type", "application/json").send(body);
    } catch (error) {
      res.status(502).json({ error: "well-known proxy failed" });
    }
  };

  // Some clients probe OIDC discovery on the MCP host.
  app.get("/.well-known/openid-configuration", (req, res) =>
    proxyWellKnown(req, res, "/.well-known/openid-configuration")
  );
  app.get("/mcp/.well-known/openid-configuration", (req, res) =>
    proxyWellKnown(req, res, "/.well-known/openid-configuration")
  );
  app.get("/.well-known/oauth-authorization-server", (req, res) =>
    proxyWellKnown(req, res, "/.well-known/oauth-authorization-server")
  );
  app.get("/mcp/.well-known/oauth-authorization-server", (req, res) =>
    proxyWellKnown(req, res, "/.well-known/oauth-authorization-server")
  );
  app.get("/.well-known/oauth-protected-resource", (_req, res) => {
    res.json({
      resource: RESOURCE_URL,
      authorization_servers: [ACCOUNT_ISSUER],
      scopes_supported: ["files.read"],
      resource_documentation: ""
    });
  });

  app.use(
    mcpAuthMetadataRouter({
      oauthMetadata,
      resourceServerUrl,
      scopesSupported: ["files.read"],
      resourceName: "SDisk MCP"
    })
  );

  const transports: Record<string, StreamableHTTPServerTransport> = {};

  const mcpPostHandler = async (req: express.Request, res: express.Response) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    try {
      let transport = sessionId ? transports[sessionId] : undefined;
      if (!transport) {
        if (!isInitializeRequest(req.body)) {
          res.status(400).json({
            jsonrpc: "2.0",
            error: { code: -32000, message: "Bad Request: No valid session ID provided" },
            id: null
          });
          return;
        }
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (sid) => {
            transports[sid] = transport as StreamableHTTPServerTransport;
          }
        });
        transport.onclose = () => {
          const sid = transport?.sessionId;
          if (sid && transports[sid]) delete transports[sid];
        };
        const server = buildServer();
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
        return;
      }
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null
        });
      }
    }
  };

  const mcpGetHandler = async (req: express.Request, res: express.Response) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
      res.status(400).send("Invalid or missing session ID");
      return;
    }
    await transports[sessionId].handleRequest(req, res);
  };

  const mcpDeleteHandler = async (req: express.Request, res: express.Response) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
      res.status(400).send("Invalid or missing session ID");
      return;
    }
    try {
      await transports[sessionId].handleRequest(req, res);
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).send("Error processing session termination");
      }
    }
  };

  app.post(MCP_PATH, authMiddleware, mcpPostHandler);
  app.get(MCP_PATH, authMiddleware, mcpGetHandler);
  app.delete(MCP_PATH, authMiddleware, mcpDeleteHandler);

  app.listen(HTTP_PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`mcp-server listening on ${HTTP_PORT} (${MCP_PATH})`);
  });
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
