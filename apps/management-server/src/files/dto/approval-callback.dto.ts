import { ApiProperty } from "@nestjs/swagger";

export class ApprovalCallbackDto {
  @ApiProperty({ example: "approval-123" })
  approvalId!: string;

  @ApiProperty({ enum: ["APPROVED", "REJECTED"], example: "APPROVED" })
  status!: "APPROVED" | "REJECTED";

  @ApiProperty({ required: false, example: "Missing policy" })
  reason?: string;
}
