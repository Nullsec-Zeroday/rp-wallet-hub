import { apiDefaults } from "@rp-wallet/config";
import { NextRequest, NextResponse } from "next/server";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "host",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
]);

function getApiBaseUrl() {
  const configured =
    process.env.API_PROXY_TARGET_URL ||
    (process.env.NODE_ENV === "production" ? apiDefaults.productionBaseUrl : apiDefaults.localBaseUrl);

  return configured.startsWith("/") ? apiDefaults.productionBaseUrl : configured.replace(/\/+$/, "");
}

async function proxyRequest(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const params = await context.params;
  const path = params.path?.join("/") || "";
  const incomingUrl = new URL(request.url);
  const upstreamUrl = new URL(`${getApiBaseUrl()}/${path}`);
  upstreamUrl.search = incomingUrl.search;

  const headers = new Headers(request.headers);
  for (const header of HOP_BY_HOP_HEADERS) headers.delete(header);
  headers.set("origin", incomingUrl.origin);

  const upstreamResponse = await fetch(upstreamUrl, {
    body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
    cache: "no-store",
    credentials: "include",
    headers,
    method: request.method,
    redirect: "manual",
  });

  const responseHeaders = new Headers(upstreamResponse.headers);
  for (const header of HOP_BY_HOP_HEADERS) responseHeaders.delete(header);

  return new NextResponse(upstreamResponse.body, {
    headers: responseHeaders,
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
