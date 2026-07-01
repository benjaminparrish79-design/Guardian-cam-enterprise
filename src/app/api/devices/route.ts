import { NextRequest, NextResponse } from "next/server";
import { dbClient } from "@/lib/db-client";
import { deviceSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { getOrganizationId } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const orgId = await getOrganizationId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await dbClient.getDevices(orgId);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch devices" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (!rateLimit(ip, 20, 60000).success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const orgId = await getOrganizationId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validated = deviceSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: "Invalid device data", details: validated.error.format() }, { status: 400 });
    }

    const deviceData = {
      id: validated.data.id || `dev-${Math.random().toString(36).substring(2, 9)}`,
      name: validated.data.name,
      type: validated.data.type,
      status: validated.data.status || "online",
      battery: validated.data.battery,
      signal: validated.data.signal,
      lastActive: "Just now",
      latitude: validated.data.latitude,
      longitude: validated.data.longitude,
      sirenOn: validated.data.sirenOn ?? false,
      lightOn: validated.data.lightOn ?? false,
      recording: validated.data.recording ?? false,
      speed: validated.data.speed,
      licensePlate: validated.data.licensePlate,
      driverName: validated.data.driverName,
    };

    await dbClient.addDevice(deviceData, orgId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to create device" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const orgId = await getOrganizationId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, ...updatedFields } = body;

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const validated = deviceSchema.partial().safeParse(updatedFields);
    if (!validated.success) {
      return NextResponse.json({ error: "Invalid device data", details: validated.error.format() }, { status: 400 });
    }

    await dbClient.updateDevice(id, validated.data, orgId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update device" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const orgId = await getOrganizationId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await dbClient.deleteDevice(id, orgId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to delete device" }, { status: 500 });
  }
}
