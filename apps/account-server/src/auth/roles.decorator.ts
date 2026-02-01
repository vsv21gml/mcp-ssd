import { SetMetadata } from "@nestjs/common";
import type { AccountRole } from "../users/account-user.entity";

export const ROLES_KEY = "roles";
export const Roles = (...roles: AccountRole[]) => SetMetadata(ROLES_KEY, roles);
