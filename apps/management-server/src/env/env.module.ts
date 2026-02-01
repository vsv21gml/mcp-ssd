import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EnvEntity } from "./env.entity";
import { EnvService } from "./env.service";
import { EnvController } from "./env.controller";
import { AuthModule } from "../auth/auth.module";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [TypeOrmModule.forFeature([EnvEntity]), AuthModule, UsersModule],
  providers: [EnvService],
  controllers: [EnvController],
  exports: [EnvService]
})
export class EnvModule {}
