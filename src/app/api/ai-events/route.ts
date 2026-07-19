import { NextRequest, NextResponse } from "next/server";
import { dbClient } from "@/lib/db-client";
import { aiEventSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { requireRole } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireRole("admin", "operator", "inspector");
    if (!ctx) return NextResponse.json({ error: "Forbidden", message: "Adequate privilege role required." }, { status: 403 });

    const data = await dbClient.getAIEvents(ctx.organizationId);
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
    const ctx = await requireRole("admin", "operator");
    if (!ctx) return NextResponse.json({ error: "Forbidden", message: "Only admin and operator roles can create AI events." }, { status: 403 });

    const body = await req.json();
    const validated = aiEventSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: "Invalid AI event data", details: validated.error.format() }, { status: 400 });
    }

    await dbClient.addAIEvent(validated.data as any, ctx.organizationId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to create AI event" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const ctx = await requireRole("admin", "operator");
    if (!ctx) return NextResponse.json({ error: "Forbidden", message: "Only admin and operator roles can update AI events." }, { status: 403 });

    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await dbClient.updateAIEvent(body.id, !!body.resolved, ctx.organizationId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update AI event" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const ctx = await requireRole("admin", "operator");
    if (!ctx) return NextResponse.json({ error: "Forbidden", message: "Only admin and operator roles can delete AI events." }, { status: 403 });

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

    await dbClient.deleteAIEvent(id, ctx.organizationId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to delete AI event" }, { status: 500 });
  }
}
