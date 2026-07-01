import { NextRequest, NextResponse } from "next/server";
import { dbClient } from "@/lib/db-client";
import { SecurityAlert } from "@/types";
import { alertSchema } from "@/lib/validations";
import { getOrganizationId } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const orgId = await getOrganizationId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await dbClient.getAlerts(orgId);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const orgId = await getOrganizationId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validation = alertSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid alert data", details: validation.error.format() }, { status: 400 });
    }

    await dbClient.addAlert({ ...validation.data, organizationId: orgId } as SecurityAlert, orgId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const orgId = await getOrganizationId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const validation = alertSchema.partial().safeParse(fields);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid alert data", details: validation.error.format() }, { status: 400 });
    }

    await dbClient.updateAlert(id, validation.data, orgId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
