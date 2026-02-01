import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { jwtVerify } from "jose";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private secret?: string;
  private issuer?: string;

  constructor(private readonly config: ConfigService) {
    this.secret = config.get<string>("JWT_SHARED_SECRET");
    this.issuer = config.get<string>("ACCOUNT_ISSUER");
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }
    if (!this.secret) {
      throw new UnauthorizedException("JWT_SHARED_SECRET not configured");
    }

    const token = header.replace("Bearer ", "").trim();
    const { payload } = await jwtVerify(token, new TextEncoder().encode(this.secret), {
      issuer: this.issuer || undefined
    });

    request.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role || "MEMBER"
    };
    return true;
  }
}
