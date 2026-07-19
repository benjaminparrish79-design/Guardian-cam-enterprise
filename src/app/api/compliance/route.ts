import { NextRequest, NextResponse } from "next/server";
import { dbClient } from "@/lib/db-client";
import { complianceSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { requireRole } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireRole("admin", "operator", "inspector");
    if (!ctx) return NextResponse.json({ error: "Forbidden", message: "Adequate privilege role required." }, { status: 403 });

    const data = await dbClient.getComplianceRecords(ctx.organizationId);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch compliance records" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (!rateLimit(ip, 10, 60000).success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const ctx = await requireRole("admin", "inspector");
    if (!ctx) return NextResponse.json({ error: "Forbidden", message: "Only admin and inspector roles can create compliance records." }, { status: 403 });

    const body = await req.json();
    const validated = complianceSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: "Invalid compliance data", details: validated.error.format() }, { status: 400 });
    }

    await dbClient.addComplianceRecord(validated.data, ctx.organizationId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to create compliance record" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const ctx = await requireRole("admin", "inspector");
    if (!ctx) return NextResponse.json({ error: "Forbidden", message: "Only admin and inspector roles can update compliance records." }, { status: 403 });

    const body = await req.json();
    const { id, ...updatedFields } = body;
    if (!id) {
      return NextResponse.json({ error: "Record ID is required for update" }, { status: 400 });
    }

    await dbClient.updateComplianceRecord(id, updatedFields, ctx.organizationId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update compliance record" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const ctx = await requireRole("admin", "inspector");
    if (!ctx) return NextResponse.json({ error: "Forbidden", message: "Only admin and inspector roles can delete compliance records." }, { status: 403 });

    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch (e) {
        // Body reading failed, ignore
      }
    }

    if (!id) {
      return NextResponse.json({ error: "Record ID is required for deletion" }, { status: 400 });
    }

    await dbClient.deleteComplianceRecord(id, ctx.organizationId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to delete compliance record" }, { status: 500 });
  }
}
