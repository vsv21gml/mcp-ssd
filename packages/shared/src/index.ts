export type FileStatus = "PENDING" | "REJECTED" | "ACTIVE" | "EXPIRED";

export interface FileRecord {
  id: string;
  ownerId: string;
  originalName: string;
  storagePath: string;
  size: number;
  mimeType: string;
  status: FileStatus;
  approvalId?: string | null;
  rejectionReason?: string | null;
  activatedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EnvSetting {
  key: string;
  value: string;
  description?: string | null;
  updatedAt: string;
}

export const DEFAULT_EXPIRY_DAYS = 30;
