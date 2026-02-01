import { Body, Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuditLogsService } from "./audit-logs.service";

@ApiTags("audit-logs")
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditLogs: AuditLogsService) {}

  @Post("audit-logs")
  create(
    @Body() body: { action: string; targetType?: string; targetId?: string; metadata?: Record<string, any> },
    @CurrentUser() user: any,
    @Req() req: Request
  ) {
    return this.auditLogs.create({
      actorId: user?.id,
      actorEmail: user?.email,
      actorRole: user?.role,
      action: body.action,
      targetType: body.targetType,
      targetId: body.targetId,
      metadata: body.metadata,
      ip: getIp(req),
      userAgent: req.headers["user-agent"] || null
    });
  }

  @Get("admin/audit-logs")
  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  list(@Query("page") page = "1", @Query("size") size = "50") {
    return this.auditLogs.list(Number(page), Number(size));
  }
}

function getIp(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.ip;
}
