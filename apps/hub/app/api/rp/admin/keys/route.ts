import { NextResponse } from "next/server";
import {
  checkAdminAuth,
  createLicenseKey,
  getAdminAllowedDevices,
  resolveAdminLicenseExpiry,
} from "@/lib/admin-license-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authError = checkAdminAuth(request);
  if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

  let body: {
    email?: string;
    plan?: string;
    expiresAt?: string;
    durationDays?: number;
    allowedDevices?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const plan = body.plan?.trim() || "Most Popular";
  const expiresAt = resolveAdminLicenseExpiry(body);
  if (!expiresAt) {
    return NextResponse.json({ error: "expiresAt or durationDays is required" }, { status: 400 });
  }

  const email = body.email?.trim() || undefined;

  try {
    const created = await createLicenseKey({
      email,
      plan,
      expiresAt,
      allowedDevices: getAdminAllowedDevices(plan, body.allowedDevices),
    });

    // Email delivery is handled by the standalone worker API (Resend). It is not
    // wired up in this hub-local path, so we report the key without emailing it.
    return NextResponse.json({
      ...created,
      emailSent: false,
    });
  } catch (error) {
    console.error("[admin-keys] Failed to create license key", error);
    return NextResponse.json({ error: "Failed to create license key" }, { status: 500 });
  }
}
