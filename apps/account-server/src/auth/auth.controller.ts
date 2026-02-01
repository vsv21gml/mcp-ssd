import { Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request } from "express";
import type { Response } from "express";
import { SamlAuthGuard } from "./guards/saml-auth.guard";
import { ConfigService } from "@nestjs/config";
import { SignJWT } from "jose";
import { UsersService } from "../users/users.service";

@Controller()
export class AuthController {
  constructor(private readonly config: ConfigService, private readonly users: UsersService) {}

  private async issueRedirectWithToken(req: Request, res: Response, redirectTarget?: string) {
    const fallback = this.config.get<string>("WEB_DEFAULT_REDIRECT");
    const target = redirectTarget || fallback;
    if (!target) {
      return res.json({ user: (req as any).user });
    }

    const secret = this.config.get<string>("JWT_SHARED_SECRET");
    if (!secret) {
      return res.redirect(target);
    }

    const ttlSeconds = Number(this.config.get<string>("JWT_TTL_SECONDS", "3600"));
    const ssoUser = (req as any).user || {};
    const ensured = await this.users.ensureUser({
      id: String(ssoUser.id || ssoUser.nameID || ssoUser.email || "user"),
      email: ssoUser.email,
      name: ssoUser.displayName || ssoUser.name
    });

    const token = await new SignJWT({
      sub: ensured.id,
      name: ensured.name || undefined,
      email: ensured.email || undefined,
      role: ensured.role
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer(this.config.get<string>("ACCOUNT_ISSUER", "http://localhost:4001/oauth"))
      .setIssuedAt()
      .setExpirationTime(`${ttlSeconds}s`)
      .sign(new TextEncoder().encode(secret));

    const url = new URL(target);
    url.searchParams.set("token", token);
    return res.redirect(url.toString());
  }
  @Get("/health")
  health() {
    return { ok: true };
  }

  @Get("/auth/sso/saml")
  @UseGuards(SamlAuthGuard)
  samlLogin() {
    return;
  }

  @Get("/auth/sso/oidc")
  @UseGuards(AuthGuard("oidc"))
  oidcLogin() {
    return;
  }

  @Get("/auth/sso/saml/callback")
  @UseGuards(SamlAuthGuard)
  samlCallback(@Req() req: Request, @Res() res: Response) {
    const redirect = (req.query.redirect as string) || (req.query.RelayState as string);
    return this.issueRedirectWithToken(req, res, redirect);
  }

  @Post("/auth/sso/saml/callback")
  @UseGuards(SamlAuthGuard)
  samlCallbackPost(@Req() req: Request, @Res() res: Response) {
    const relayState =
      (req.body && (req.body.RelayState as string)) ||
      (req.query.RelayState as string) ||
      (req.query.redirect as string);
    return this.issueRedirectWithToken(req, res, relayState);
  }

  @Get("/auth/sso/oidc/callback")
  @UseGuards(AuthGuard("oidc"))
  oidcCallback(@Req() req: Request) {
    return { user: (req as any).user };
  }
}
