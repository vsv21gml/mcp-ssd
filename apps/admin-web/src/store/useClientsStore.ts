import { create } from "zustand";
import type { OAuthClient, AdminUser } from "../lib/api";
import { fetchClients, createClient, updateClient, deleteClient, fetchUsers, updateUserRole } from "../lib/api";

interface ClientsState {
  items: OAuthClient[];
  users: AdminUser[];
  loading: boolean;
  fetchAll: () => Promise<void>;
  create: (payload: { clientId: string; clientSecret?: string | null; metadata: Record<string, any> }) => Promise<void>;
  update: (clientId: string, payload: { clientSecret?: string | null; metadata?: Record<string, any> }) => Promise<void>;
  remove: (clientId: string) => Promise<void>;
  updateRole: (id: string, role: "ADMIN" | "MEMBER") => Promise<void>;
}

export const useClientsStore = create<ClientsState>((set, get) => ({
  items: [],
  users: [],
  loading: false,
  fetchAll: async () => {
    set({ loading: true });
    const [clients, users] = await Promise.all([fetchClients(), fetchUsers()]);
    set({ items: clients, users, loading: false });
  },
  create: async (payload) => {
    set({ loading: true });
    await createClient(payload);
    await get().fetchAll();
    set({ loading: false });
  },
  update: async (clientId, payload) => {
    set({ loading: true });
    await updateClient(clientId, payload);
    await get().fetchAll();
    set({ loading: false });
  },
  remove: async (clientId) => {
    set({ loading: true });
    await deleteClient(clientId);
    await get().fetchAll();
    set({ loading: false });
  },
  updateRole: async (id, role) => {
    set({ loading: true });
    await updateUserRole(id, role);
    await get().fetchAll();
    set({ loading: false });
  }
}));
