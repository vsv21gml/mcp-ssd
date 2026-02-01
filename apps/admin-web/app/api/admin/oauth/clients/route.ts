import { NextResponse } from "next/server";

const ACCOUNT_API = process.env.ACCOUNT_API || "http://localhost:4001/oauth";

function buildHeaders(request: Request) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const auth = request.headers.get("authorization");
  if (auth) headers["authorization"] = auth;
  return headers;
}

export async function GET(request: Request) {
  const res = await fetch(`${ACCOUNT_API}/admin/oauth/clients`, {
    headers: buildHeaders(request)
  });
  const data = await res.text();
  return new NextResponse(data, { status: res.status, headers: { "Content-Type": "application/json" } });
}

export async function POST(request: Request) {
  const body = await request.text();
  const res = await fetch(`${ACCOUNT_API}/admin/oauth/clients`, {
    method: "POST",
    headers: buildHeaders(request),
    body
  });
  const data = await res.text();
  return new NextResponse(data, { status: res.status, headers: { "Content-Type": "application/json" } });
}
