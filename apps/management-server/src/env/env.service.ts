import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EnvEntity } from "./env.entity";
import { DEFAULT_EXPIRY_DAYS } from "@sdisk/shared";

const EXPIRY_KEY = "FILE_EXPIRY_DAYS";

@Injectable()
export class EnvService {
  constructor(@InjectRepository(EnvEntity) private readonly repo: Repository<EnvEntity>) {}

  async list() {
    return this.repo.find();
  }

  async getExpiryDays() {
    const found = await this.repo.findOne({ where: { key: EXPIRY_KEY } });
    if (!found) return DEFAULT_EXPIRY_DAYS;
    const parsed = Number(found.value);
    return Number.isFinite(parsed) ? parsed : DEFAULT_EXPIRY_DAYS;
  }

  async set(key: string, value: string, description?: string | null) {
    const existing = await this.repo.findOne({ where: { key } });
    if (existing) {
      existing.value = value;
      existing.description = description ?? existing.description;
      return this.repo.save(existing);
    }
    return this.repo.save({ key, value, description: description ?? null });
  }
}

export { EXPIRY_KEY };
