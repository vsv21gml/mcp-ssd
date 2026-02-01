import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: "env_settings" })
export class EnvEntity {
  @PrimaryColumn("varchar")
  key!: string;

  @Column({ type: "varchar" })
  value!: string;

  @Column({ type: "varchar", nullable: true })
  description!: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
