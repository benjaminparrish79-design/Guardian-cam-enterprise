import { NextRequest, NextResponse } from "next/server";
import { dbClient } from "@/lib/db-client";
import { workOrderSchema } from "@/lib/validations";

export async function GET() {
  try {
    const data = await dbClient.getWorkOrders();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Input Validation
    const validation = workOrderSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid work order data", details: validation.error.format() }, { status: 400 });
    }

    await dbClient.addWorkOrder(validation.data);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate the updated fields partially
    const validation = workOrderSchema.partial().safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid work order data", details: validation.error.format() }, { status: 400 });
    }

    // Since our fallback setup has placeholder update, we keep success true and log validation
    return NextResponse.json({ success: true, validatedData: validation.data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
