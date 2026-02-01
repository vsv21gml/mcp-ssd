const API_BASE = "/api";
const ACCOUNT_URL = process.env.NEXT_PUBLIC_ACCOUNT_URL || "http://localhost:4001";
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
  const url = new URL("/files", API_BASE);
  if (params.status) url.searchParams.set("status", params.status);
  if (params.page) url.searchParams.set("page", String(params.page));
  if (params.size) url.searchParams.set("size", String(params.size));

  const response = await apiFetch(url.pathname + url.search);
  if (!response.ok) throw new Error("Failed to load files");
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


