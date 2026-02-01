import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuditLogEntity } from "./audit-log.entity";
import { AccessLogEntity } from "./access-log.entity";
import { AuditLogsService } from "./audit-logs.service";
import { AccessLogsService } from "./access-logs.service";
import { AuditController } from "./audit.controller";

@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity, AccessLogEntity])],
  providers: [AuditLogsService, AccessLogsService],
  controllers: [AuditController],
  exports: [AuditLogsService, AccessLogsService]
})
export class AuditModule {}
