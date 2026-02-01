import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserEntity } from "./user.entity";
import type { UserRole } from "./user-role";

@Injectable()
export class UsersService {
  constructor(@InjectRepository(UserEntity) private readonly repo: Repository<UserEntity>) {}

  async ensureUser(user: { id: string; email?: string; name?: string }) {
    const existing = await this.repo.findOne({ where: { id: user.id } });
    if (existing) {
      existing.email = user.email ?? existing.email;
      existing.name = user.name ?? existing.name;
      return this.repo.save(existing);
    }

    return this.repo.save({
      id: user.id,
      email: user.email ?? null,
      name: user.name ?? null,
      role: "USER"
    });
  }

  async updateRole(id: string, role: UserRole) {
    const user = await this.repo.findOneOrFail({ where: { id } });
    user.role = role;
    return this.repo.save(user);
  }
}
