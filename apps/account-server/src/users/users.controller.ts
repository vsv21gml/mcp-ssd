import { Body, Controller, Get, Param, Put, UseGuards, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/roles.decorator";
import type { AccountRole } from "./account-user.entity";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuditLogsService } from "../audit/audit-logs.service";
import type { Request } from "express";

@ApiTags("admin-users")
@ApiBearerAuth()
@Controller("/admin/users")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class UsersController {
  constructor(private readonly users: UsersService, private readonly auditLogs: AuditLogsService) {}

  @Get()
  list() {
    return this.users.list();
  }

  @Put(":id/role")
  async updateRole(
    @Param("id") id: string,
    @Body("role") role: AccountRole,
    @CurrentUser() user: any,
    @Req() req: Request
  ) {
    const updated = await this.users.updateRole(id, role);
    await this.auditLogs.create({
      actorId: String(user?.id || "unknown"),
      actorEmail: user?.email,
      actorRole: user?.role,
      action: "USER_ROLE_UPDATE",
      targetType: "USER",
      targetId: id,
      metadata: { role },
      ip: getIp(req),
      userAgent: req.headers["user-agent"] || null
    });
    return updated;
  }

  @Get("me")
  me(@CurrentUser() user: any) {
    return user;
  }
}

function getIp(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.ip;
}
