import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLogEntity } from "./audit-log.entity";

@Injectable()
export class AuditLogsService {
  constructor(@InjectRepository(AuditLogEntity) private readonly repo: Repository<AuditLogEntity>) {}

  async create(entry: {
    actorId: string;
    actorEmail?: string | null;
    actorRole?: string | null;
    action: string;
    targetType?: string | null;
    targetId?: string | null;
    metadata?: Record<string, any> | null;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    const record = this.repo.create({
      actorId: entry.actorId,
      actorEmail: entry.actorEmail ?? null,
      actorRole: entry.actorRole ?? null,
      action: entry.action,
      targetType: entry.targetType ?? null,
      targetId: entry.targetId ?? null,
      metadata: entry.metadata ?? null,
      ip: entry.ip ?? null,
      userAgent: entry.userAgent ?? null
    });
    return this.repo.save(record);
  }

  async list(page = 1, size = 50) {
    const [items, total] = await this.repo.findAndCount({
      order: { createdAt: "DESC" },
      take: size,
      skip: (page - 1) * size
    });
    return { items, total, page, size };
  }
}
