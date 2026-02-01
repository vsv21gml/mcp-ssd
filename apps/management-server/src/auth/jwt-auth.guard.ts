import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createRemoteJWKSet, jwtVerify } from "jose";
import type { Request } from "express";
import { UsersService } from "../users/users.service";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "./public.decorator";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
  private issuer?: string;
  private audience: string | undefined;
  private sharedSecret: string | undefined;

  constructor(
    private readonly config: ConfigService,
    private readonly users: UsersService,
    private readonly reflector: Reflector
  ) {
    this.issuer = config.get<string>("ACCOUNT_ISSUER");
    this.audience = config.get<string>("ACCOUNT_AUDIENCE");
    this.sharedSecret = config.get<string>("JWT_SHARED_SECRET");
  }

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }

    const token = header.replace("Bearer ", "").trim();
    try {
      const verifyOptions: { issuer?: string; audience?: string } = {};
      if (this.issuer) verifyOptions.issuer = this.issuer;
      if (this.audience) verifyOptions.audience = this.audience;

      const { payload } = this.sharedSecret
        ? await jwtVerify(token, new TextEncoder().encode(this.sharedSecret), verifyOptions)
        : await jwtVerify(
            token,
            this.jwks ||
              (this.jwks = createRemoteJWKSet(
                new URL(new URL(".well-known/jwks.json", this.issuer || "http://localhost:4001/oauth").toString())
              )),
            verifyOptions
          );

      const user = await this.users.ensureUser({
        id: String(payload.sub),
        email: payload.email as string | undefined,
        name: payload.name as string | undefined
      });

      (request as any).user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      };
      return true;
    } catch (error) {
      throw new UnauthorizedException("Invalid token");
    }
  }
}
