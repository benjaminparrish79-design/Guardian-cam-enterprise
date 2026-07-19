import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  return NextResponse.json({
    apiKeyLoaded: !!apiKey && apiKey !== "MY_GEMINI_API_KEY",
  });
}
