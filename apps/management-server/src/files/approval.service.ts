import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { FileEntity } from "./file.entity";
import { FilesService } from "./files.service";
import crypto from "node:crypto";

@Injectable()
export class ApprovalService {
  constructor(
    private readonly config: ConfigService,
    private readonly files: FilesService,
    @InjectRepository(FileEntity) private readonly repo: Repository<FileEntity>
  ) {}

  async submitApproval(file: FileEntity, approverIds: string[]) {
    const apiBase = this.config.get<string>("APPROVAL_API_BASE");
    const apiToken = this.config.get<string>("APPROVAL_API_TOKEN");

    if (!apiBase) {
      return `dev-${crypto.randomUUID()}`;
    }

    const response = await fetch(`${apiBase}/approvals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiToken ? `Bearer ${apiToken}` : ""
      },
      body: JSON.stringify({
        fileId: file.id,
        fileName: file.originalName,
        ownerId: file.ownerId,
        approverIds
      })
    });

    if (!response.ok) {
      throw new Error(`Approval API failed: ${response.status}`);
    }

    const payload = await response.json();
    return payload.approvalId as string;
  }

  async handleCallback(payload: { approvalId: string; status: "APPROVED" | "REJECTED"; reason?: string }) {
    const file = await this.repo.findOne({ where: { approvalId: payload.approvalId } });
    if (!file) throw new NotFoundException();

    if (payload.status === "APPROVED") {
      return this.files.markApproved(file);
    }
    return this.files.markRejected(file, payload.reason ?? null);
  }
}
