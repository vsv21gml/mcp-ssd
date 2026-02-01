import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FileEntity } from "./file.entity";
import { FilesService } from "./files.service";
import { FilesController } from "./files.controller";
import { ApprovalService } from "./approval.service";
import { EnvModule } from "../env/env.module";
import { AuthModule } from "../auth/auth.module";
import { UsersModule } from "../users/users.module";
import { ExpiryJob } from "./expiry.job";

@Module({
  imports: [TypeOrmModule.forFeature([FileEntity]), EnvModule, AuthModule, UsersModule],
  providers: [FilesService, ApprovalService, ExpiryJob],
  controllers: [FilesController],
  exports: [FilesService]
})
export class FilesModule {}
