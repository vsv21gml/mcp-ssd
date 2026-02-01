import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AccountUserEntity, AccountRole } from "./account-user.entity";

@Injectable()
export class UsersService {
  constructor(@InjectRepository(AccountUserEntity) private readonly repo: Repository<AccountUserEntity>) {}

  async ensureUser(user: { id: string; email?: string; name?: string }) {
    const existing = await this.repo.findOne({ where: { id: user.id } });
    if (existing) {
      existing.email = user.email ?? existing.email;
      existing.name = user.name ?? existing.name;
      return this.repo.save(existing);
    }

    const count = await this.repo.count();
    const role: AccountRole = count === 0 ? "ADMIN" : "MEMBER";
    return this.repo.save({
      id: user.id,
      email: user.email ?? null,
      name: user.name ?? null,
      role
    });
  }

  list() {
    return this.repo.find({ order: { createdAt: "DESC" } });
  }

  async updateRole(id: string, role: AccountRole) {
    const user = await this.repo.findOneOrFail({ where: { id } });
    user.role = role;
    return this.repo.save(user);
  }
}
