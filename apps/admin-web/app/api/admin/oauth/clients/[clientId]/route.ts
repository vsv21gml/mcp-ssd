import { NextResponse } from "next/server";

const ACCOUNT_API = process.env.ACCOUNT_API || "http://localhost:4001";

function buildHeaders(request: Request) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const auth = request.headers.get("authorization");
  if (auth) headers["authorization"] = auth;
  return headers;
}

export async function PUT(request: Request, context: { params: { clientId: string } }) {
  const body = await request.text();
  const res = await fetch(`${ACCOUNT_API}/admin/oauth/clients/${context.params.clientId}`, {
    method: "PUT",
    headers: buildHeaders(request),
    body
  });
  const data = await res.text();
  return new NextResponse(data, { status: res.status, headers: { "Content-Type": "application/json" } });
}

export async function DELETE(request: Request, context: { params: { clientId: string } }) {
  const res = await fetch(`${ACCOUNT_API}/admin/oauth/clients/${context.params.clientId}`, {
    method: "DELETE",
    headers: buildHeaders(request)
  });
  const data = await res.text();
  return new NextResponse(data, { status: res.status, headers: { "Content-Type": "application/json" } });
}