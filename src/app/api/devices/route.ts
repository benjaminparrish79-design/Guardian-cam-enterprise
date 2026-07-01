import { NextRequest, NextResponse } from "next/server";
import { dbClient } from "@/lib/db-client";
import { Device } from "@/types";
import { deviceSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("organizationId");

    const data = await dbClient.getDevices();
    
    // Basic filtering (can be improved with real auth later)
    const filtered = orgId 
      ? data.filter((d: any) => d.organizationId === orgId) 
      : data;

    return NextResponse.json(filtered);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Input Validation
    const validation = deviceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid device data", details: validation.error.format() }, { status: 400 });
    }

    await dbClient.addDevice(validation.data as Device);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updatedFields } = body;

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    // Validate the updated fields partially
    const validation = deviceSchema.partial().safeParse(updatedFields);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid device data", details: validation.error.format() }, { status: 400 });
    }

    await dbClient.updateDevice(id, validation.data);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await dbClient.deleteDevice(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
