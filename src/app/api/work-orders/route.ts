import { NextRequest, NextResponse } from "next/server";
import { dbClient } from "@/lib/db-client";
import { workOrderSchema } from "@/lib/validations";
import { requireRole } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireRole("admin", "operator", "inspector");
    if (!ctx) return NextResponse.json({ error: "Forbidden", message: "Adequate privilege role required." }, { status: 403 });

    const data = await dbClient.getWorkOrders(ctx.organizationId);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireRole("admin", "operator");
    if (!ctx) return NextResponse.json({ error: "Forbidden", message: "Only admin and operator roles can create work orders." }, { status: 403 });

    const body = await req.json();

    // Input Validation
    const validation = workOrderSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid work order data", details: validation.error.format() }, { status: 400 });
    }

    await dbClient.addWorkOrder(validation.data, ctx.organizationId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const ctx = await requireRole("admin", "operator");
    if (!ctx) return NextResponse.json({ error: "Forbidden", message: "Only admin and operator roles can update work orders." }, { status: 403 });

    const body = await req.json();
    const { id, ...updatedFields } = body;

    if (!id) {
      return NextResponse.json({ error: "Work order ID is required for update" }, { status: 400 });
    }

    // Validate the updated fields partially
    const validation = workOrderSchema.partial().safeParse(updatedFields);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid work order data", details: validation.error.format() }, { status: 400 });
    }

    await dbClient.updateWorkOrder(id, validation.data, ctx.organizationId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const ctx = await requireRole("admin", "operator");
    if (!ctx) return NextResponse.json({ error: "Forbidden", message: "Only admin and operator roles can delete work orders." }, { status: 403 });

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

    if (!id) {
      return NextResponse.json({ error: "Work order ID is required for deletion" }, { status: 400 });
    }

    await dbClient.deleteWorkOrder(id, ctx.organizationId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
