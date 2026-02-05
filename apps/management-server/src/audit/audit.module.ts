import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuditLogEntity } from "./audit-log.entity";
import { AuditLogsService } from "./audit-logs.service";
import { AuditController } from "./audit.controller";
import { AuthModule } from "../auth/auth.module";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity]), AuthModule, UsersModule],
  providers: [AuditLogsService],
  controllers: [AuditController],
  exports: [AuditLogsService]
})
export class AuditModule {}
