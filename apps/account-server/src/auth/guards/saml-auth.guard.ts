import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class SamlAuthGuard extends AuthGuard("saml") {
  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const redirect = req.query?.redirect || req.query?.RelayState;
    if (!redirect) return {};

    return {
      additionalParams: { RelayState: redirect },
      additionalAuthorizeParams: { RelayState: redirect },
      RelayState: redirect
    } as any;
  }
}
