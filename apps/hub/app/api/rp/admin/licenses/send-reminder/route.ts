import { NextResponse } from "next/server";
import { checkAdminAuth, lookupLicense } from "@/lib/admin-license-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Email delivery (Resend) lives in the standalone worker API. This hub-local
 * route validates the license exists but reports that email sending is not
 * configured here, rather than failing with an opaque proxy error.
 */
export async function POST(request: Request) {
  const authError = checkAdminAuth(request);
  if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

  let body: { licenseKey?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const licenseKey = body.licenseKey?.trim();
  if (!licenseKey) return NextResponse.json({ error: "licenseKey is required" }, { status: 400 });

  const snapshot = await lookupLicense(licenseKey);
  if (!snapshot) return NextResponse.json({ error: "License not found" }, { status: 404 });

  return NextResponse.json(
    { error: "Email reminders are not configured in this environment. Deploy the worker API with Resend to send reminder emails." },
    { status: 503 },
  );
}
