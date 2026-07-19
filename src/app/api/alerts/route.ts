import { NextRequest, NextResponse } from "next/server";
import { dbClient } from "@/lib/db-client";
import { SecurityAlert } from "@/types";
import { alertSchema } from "@/lib/validations";
import { requireRole } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireRole("admin", "operator", "inspector");
    if (!ctx) return NextResponse.json({ error: "Forbidden", message: "Adequate privilege role required." }, { status: 403 });

    const data = await dbClient.getAlerts(ctx.organizationId);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireRole("admin", "operator");
    if (!ctx) return NextResponse.json({ error: "Forbidden", message: "Only admin and operator roles can create alerts." }, { status: 403 });

    const body = await req.json();
    const validation = alertSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid alert data", details: validation.error.format() }, { status: 400 });
    }

    await dbClient.addAlert({ ...validation.data, organizationId: ctx.organizationId } as SecurityAlert, ctx.organizationId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const ctx = await requireRole("admin", "operator");
    if (!ctx) return NextResponse.json({ error: "Forbidden", message: "Only admin and operator roles can update alerts." }, { status: 403 });

    const body = await req.json();
    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const validation = alertSchema.partial().safeParse(fields);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid alert data", details: validation.error.format() }, { status: 400 });
    }

    await dbClient.updateAlert(id, validation.data, ctx.organizationId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const ctx = await requireRole("admin", "operator");
    if (!ctx) return NextResponse.json({ error: "Forbidden", message: "Only admin and operator roles can delete alerts." }, { status: 403 });

    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch (e) {
        // Ignore
      }
    }

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await dbClient.deleteAlert(id, ctx.organizationId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
