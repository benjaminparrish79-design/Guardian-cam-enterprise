import { NextRequest, NextResponse } from "next/server";
import { dbClient } from "@/lib/db-client";
import { BillingConfig } from "@/types";
import { billingConfigSchema } from "@/lib/validations";
import { getAuthContext } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await dbClient.getBillingConfig(ctx.organizationId);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch billing config" }, { status: 500 });
  }
}

async function handleUpdate(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (ctx.role !== "admin") {
    return NextResponse.json({ error: "Only an organization admin can change billing." }, { status: 403 });
  }

  const body = await req.json();

  const validation = billingConfigSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: "Invalid billing config data", details: validation.error.format() }, { status: 400 });
  }

  await dbClient.updateBillingConfig(validation.data as BillingConfig, ctx.organizationId);
  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest) {
  try {
    return await handleUpdate(req);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update billing config" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    return await handleUpdate(req);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update billing config" }, { status: 500 });
  }
}
