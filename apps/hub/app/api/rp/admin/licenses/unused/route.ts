import { NextResponse } from "next/server";
import { checkAdminAuth, getUnusedActiveLicenses } from "@/lib/admin-license-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authError = checkAdminAuth(request);
  if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

  try {
    const licenses = await getUnusedActiveLicenses();
    return NextResponse.json({ licenses });
  } catch (error) {
    console.error("[admin-keys] Failed to list unused licenses", error);
    return NextResponse.json({ error: "Failed to list unused licenses" }, { status: 500 });
  }
}
