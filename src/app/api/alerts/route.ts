import { NextRequest, NextResponse } from "next/server";
import { dbClient } from "@/lib/db-client";
import { SecurityAlert } from "@/types";
import { alertSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("organizationId");

    let data = await dbClient.getAlerts();

    if (orgId) {
      data = data.filter((a: any) => a.organizationId === orgId);
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Input Validation
    const validation = alertSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid alert data", details: validation.error.format() }, { status: 400 });
    }

    await dbClient.addAlert(validation.data as SecurityAlert);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    // Validate updated fields partially
    const validation = alertSchema.partial().safeParse(fields);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid alert data", details: validation.error.format() }, { status: 400 });
    }

    await dbClient.updateAlert(id, validation.data);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
