import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Provider from "oidc-provider";
import crypto from "node:crypto";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const MemoryAdapter = require("oidc-provider/lib/adapters/memory_adapter.js");
import { OAuthClientEntity } from "./entities/oauth-client.entity";

function buildJwks(raw?: string) {
  if (raw) {
    return JSON.parse(raw);
  }
  const { privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048
  });
  const jwk = privateKey.export({ format: "jwk" });
  return { keys: [{ ...jwk, use: "sig", kid: "dev-key" }] };
}

function parseClients(raw?: string) {
  if (!raw) return [];
  return JSON.parse(raw);
}

@Injectable()
export class OidcProviderService {
  private readonly provider: any;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(OAuthClientEntity) private readonly clientsRepo: Repository<OAuthClientEntity>
  ) {
    const issuer = config.get<string>("ACCOUNT_ISSUER") || "http://localhost:4001/oauth/oidc";
    const jwks = buildJwks(config.get<string>("OAUTH_JWKS_JSON"));
    const clients = parseClients(config.get<string>("OAUTH_CLIENTS_JSON"));
    const resourceUrl = config.get<string>("OAUTH_RESOURCE_URL") || "http://localhost:4003";

    const Adapter = createHybridAdapter(this.clientsRepo);

    const configuration: any = {
      adapter: Adapter,
      clients,
      jwks,
      features: {
        devInteractions: { enabled: true },
        registration: { enabled: true },
        resourceIndicators: {
          enabled: true,
          defaultResource: resourceUrl,
          getResourceServerInfo: () => ({
            scope: "files.read openid profile email",
            audience: resourceUrl
          })
        }
      },
      formats: {
        AccessToken: "jwt"
      },
      claims: {
        openid: ["sub"],
        profile: ["name"],
        email: ["email"]
      },
      scopes: ["openid", "profile", "email", "files.read"],
      pkce: {
        required: () => true,
        methods: ["S256"]
      },
      async findAccount(_ctx: any, sub: any) {
        return {
          accountId: sub,
          async claims() {
            return { sub, name: "SSO User", email: "user@example.com" };
          }
        };
      }
    };

    this.provider = new Provider(issuer, configuration);
  }

  callback() {
    return this.provider.callback();
  }
}

function createHybridAdapter(repo: Repository<OAuthClientEntity>) {
  return class HybridAdapter {
    private model: string;
    private memory: any;

    constructor(model: string) {
      this.model = model;
      this.memory = new (MemoryAdapter as any)(model);
    }

    async upsert(id: string, payload: any, expiresIn?: number) {
      if (this.model === "Client") {
        const clientSecret = payload.client_secret || payload.clientSecret || null;
        const existing = await repo.findOne({ where: { clientId: id } });
        if (existing) {
          existing.clientSecret = clientSecret ?? existing.clientSecret;
          existing.metadata = payload;
          await repo.save(existing);
        } else {
          await repo.save({
            clientId: id,
            clientSecret,
            metadata: payload
          });
        }
        return;
      }
      return this.memory.upsert(id, payload, expiresIn);
    }

    async find(id: string) {
      if (this.model === "Client") {
        const found = await repo.findOne({ where: { clientId: id } });
        return found?.metadata;
      }
      return this.memory.find(id);
    }

    async destroy(id: string) {
      if (this.model === "Client") {
        await repo.delete({ clientId: id });
        return;
      }
      return this.memory.destroy(id);
    }

    async consume(id: string) {
      if (this.model === "Client") return;
      return this.memory.consume(id);
    }

    async revokeByGrantId(grantId: string) {
      if (this.model === "Client") return;
      return this.memory.revokeByGrantId(grantId);
    }

    async findByUid(uid: string) {
      if (this.model === "Client") return undefined;
      return this.memory.findByUid(uid);
    }

    async findByUserCode(userCode: string) {
      if (this.model === "Client") return undefined;
      return this.memory.findByUserCode(userCode);
    }
  };
}
