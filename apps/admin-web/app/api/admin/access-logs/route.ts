import { NextResponse } from "next/server";

const ACCOUNT_API = process.env.ACCOUNT_API || "http://localhost:4001/oauth";

function buildHeaders(request: Request) {
  const headers: Record<string, string> = {};
  const auth = request.headers.get("authorization");
  if (auth) headers["authorization"] = auth;
  return headers;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.search;
  const res = await fetch(`${ACCOUNT_API}/admin/access-logs${query}`, {
    headers: buildHeaders(request)
  });
  const data = await res.text();
  return new NextResponse(data, { status: res.status, headers: { "Content-Type": "application/json" } });
}
