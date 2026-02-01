import { ApiProperty } from "@nestjs/swagger";

export class UpdateClientDto {
  @ApiProperty({ required: false })
  clientSecret?: string | null;

  @ApiProperty({ type: Object, required: false })
  metadata?: Record<string, any>;
}
