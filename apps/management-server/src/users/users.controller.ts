import { Body, Controller, Get, Param, Put, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import type { UserRole } from "./user-role";
import { CurrentUser } from "../auth/current-user.decorator";

@Controller("/users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get("me")
  me(@CurrentUser() user: any) {
    return user;
  }

  @Put(":id/role")
  @Roles("ADMIN")
  updateRole(@Param("id") id: string, @Body("role") role: UserRole) {
    return this.users.updateRole(id, role);
  }
}
