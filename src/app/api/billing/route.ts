import { NextRequest, NextResponse } from "next/server";
import { dbClient } from "@/lib/db-client";
import { BillingConfig } from "@/types";
import { billingConfigSchema } from "@/lib/validations";

export async function GET() {
  try {
    const data = await dbClient.getBillingConfig();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch billing config" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Input Validation
    const validation = billingConfigSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid billing config data", details: validation.error.format() }, { status: 400 });
    }

    await dbClient.updateBillingConfig(validation.data as BillingConfig);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update billing config" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    // Input Validation
    const validation = billingConfigSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid billing config data", details: validation.error.format() }, { status: 400 });
    }

    await dbClient.updateBillingConfig(validation.data as BillingConfig);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update billing config" }, { status: 500 });
  }
}
