import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

export type AccountRole = "ADMIN" | "MEMBER";

@Entity({ name: "account_users" })
export class AccountUserEntity {
  @PrimaryColumn("varchar")
  id!: string;

  @Column({ type: "varchar", nullable: true })
  email!: string | null;

  @Column({ type: "varchar", nullable: true })
  name!: string | null;

  @Column({ type: "varchar", default: "MEMBER" })
  role!: AccountRole;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
