import { NextResponse } from "next/server";
import { checkAdminAuth, lookupLicense } from "@/lib/admin-license-store";

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
    const snapshot = await lookupLicense(licenseKey);
    if (!snapshot) return NextResponse.json({ error: "License not found" }, { status: 404 });
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("[admin-keys] Lookup failed", error);
    return NextResponse.json({ error: "License lookup failed" }, { status: 500 });
  }
}
