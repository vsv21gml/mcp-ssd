import { Body, Controller, Get, Param, Put, UseGuards } from "@nestjs/common";
import { EnvService } from "./env.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";

@Controller("/env")
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnvController {
  constructor(private readonly env: EnvService) {}

  @Get()
  @Roles("ADMIN")
  list() {
    return this.env.list();
  }

  @Put(":key")
  @Roles("ADMIN")
  update(@Param("key") key: string, @Body("value") value: string, @Body("description") description?: string) {
    return this.env.set(key, value, description ?? null);
  }
}
