import { NextRequest, NextResponse } from "next/server";
import { dbClient } from "@/lib/db-client";
import { aiEventSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

export async function GET() {
  try {
    const data = await dbClient.getAIEvents();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch AI events" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (!rateLimit(ip, 20, 60000).success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const validated = aiEventSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: "Invalid AI event data", details: validated.error.format() }, { status: 400 });
    }

    await dbClient.addAIEvent(validated.data as any);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to create AI event" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await dbClient.updateAIEvent(body.id, !!body.resolved);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update AI event" }, { status: 500 });
  }
}
