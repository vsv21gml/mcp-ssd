import { Body, Controller, Get, Param, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/roles.decorator";
import type { AccountRole } from "./account-user.entity";
import { CurrentUser } from "../auth/current-user.decorator";

@ApiTags("admin-users")
@ApiBearerAuth()
@Controller("/admin/users")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list() {
    return this.users.list();
  }

  @Put(":id/role")
  updateRole(@Param("id") id: string, @Body("role") role: AccountRole) {
    return this.users.updateRole(id, role);
  }

  @Get("me")
  me(@CurrentUser() user: any) {
    return user;
  }
}
