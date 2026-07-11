import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const VISITOR_COOKIE = "rp_affiliate_visitor_id";

export async function GET(request: NextRequest, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.rpwallet.us";
  const redirectUrl = new URL(`/affiliate/redirect/${encodeURIComponent(code)}`, apiBaseUrl);
  const existingVisitorId = request.cookies.get(VISITOR_COOKIE)?.value;
  const visitorId = existingVisitorId && /^afv_[a-f0-9]{18}$/.test(existingVisitorId)
    ? existingVisitorId
    : `afv_${crypto.randomUUID().replace(/-/g, "").slice(0, 18)}`;
  redirectUrl.searchParams.set("v", visitorId);

  const response = NextResponse.redirect(redirectUrl, 307);
  if (visitorId !== existingVisitorId) {
    response.cookies.set(VISITOR_COOKIE, visitorId, {
      maxAge: 45 * 24 * 60 * 60,
      path: "/",
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
    });
  }
  return response;
}
