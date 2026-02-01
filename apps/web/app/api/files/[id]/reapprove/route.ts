import { NextResponse } from "next/server";

const MGMT_API = process.env.MANAGEMENT_API || "http://localhost:4002/api";

function buildHeaders(request: Request) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const auth = request.headers.get("authorization");
  if (auth) headers["authorization"] = auth;
  return headers;
}

export async function POST(request: Request, context: { params: { id: string } }) {
  const body = await request.text();
  const res = await fetch(`${MGMT_API}/files/${context.params.id}/reapprove`, {
    method: "POST",
    headers: buildHeaders(request),
    body
  });
  const data = await res.text();
  return new NextResponse(data, { status: res.status, headers: { "Content-Type": "application/json" } });
}
