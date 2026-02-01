import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { FileEntity } from "./file.entity";
import { EnvService } from "../env/env.service";
import type { FileStatus } from "@sdisk/shared";
import fs from "node:fs";

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileEntity) private readonly repo: Repository<FileEntity>,
    private readonly env: EnvService
  ) {}

  async createUpload(params: {
    ownerId: string;
    originalName: string;
    storagePath: string;
    size: number;
    mimeType: string;
    approvalId?: string | null;
  }) {
    const file = this.repo.create({
      ownerId: params.ownerId,
      originalName: params.originalName,
      storagePath: params.storagePath,
      size: params.size,
      mimeType: params.mimeType,
      status: "PENDING",
      approvalId: params.approvalId ?? null,
      rejectionReason: null,
      activatedAt: null,
      expiresAt: null
    });
    return this.repo.save(file);
  }

  async setApprovalId(file: FileEntity, approvalId: string) {
    file.approvalId = approvalId;
    return this.repo.save(file);
  }

  async list(ownerId: string, status?: FileStatus, page = 1, size = 20) {
    const qb = this.repo.createQueryBuilder("file").where("file.ownerId = :ownerId", { ownerId });
    if (status) {
      qb.andWhere("file.status = :status", { status });
    }

    const [items, total] = await qb
      .orderBy("file.createdAt", "DESC")
      .skip((page - 1) * size)
      .take(size)
      .getManyAndCount();

    return { items, total, page, size };
  }

  async get(ownerId: string, id: string, role: string) {
    const file = await this.repo.findOne({ where: { id } });
    if (!file) throw new NotFoundException();
    if (file.ownerId !== ownerId && role !== "ADMIN") {
      throw new ForbiddenException();
    }
    return file;
  }

  async markApproved(file: FileEntity) {
    const expiryDays = await this.env.getExpiryDays();
    const activatedAt = new Date();
    const expiresAt = new Date(activatedAt.getTime() + expiryDays * 24 * 60 * 60 * 1000);

    file.status = "ACTIVE";
    file.activatedAt = activatedAt;
    file.expiresAt = expiresAt;
    file.rejectionReason = null;
    return this.repo.save(file);
  }

  async markRejected(file: FileEntity, reason?: string | null) {
    file.status = "REJECTED";
    file.rejectionReason = reason ?? null;
    return this.repo.save(file);
  }

  async markExpired(now = new Date()) {
    const result = await this.repo
      .createQueryBuilder()
      .update(FileEntity)
      .set({ status: "EXPIRED" })
      .where("status = :status", { status: "ACTIVE" })
      .andWhere("expiresAt IS NOT NULL")
      .andWhere("expiresAt <= :now", { now })
      .execute();

    return result.affected ?? 0;
  }

  async reapprove(ownerId: string, id: string) {
    const file = await this.get(ownerId, id, "USER");
    file.status = "PENDING";
    file.rejectionReason = null;
    file.activatedAt = null;
    file.expiresAt = null;
    file.approvalId = null;
    return this.repo.save(file);
  }

  async remove(ownerId: string, id: string, role: string) {
    const file = await this.get(ownerId, id, role);
    await this.repo.remove(file);
    try {
      await fs.promises.unlink(file.storagePath);
    } catch {
      return;
    }
  }
}
