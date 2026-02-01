import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AccessLogEntity } from "./access-log.entity";

@Injectable()
export class AccessLogsService {
  constructor(@InjectRepository(AccessLogEntity) private readonly repo: Repository<AccessLogEntity>) {}

  async create(entry: {
    userId?: string | null;
    email?: string | null;
    name?: string | null;
    provider?: string | null;
    action: string;
    ip?: string | null;
    userAgent?: string | null;
    metadata?: Record<string, any> | null;
  }) {
    const record = this.repo.create({
      userId: entry.userId ?? null,
      email: entry.email ?? null,
      name: entry.name ?? null,
      provider: entry.provider ?? null,
      action: entry.action,
      ip: entry.ip ?? null,
      userAgent: entry.userAgent ?? null,
      metadata: entry.metadata ?? null
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
