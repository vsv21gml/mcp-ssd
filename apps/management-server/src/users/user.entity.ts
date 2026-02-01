import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";
import type { UserRole } from "./user-role";

@Entity({ name: "users" })
export class UserEntity {
  @PrimaryColumn("varchar")
  id!: string;

  @Column({ type: "varchar", nullable: true })
  email!: string | null;

  @Column({ type: "varchar", nullable: true })
  name!: string | null;

  @Column({ type: "varchar", default: "USER" })
  role!: UserRole;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
