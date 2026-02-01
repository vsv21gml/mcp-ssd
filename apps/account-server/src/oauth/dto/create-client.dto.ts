import { ApiProperty } from "@nestjs/swagger";

export class CreateClientDto {
  @ApiProperty({ example: "chatgpt-apps" })
  clientId!: string;

  @ApiProperty({ example: "change-me", required: false })
  clientSecret?: string | null;

  @ApiProperty({ type: Object })
  metadata!: Record<string, any>;
}
