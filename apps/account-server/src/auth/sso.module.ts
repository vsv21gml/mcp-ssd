import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { SamlStrategy } from "./strategies/saml.strategy";
import { OidcStrategy } from "./strategies/oidc.strategy";
import { SamlAuthGuard } from "./guards/saml-auth.guard";
import { AdminApiGuard } from "./guards/admin-api.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RolesGuard } from "./guards/roles.guard";

@Module({
  imports: [PassportModule.register({ session: false })],
  providers: [SamlStrategy, OidcStrategy, SamlAuthGuard, AdminApiGuard, JwtAuthGuard, RolesGuard],
  exports: [SamlAuthGuard, AdminApiGuard, JwtAuthGuard, RolesGuard]
})
export class SsoModule {}
