import { Module } from "@nestjs/common";
import { OidcProviderService } from "./oidc-provider.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OAuthClientEntity } from "./entities/oauth-client.entity";
import { OAuthClientsService } from "./oauth-clients.service";
import { OAuthClientsController } from "./oauth-clients.controller";
import { AuditModule } from "../audit/audit.module";

@Module({
  imports: [TypeOrmModule.forFeature([OAuthClientEntity]), AuditModule],
  providers: [OidcProviderService, OAuthClientsService],
  controllers: [OAuthClientsController],
  exports: [OidcProviderService]
})
export class OAuthModule {}
