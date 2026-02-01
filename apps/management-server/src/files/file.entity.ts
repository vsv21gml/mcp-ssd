import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import type { FileStatus } from "@sdisk/shared";

@Entity({ name: "files" })
export class FileEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  ownerId!: string;

  @Column({ type: "varchar" })
  originalName!: string;

  @Column({ type: "varchar" })
  storagePath!: string;

  @Column({ type: "bigint" })
  size!: number;

  @Column({ type: "varchar" })
  mimeType!: string;

  @Column({ type: "varchar" })
  status!: FileStatus;

  @Column({ type: "varchar", nullable: true })
  approvalId!: string | null;

  @Column({ type: "varchar", nullable: true })
  rejectionReason!: string | null;

  @Column({ type: "timestamptz", nullable: true })
  activatedAt!: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  expiresAt!: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
