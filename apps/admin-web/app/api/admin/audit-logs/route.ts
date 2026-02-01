import { NextResponse } from "next/server";

const ACCOUNT_API = process.env.ACCOUNT_API || "http://localhost:4001/oauth";
const MANAGEMENT_API = process.env.MANAGEMENT_API || "http://localhost:4002/api";

function buildHeaders(request: Request) {
  const headers: Record<string, string> = {};
  const auth = request.headers.get("authorization");
  if (auth) headers["authorization"] = auth;
  return headers;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") || "1");
  const size = Number(url.searchParams.get("size") || "50");
  const query = `?page=${page}&size=${size}`;

  const headers = buildHeaders(request);
  const [accountRes, mgmtRes] = await Promise.allSettled([
    fetch(`${ACCOUNT_API}/admin/audit-logs${query}`, { headers }),
    fetch(`${MANAGEMENT_API}/admin/audit-logs${query}`, { headers })
  ]);

  const accountData =
    accountRes.status === "fulfilled" && accountRes.value.ok ? await accountRes.value.json() : { items: [] };
  const mgmtData =
    mgmtRes.status === "fulfilled" && mgmtRes.value.ok ? await mgmtRes.value.json() : { items: [] };

  const items = [
    ...(accountData.items || []).map((item: any) => ({ ...item, source: "account" })),
    ...(mgmtData.items || []).map((item: any) => ({ ...item, source: "management" }))
  ].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const start = (page - 1) * size;
  const sliced = items.slice(start, start + size);

  return NextResponse.json({
    items: sliced,
    total: items.length,
    page,
    size
  });
}
