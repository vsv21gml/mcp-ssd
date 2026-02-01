import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: "oauth_clients" })
export class OAuthClientEntity {
  @PrimaryColumn("varchar")
  clientId!: string;

  @Column({ type: "varchar", nullable: true })
  clientSecret!: string | null;

  @Column({ type: "jsonb" })
  metadata!: Record<string, any>;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
