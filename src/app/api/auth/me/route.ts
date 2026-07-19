import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: ctx.userId,
        email: ctx.email,
        role: ctx.role,
        organizationId: ctx.organizationId,
        organizationName: "GuardianCam Secure CommandCenter",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch session context" }, { status: 500 });
  }
}
