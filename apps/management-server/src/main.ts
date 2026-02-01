import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const port = Number(config.get("MGMT_PORT", "4002"));

  app.enableCors({
    origin: config.get("CORS_ORIGIN", "*")
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle("SDisk Management API")
    .setDescription("File upload, approvals, environment settings")
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, document);

  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`management-server listening on ${port}`);
}

bootstrap();
