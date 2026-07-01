import { NextRequest, NextResponse } from "next/server";
import { dbClient } from "@/lib/db-client";
import { complianceSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

export async function GET() {
  try {
    const data = await dbClient.getComplianceRecords();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch compliance records" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (!rateLimit(ip, 10, 60000).success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const validated = complianceSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: "Invalid compliance data", details: validated.error.format() }, { status: 400 });
    }

    await dbClient.addComplianceRecord(validated.data);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to create compliance record" }, { status: 500 });
  }
}
