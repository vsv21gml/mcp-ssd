const API_BASE = "/api";
const RAW_ACCOUNT_URL = process.env.NEXT_PUBLIC_ACCOUNT_URL || "http://localhost:4001/oauth";
const ACCOUNT_URL = RAW_ACCOUNT_URL.includes("/oauth")
  ? RAW_ACCOUNT_URL
  : `${RAW_ACCOUNT_URL.endsWith("/") ? RAW_ACCOUNT_URL.slice(0, -1) : RAW_ACCOUNT_URL}/oauth`;
const SSO_PROVIDER = (process.env.NEXT_PUBLIC_SSO_PROVIDER || "saml").toLowerCase();

export interface OAuthClient {
  clientId: string;
  clientSecret?: string | null;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  email?: string | null;
  name?: string | null;
  role: "ADMIN" | "MEMBER";
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorEmail?: string | null;
  actorRole?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, any> | null;
  ip?: string | null;
  userAgent?: string | null;
  createdAt: string;
  source?: "account" | "management";
}

export interface AccessLog {
  id: string;
  userId?: string | null;
  email?: string | null;
  name?: string | null;
  provider?: string | null;
  action: string;
  ip?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("sdisk_admin_token");
}

export function setAccessToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("sdisk_admin_token", token);
}

export function clearAccessToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("sdisk_admin_token");
}

export async function logout() {
  if (typeof window === "undefined") return;
  const token = getAccessToken();
  if (!token) return;
  try {
    await fetch(`${ACCOUNT_URL}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch {
    return;
  }
}

export function redirectToSso() {
  if (typeof window === "undefined") return;
  const redirect = encodeURIComponent(window.location.href);
  const path = SSO_PROVIDER === "saml" ? "saml" : "oidc";
  window.location.href = `${ACCOUNT_URL}/auth/sso/${path}?redirect=${redirect}`;
}

export function captureTokenFromUrl() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  const token = url.searchParams.get("token");
  if (token) {
    setAccessToken(token);
    url.searchParams.delete("token");
    window.history.replaceState({}, "", url.toString());
  }
}

async function apiFetch(path: string, init: RequestInit = {}) {
  const token = getAccessToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  if (response.status === 401) {
    throw new Error("Unauthorized");
  }

  return response;
}

export async function fetchMe() {
  const response = await apiFetch("/admin/users/me");
  if (!response.ok) throw new Error("Unauthorized");
  return response.json();
}

export async function fetchUsers() {
  const response = await apiFetch("/admin/users");
  if (!response.ok) throw new Error("Failed to load users");
  return response.json();
}

export async function updateUserRole(id: string, role: "ADMIN" | "MEMBER") {
  const response = await apiFetch(`/admin/users/${id}/role`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role })
  });
  if (!response.ok) throw new Error("Update failed");
  return response.json();
}

export async function fetchClients() {
  const response = await apiFetch("/admin/oauth/clients");
  if (!response.ok) throw new Error("Failed to load clients");
  return response.json();
}

export async function createClient(payload: {
  clientId: string;
  clientSecret?: string | null;
  metadata: Record<string, any>;
}) {
  const response = await apiFetch("/admin/oauth/clients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error("Create failed");
  return response.json();
}

export async function updateClient(
  clientId: string,
  payload: { clientSecret?: string | null; metadata?: Record<string, any> }
) {
  const response = await apiFetch(`/admin/oauth/clients/${clientId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error("Update failed");
  return response.json();
}

export async function deleteClient(clientId: string) {
  const response = await apiFetch(`/admin/oauth/clients/${clientId}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Delete failed");
  return true;
}

export async function fetchAuditLogs(page = 1, size = 50) {
  const response = await apiFetch(`/admin/audit-logs?page=${page}&size=${size}`);
  if (!response.ok) throw new Error("Failed to load audit logs");
  return response.json();
}

export async function fetchAccessLogs(page = 1, size = 50) {
  const response = await apiFetch(`/admin/access-logs?page=${page}&size=${size}`);
  if (!response.ok) throw new Error("Failed to load access logs");
  return response.json();
}
