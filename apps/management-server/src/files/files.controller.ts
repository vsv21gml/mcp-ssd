import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  Req
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { ConfigService } from "@nestjs/config";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { FilesService } from "./files.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { ApprovalService } from "./approval.service";
import type { FileStatus } from "@sdisk/shared";
import { Public } from "../auth/public.decorator";
import { ApiTags, ApiBody } from "@nestjs/swagger";
import { ApprovalCallbackDto } from "./dto/approval-callback.dto";
import { AuditLogsService } from "../audit/audit-logs.service";
import type { Request } from "express";

@ApiTags("files")
@Controller("/files")
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(
    private readonly files: FilesService,
    private readonly approvals: ApprovalService,
    private readonly config: ConfigService,
    private readonly auditLogs: AuditLogsService
  ) {}

  @Get()
  list(
    @CurrentUser("id") userId: string,
    @Query("status") status?: FileStatus,
    @Query("page") page = "1",
    @Query("size") size = "20"
  ) {
    return this.files.list(userId, status, Number(page), Number(size));
  }

  @Get(":id")
  get(@CurrentUser("id") userId: string, @CurrentUser("role") role: string, @Param("id") id: string) {
    return this.files.get(userId, id, role);
  }

  @Post("upload")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage()
    })
  )
  async upload(
    @CurrentUser("id") userId: string,
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Body("approverIds") approverIdsRaw: any,
    @Req() req: Request
  ) {
    const approverIds = parseApproverIds(approverIdsRaw);
    if (approverIds.length === 0) {
      throw new BadRequestException("approverIds required");
    }
    const storageRoot = this.config.get<string>("STORAGE_ROOT", "./storage");
    fs.mkdirSync(storageRoot, { recursive: true });
    const filename = `${crypto.randomUUID()}${path.extname(file.originalname)}`;
    const storagePath = path.join(storageRoot, filename);
    await fs.promises.writeFile(storagePath, file.buffer);

    const originalName = decodeFilename(file.originalname);
    const record = await this.files.createUpload({
      ownerId: userId,
      originalName,
      storagePath,
      size: file.size,
      mimeType: file.mimetype
    });

    const approvalId = await this.approvals.submitApproval(record, approverIds);
    const saved = await this.files.setApprovalId(record, approvalId);
    await this.auditLogs.create({
      actorId: userId,
      actorEmail: user?.email,
      actorRole: user?.role,
      action: "FILE_UPLOAD",
      targetType: "FILE",
      targetId: saved.id,
      metadata: { originalName, size: file.size, mimeType: file.mimetype },
      ip: getIp(req),
      userAgent: req.headers["user-agent"] || null
    });
    return saved;
  }

  @Post(":id/reapprove")
  async reapprove(
    @CurrentUser("id") userId: string,
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body("approverIds") approverIdsRaw: any,
    @Req() req: Request
  ) {
    const approverIds = parseApproverIds(approverIdsRaw);
    if (approverIds.length === 0) {
      throw new BadRequestException("approverIds required");
    }
    const file = await this.files.reapprove(userId, id);
    const approvalId = await this.approvals.submitApproval(file, approverIds);
    const saved = await this.files.setApprovalId(file, approvalId);
    await this.auditLogs.create({
      actorId: userId,
      actorEmail: user?.email,
      actorRole: user?.role,
      action: "FILE_REAPPROVE",
      targetType: "FILE",
      targetId: saved.id,
      metadata: { approvalId },
      ip: getIp(req),
      userAgent: req.headers["user-agent"] || null
    });
    return saved;
  }

  @Delete(":id")
  async remove(
    @CurrentUser("id") userId: string,
    @CurrentUser() user: any,
    @CurrentUser("role") role: string,
    @Param("id") id: string,
    @Req() req: Request
  ) {
    const removed = await this.files.remove(userId, id, role);
    await this.auditLogs.create({
      actorId: userId,
      actorEmail: user?.email,
      actorRole: user?.role,
      action: "FILE_DELETE",
      targetType: "FILE",
      targetId: id,
      ip: getIp(req),
      userAgent: req.headers["user-agent"] || null
    });
    return removed;
  }

  @Post("approvals/callback")
  @Public()
  @ApiBody({ type: ApprovalCallbackDto })
  callback(@Body() body: ApprovalCallbackDto) {
    return this.approvals.handleCallback(body as any);
  }
}

function parseApproverIds(input: any): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.map(String).filter(Boolean);
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      return input.split(",").map((v) => v.trim()).filter(Boolean);
    }
  }
  return [];
}

function decodeFilename(name: string): string {
  if (!name) return name;
  try {
    const latin = Buffer.from(name, "latin1").toString("utf8");
    // If decoding produces replacement chars, keep original.
    return latin.includes("\uFFFD") ? name : latin;
  } catch {
    return name;
  }
}

function getIp(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.ip;
}
