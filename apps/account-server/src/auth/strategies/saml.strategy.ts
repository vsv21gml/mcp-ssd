import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";
import { Strategy, Profile, SamlConfig } from "passport-saml";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class SamlStrategy extends PassportStrategy(Strategy, "saml") {
  constructor(private readonly config: ConfigService) {
    super({
      callbackUrl: config.get<string>("SAML_CALLBACK_URL"),
      entryPoint: config.get<string>("SAML_ENTRY_POINT"),
      issuer: config.get<string>("SAML_ISSUER"),
      cert: config.get<string>("SAML_CERT"),
      identifierFormat: config.get<string>("SAML_IDENTIFIER_FORMAT"),
      wantAssertionsSigned: false,
      wantAuthnResponseSigned: true,
      disableRequestedAuthnContext: true
    } as SamlConfig);
  }

  private pickAttribute(profile: any, keys: string[]) {
    console.log(profile)
    for (const key of keys) {
      const value =
        profile?.[key] ||
        profile?.attributes?.[key] ||
        profile?.attributes?.find?.((attr: any) => attr?.name === key)?.value;
      if (Array.isArray(value)) return value[0];
      if (value) return value;
    }
    return undefined;
  }

  validate(profile: Profile) {
    const emailAttr = this.config.get<string>("SAML_ATTR_EMAIL");
    const nameAttr = this.config.get<string>("SAML_ATTR_NAME");
    const email = this.pickAttribute(profile, [
      emailAttr || "",
      "email",
      "mail",
      "EmailAddress",
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
      "urn:oid:0.9.2342.19200300.100.1.3"
    ]);
    const name = this.pickAttribute(profile, [
      nameAttr || "",
      "displayName",
      "name",
      "cn",
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
      "urn:oid:2.5.4.3"
    ]);

    return {
      id: profile.nameID,
      email,
      displayName: name || profile.displayName,
      provider: "saml"
    };
  }
}
