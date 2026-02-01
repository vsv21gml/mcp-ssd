import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";
import { OidcProviderService } from "./oauth/oidc-provider.service";
import type { Request, Response, NextFunction } from "express";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const port = Number(config.get("ACCOUNT_PORT", "4001"));

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/auth/")) {
      return res.redirect(`/oauth${req.url}`);
    }
    return next();
  });

  app.setGlobalPrefix("oauth");

  const corsOriginRaw = config.get<string>("CORS_ORIGIN", "*");
  const corsOrigin =
    corsOriginRaw === "*"
      ? "*"
      : corsOriginRaw
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean);

  app.enableCors({
    origin: corsOrigin
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle("SDisk Account API")
    .setDescription("SSO + OAuth 2.1 + Client Management")
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, document);

  const oidcProvider = app.get(OidcProviderService);
  app.use("/oauth/oidc", oidcProvider.callback());

  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`account-server listening on ${port}`);
}

bootstrap();
