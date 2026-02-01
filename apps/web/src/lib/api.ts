const API_BASE = "/api";
const RAW_ACCOUNT_URL = process.env.NEXT_PUBLIC_ACCOUNT_URL || "http://localhost:4001/oauth";
const ACCOUNT_URL = RAW_ACCOUNT_URL.includes("/oauth")
  ? RAW_ACCOUNT_URL
  : `${RAW_ACCOUNT_URL.endsWith("/") ? RAW_ACCOUNT_URL.slice(0, -1) : RAW_ACCOUNT_URL}/oauth`;
const SSO_PROVIDER = (process.env.NEXT_PUBLIC_SSO_PROVIDER || "oidc").toLowerCase();

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("sdisk_access_token");
}

export function setAccessToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("sdisk_access_token", token);
}

export function clearAccessToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("sdisk_access_token");
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
    redirectToSso();
  }

  return response;
}

export async function fetchMe() {
  const response = await apiFetch("/users/me");
  if (!response.ok) throw new Error("Unauthorized");
  return response.json();
}

export async function fetchFiles(params: { status?: string; page?: number; size?: number }) {
  const base = typeof window === "undefined" ? "http://localhost" : window.location.origin;
  const url = new URL(`${API_BASE}/files`, base);
  if (params.status) url.searchParams.set("status", params.status);
  if (params.page) url.searchParams.set("page", String(params.page));
  if (params.size) url.searchParams.set("size", String(params.size));

  const response = await apiFetch(url.pathname + url.search);
  if (response.status === 401) {
    return { items: [], total: 0, page: params.page || 1, size: params.size || 10 };
  }
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to load files");
  }
  return response.json();
}

export async function uploadFile(file: File, approverIds: string[]) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("approverIds", JSON.stringify(approverIds));

  const response = await apiFetch("/files", {
    method: "POST",
    body: formData
  });

  if (!response.ok) throw new Error("Upload failed");
  return response.json();
}

export async function reapproveFile(id: string, approverIds: string[]) {
  const response = await apiFetch(`/files/${id}/reapprove`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ approverIds })
  });

  if (!response.ok) throw new Error("Reapprove failed");
  return response.json();
}

export async function deleteFile(id: string) {
  const response = await apiFetch(`/files/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Delete failed");
  return true;
}

export async function fetchApprovalStatus(id: string) {
  const response = await apiFetch(`/files/${id}`);
  if (!response.ok) throw new Error("Failed to load approval");
  return response.json();
}


