import { NextResponse } from "next/server";
import { checkAdminAuth, resetLicenseAccess } from "@/lib/admin-license-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  try {
    const result = await resetLicenseAccess(licenseKey);
    if (!result) return NextResponse.json({ error: "License not found" }, { status: 404 });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[admin-keys] Failed to reset access", error);
    return NextResponse.json({ error: "Failed to reset access" }, { status: 500 });
  }
}
