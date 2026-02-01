import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { AuditLogsService } from "./audit-logs.service";
import { AccessLogsService } from "./access-logs.service";

@ApiTags("admin-logs")
@ApiBearerAuth()
@Controller("/admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class AuditController {
  constructor(
    private readonly auditLogs: AuditLogsService,
    private readonly accessLogs: AccessLogsService
  ) {}

  @Get("audit-logs")
  listAudit(@Query("page") page = "1", @Query("size") size = "50") {
    return this.auditLogs.list(Number(page), Number(size));
  }

  @Get("access-logs")
  listAccess(@Query("page") page = "1", @Query("size") size = "50") {
    return this.accessLogs.list(Number(page), Number(size));
  }
}
