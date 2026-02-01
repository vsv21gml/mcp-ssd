import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuditLogEntity } from "./audit-log.entity";
import { AuditLogsService } from "./audit-logs.service";
import { AuditController } from "./audit.controller";

@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity])],
  providers: [AuditLogsService],
  controllers: [AuditController],
  exports: [AuditLogsService]
})
export class AuditModule {}
