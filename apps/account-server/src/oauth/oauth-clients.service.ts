import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { OAuthClientEntity } from "./entities/oauth-client.entity";

@Injectable()
export class OAuthClientsService {
  constructor(@InjectRepository(OAuthClientEntity) private readonly repo: Repository<OAuthClientEntity>) {}

  list() {
    return this.repo.find({ order: { createdAt: "DESC" } });
  }

  get(clientId: string) {
    return this.repo.findOne({ where: { clientId } });
  }

  async create(data: { clientId: string; clientSecret?: string | null; metadata: Record<string, any> }) {
    const existing = await this.repo.findOne({ where: { clientId: data.clientId } });
    if (existing) {
      existing.clientSecret = data.clientSecret ?? existing.clientSecret;
      existing.metadata = data.metadata;
      return this.repo.save(existing);
    }
    return this.repo.save({
      clientId: data.clientId,
      clientSecret: data.clientSecret ?? null,
      metadata: data.metadata
    });
  }

  async update(clientId: string, data: { clientSecret?: string | null; metadata?: Record<string, any> }) {
    const existing = await this.repo.findOneOrFail({ where: { clientId } });
    if (data.clientSecret !== undefined) existing.clientSecret = data.clientSecret;
    if (data.metadata) existing.metadata = data.metadata;
    return this.repo.save(existing);
  }

  async remove(clientId: string) {
    await this.repo.delete({ clientId });
    return { ok: true };
  }
}
