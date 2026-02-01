import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";
import { Strategy } from "passport-openidconnect";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class OidcStrategy extends PassportStrategy(Strategy, "oidc") {
  constructor(private readonly config: ConfigService) {
    const fallbackIssuer = config.get<string>("ACCOUNT_ISSUER", "http://localhost:4001/oauth");
    const issuer = config.get<string>("OIDC_ISSUER") || fallbackIssuer;
    const authorizationURL =
      config.get<string>("OIDC_AUTHORIZATION_URL") || `${issuer}/authorize`;
    const tokenURL = config.get<string>("OIDC_TOKEN_URL") || `${issuer}/token`;
    const userInfoURL = config.get<string>("OIDC_USERINFO_URL") || `${issuer}/userinfo`;
    super({
      issuer,
      authorizationURL,
      tokenURL,
      userInfoURL,
      clientID: config.get<string>("OIDC_CLIENT_ID"),
      clientSecret: config.get<string>("OIDC_CLIENT_SECRET"),
      callbackURL: config.get<string>("OIDC_CALLBACK_URL"),
      scope: "openid profile email"
    });
  }

  validate(_issuer: string, profile: any) {
    return {
      id: profile.id || profile.sub,
      email: profile.emails?.[0]?.value,
      displayName: profile.displayName,
      provider: "oidc"
    };
  }
}
