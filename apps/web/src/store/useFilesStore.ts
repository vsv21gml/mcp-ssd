import { create } from "zustand";
import { fetchFiles, uploadFile, reapproveFile, deleteFile } from "../lib/api";

export type FileStatus = "PENDING" | "REJECTED" | "ACTIVE" | "EXPIRED";

export interface FileRecord {
  id: string;
  originalName: string;
  size: number;
  mimeType: string;
  status: FileStatus;
  approvalId?: string | null;
  rejectionReason?: string | null;
  activatedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
}

interface FilesState {
  items: FileRecord[];
  total: number;
  page: number;
  size: number;
  status?: FileStatus;
  loading: boolean;
  selected?: FileRecord | null;
  fetch: (status?: FileStatus, page?: number) => Promise<void>;
  upload: (file: File, approverIds: string[]) => Promise<void>;
  reapprove: (id: string, approverIds: string[]) => Promise<void>;
  remove: (id: string) => Promise<void>;
  select: (file: FileRecord | null) => void;
}

export const useFilesStore = create<FilesState>((set, get) => ({
  items: [],
  total: 0,
  page: 1,
  size: 10,
  status: undefined,
  loading: false,
  selected: null,
  select: (file) => set({ selected: file }),
  fetch: async (status, page = 1) => {
    set({ loading: true, status, page });
    const data = await fetchFiles({ status, page, size: get().size });
    set({
      items: data.items,
      total: data.total,
      page: data.page,
      size: data.size,
      loading: false
    });
  },
  upload: async (file, approverIds) => {
    set({ loading: true });
    await uploadFile(file, approverIds);
    await get().fetch(get().status, get().page);
    set({ loading: false });
  },
  reapprove: async (id, approverIds) => {
    set({ loading: true });
    await reapproveFile(id, approverIds);
    await get().fetch(get().status, get().page);
    set({ loading: false });
  },
  remove: async (id) => {
    set({ loading: true });
    await deleteFile(id);
    await get().fetch(get().status, get().page);
    set({ loading: false });
  }
}));


