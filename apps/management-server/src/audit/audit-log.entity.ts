import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "management_audit_logs" })
export class AuditLogEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  actorId!: string;

  @Column({ type: "text", nullable: true })
  actorEmail!: string | null;

  @Column({ type: "text", nullable: true })
  actorRole!: string | null;

  @Column({ type: "text" })
  action!: string;

  @Column({ type: "text", nullable: true })
  targetType!: string | null;

  @Column({ type: "text", nullable: true })
  targetId!: string | null;

  @Column({ type: "jsonb", nullable: true })
  metadata!: Record<string, any> | null;

  @Column({ type: "text", nullable: true })
  ip!: string | null;

  @Column({ type: "text", nullable: true })
  userAgent!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
