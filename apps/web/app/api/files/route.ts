import { NextResponse } from "next/server";

const MGMT_API = process.env.MANAGEMENT_API || "http://localhost:4002";

function buildHeaders(request: Request) {
  const headers: Record<string, string> = {};
  const auth = request.headers.get("authorization");
  if (auth) headers["authorization"] = auth;
  return headers;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const res = await fetch(`${MGMT_API}/files${url.search}`, {
    headers: buildHeaders(request)
  });
  const data = await res.text();
  return new NextResponse(data, { status: res.status, headers: { "Content-Type": "application/json" } });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const res = await fetch(`${MGMT_API}/files/upload`, {
    method: "POST",
    headers: buildHeaders(request),
    body: formData
  });
  const data = await res.text();
  return new NextResponse(data, { status: res.status, headers: { "Content-Type": "application/json" } });
}

