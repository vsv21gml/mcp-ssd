import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { OAuthClientsService } from "./oauth-clients.service";
import { CreateClientDto } from "./dto/create-client.dto";
import { UpdateClientDto } from "./dto/update-client.dto";

@ApiTags("oauth-clients")
@ApiBearerAuth()
@Controller("/admin/oauth/clients")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class OAuthClientsController {
  constructor(private readonly clients: OAuthClientsService) {}

  @Get()
  list() {
    return this.clients.list();
  }

  @Get(":clientId")
  get(@Param("clientId") clientId: string) {
    return this.clients.get(clientId);
  }

  @Post()
  create(@Body() body: CreateClientDto) {
    return this.clients.create(body);
  }

  @Put(":clientId")
  update(@Param("clientId") clientId: string, @Body() body: UpdateClientDto) {
    return this.clients.update(clientId, body);
  }

  @Delete(":clientId")
  remove(@Param("clientId") clientId: string) {
    return this.clients.remove(clientId);
  }
}
