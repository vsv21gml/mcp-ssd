import { ApiProperty } from "@nestjs/swagger";

export class OAuthClientDto {
  @ApiProperty()
  clientId!: string;

  @ApiProperty({ required: false })
  clientSecret?: string | null;

  @ApiProperty({ type: Object })
  metadata!: Record<string, any>;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
