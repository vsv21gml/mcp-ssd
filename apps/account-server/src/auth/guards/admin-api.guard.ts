import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AdminApiGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext) {
    const key = this.config.get<string>("ADMIN_API_KEY");
    if (!key) {
      throw new UnauthorizedException("ADMIN_API_KEY not configured");
    }

    const req = context.switchToHttp().getRequest();
    const header = (req.headers["x-admin-key"] || req.headers["x-admin-api-key"]) as string | undefined;
    const auth = req.headers.authorization as string | undefined;

    const token = header || (auth?.startsWith("Bearer ") ? auth.slice(7).trim() : "");
    if (!token || token !== key) {
      throw new UnauthorizedException("Invalid admin key");
    }
    return true;
  }
}
