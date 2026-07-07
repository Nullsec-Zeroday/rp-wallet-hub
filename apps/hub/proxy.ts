import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Only the canonical host should be indexable. Preview deploys (*.vercel.app)
// and any other alias get X-Robots-Tag: noindex to prevent duplicate content.
const CANONICAL_HOST = "rpwallet.app";

export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0];
  const response = NextResponse.next();

  if (host !== CANONICAL_HOST) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
