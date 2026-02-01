import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthController } from "./auth/auth.controller";
import { SsoModule } from "./auth/sso.module";
import { OAuthModule } from "./oauth/oauth.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OAuthClientEntity } from "./oauth/entities/oauth-client.entity";
import { AccountUserEntity } from "./users/account-user.entity";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        host: config.get("PG_HOST", "localhost"),
        port: Number(config.get("PG_PORT", "5432")),
        username: config.get("PG_USER", "postgres"),
        password: config.get("PG_PASSWORD", "postgres"),
        database: config.get("PG_DATABASE", "sdisk"),
        ssl:
          config.get("SSL_IGNORE") === "true" || config.get("SSL_IGNORE") === "1"
            ? { rejectUnauthorized: false }
            : config.get("SSL_ENABLE") === "true" || config.get("SSL_ENABLE") === "1"
              ? true
              : undefined,
        entities: [OAuthClientEntity, AccountUserEntity],
        synchronize: true
      })
    }),
    SsoModule,
    UsersModule,
    OAuthModule
  ],
  controllers: [AuthController]
})
export class AppModule {}
