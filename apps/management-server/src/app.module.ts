import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ScheduleModule } from "@nestjs/schedule";
import { FilesModule } from "./files/files.module";
import { EnvModule } from "./env/env.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { FileEntity } from "./files/file.entity";
import { EnvEntity } from "./env/env.entity";
import { UserEntity } from "./users/user.entity";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        host: config.get("PG_HOST", "localhost"),
        port: Number(config.get("PG_PORT", "5432")),
        username: config.get("PG_USER", "postgres"),
        password: config.get("PG_PASSWORD", "postgres"),
        database: config.get("PG_DATABASE", "sdisk"),
        ssl: config.get("SSL_IGNORE") === "true" || config.get("SSL_IGNORE") === "1"
          ? { rejectUnauthorized: false }
          : config.get("SSL_ENABLE") === "true" || config.get("SSL_ENABLE") === "1"
            ? true
            : undefined,
        entities: [FileEntity, EnvEntity, UserEntity],
        synchronize: true
      })
    }),
    AuthModule,
    UsersModule,
    FilesModule,
    EnvModule
  ]
})
export class AppModule {}
