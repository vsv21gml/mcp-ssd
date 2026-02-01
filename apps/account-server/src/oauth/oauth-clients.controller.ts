import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { OAuthClientsService } from "./oauth-clients.service";
import { CreateClientDto } from "./dto/create-client.dto";
import { UpdateClientDto } from "./dto/update-client.dto";
import { AuditLogsService } from "../audit/audit-logs.service";
import { CurrentUser } from "../auth/current-user.decorator";
import type { Request } from "express";

@ApiTags("oauth-clients")
@ApiBearerAuth()
@Controller("/admin/oauth/clients")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class OAuthClientsController {
  constructor(
    private readonly clients: OAuthClientsService,
    private readonly auditLogs: AuditLogsService
  ) {}

  @Get()
  list() {
    return this.clients.list();
  }

  @Get(":clientId")
  get(@Param("clientId") clientId: string) {
    return this.clients.get(clientId);
  }

  @Post()
  async create(@Body() body: CreateClientDto, @CurrentUser() user: any, @Req() req: Request) {
    const created = await this.clients.create(body);
    await this.auditLogs.create({
      actorId: String(user?.id || "unknown"),
      actorEmail: user?.email,
      actorRole: user?.role,
      action: "CLIENT_CREATE",
      targetType: "OAUTH_CLIENT",
      targetId: created.clientId,
      metadata: { redirect_uris: created.metadata?.redirect_uris },
      ip: getIp(req),
      userAgent: req.headers["user-agent"] || null
    });
    return created;
  }

  @Put(":clientId")
  async update(
    @Param("clientId") clientId: string,
    @Body() body: UpdateClientDto,
    @CurrentUser() user: any,
    @Req() req: Request
  ) {
    const updated = await this.clients.update(clientId, body);
    await this.auditLogs.create({
      actorId: String(user?.id || "unknown"),
      actorEmail: user?.email,
      actorRole: user?.role,
      action: "CLIENT_UPDATE",
      targetType: "OAUTH_CLIENT",
      targetId: clientId,
      metadata: { updated: Object.keys(body || {}) },
      ip: getIp(req),
      userAgent: req.headers["user-agent"] || null
    });
    return updated;
  }

  @Delete(":clientId")
  async remove(@Param("clientId") clientId: string, @CurrentUser() user: any, @Req() req: Request) {
    const removed = await this.clients.remove(clientId);
    await this.auditLogs.create({
      actorId: String(user?.id || "unknown"),
      actorEmail: user?.email,
      actorRole: user?.role,
      action: "CLIENT_DELETE",
      targetType: "OAUTH_CLIENT",
      targetId: clientId,
      ip: getIp(req),
      userAgent: req.headers["user-agent"] || null
    });
    return removed;
  }
}

function getIp(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.ip;
}
