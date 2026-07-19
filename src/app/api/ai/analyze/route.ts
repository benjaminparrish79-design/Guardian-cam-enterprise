import { NextResponse } from "next/server";
import { getGeminiClient } from "../../../../lib/gemini";
import { Type } from "@google/genai";
import { db } from "../../../../db";
import { aiEvents, alerts as dbAlerts } from "../../../../db/schema";
import { aiAnalyzeSchema, validateAIPrompt } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { requireRole } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// Simulated threat scenarios for demo fallback mode
const MOCK_REPORTS: Record<string, any> = {
  intruder: {
    threatLevel: "high",
    description: "Thermal signature analysis confirms unauthorized individual wearing a dark-hooded garment attempting to scale the west security fence line.",
    objectsDetected: ["Intruder", "Chainlink Fence", "Hoodie"],
    recommendation: "ACTIVATE ZONE WEST FLOODLIGHTS / DISPATCH PATROL ALPHA IMMEDIATELY",
    boundingBoxes: [
      { label: "Suspected Intruder", x: 45, y: 35, w: 20, h: 45 }
    ]
  },
  fire: {
    threatLevel: "critical",
    description: "Anomalous temperature gradient identified at loading point. Active combustion particles with smoke plumes detected near flammable inventory bins.",
    objectsDetected: ["Combustion Plume", "Hazmat Container", "Thermal Flare"],
    recommendation: "DEPRESSURIZE VALVES / INITIATE FIXED CHEMICAL REVENUE SUPPRESSION",
    boundingBoxes: [
      { label: "Active Ignition Source", x: 60, y: 55, w: 25, h: 30 }
    ]
  },
  vehicle: {
    threatLevel: "medium",
    description: "Commercial logistics delivery box van identified parked in designated emergency fire exit lane with hazard indicators offline.",
    objectsDetected: ["Unauthorized Truck", "Blocked Access Route"],
    recommendation: "SOUND LOADING BAY CHIME / BROADCAST VEHICLE DISMISSAL OVER UHF",
    boundingBoxes: [
      { label: "Blocked Fire Corridor", x: 20, y: 40, w: 55, h: 40 }
    ]
  },
  compliance: {
    threatLevel: "low",
    description: "Solid waste material pile and unorganized plastic pallets logged adjacent to storm-water runoff drainage filters.",
    objectsDetected: ["Solid Waste Pallets", "GIBMP Drainage Point"],
    recommendation: "ASSIGN COMPLIANCE CLEANUP WORK-ORDER / REVIEW SITE EASEMENT LIMITS",
    boundingBoxes: [
      { label: "Environmental Hazard Buffer", x: 30, y: 65, w: 30, h: 25 }
    ]
  }
};

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const limiter = rateLimit(ip, 15, 60000); // 15 requests per minute
    if (!limiter.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const ctx = await requireRole("admin", "operator", "inspector");
    if (!ctx) {
      return NextResponse.json({ error: "Forbidden", message: "Adequate privilege role required." }, { status: 403 });
    }
    const orgId = ctx.organizationId;

    const jsonBody = await req.json();

    // Input Validation
    const validation = aiAnalyzeSchema.safeParse(jsonBody);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid analysis request data", details: validation.error.format() }, { status: 400 });
    }

    const { image, prompt, model, selectedDevice, selectedDeviceName } = validation.data;

    // Safety check on AI prompt to prevent injection and abuse
    const promptCheck = validateAIPrompt(prompt);
    if (!promptCheck.success) {
      return NextResponse.json({ error: promptCheck.error }, { status: 400 });
    }

    let finalReport: any = null;
    let simulated = false;

    try {
      const ai = getGeminiClient();
      
      // Parse base64 or fetch image data
      let base64Data = "";
      let mimeType = "image/png";

      if (image && image.startsWith("data:")) {
        const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          base64Data = matches[2];
        }
      } else if (image && image.startsWith("http")) {
        // Only ever fetch from the known demo-image host. Never fetch an
        // arbitrary client-supplied URL server-side — that would let a
        // caller make this server issue requests to internal/private
        // addresses (SSRF).
        let parsed: URL;
        try {
          parsed = new URL(image);
        } catch {
          throw new Error("Invalid image URL.");
        }
        const allowedHosts = ["images.unsplash.com"];
        if (parsed.protocol !== "https:" || !allowedHosts.includes(parsed.hostname)) {
          throw new Error("Image URL host is not allowed.");
        }
        const imgFetch = await fetch(parsed.toString());
        const arrayBuffer = await imgFetch.arrayBuffer();
        base64Data = Buffer.from(arrayBuffer).toString("base64");
        mimeType = imgFetch.headers.get("content-type") || "image/jpeg";
      }

      if (!base64Data) {
        throw new Error("No readable image asset provided.");
      }

      const imagePart = {
        inlineData: {
          mimeType,
          data: base64Data
        }
      };

      const systemPrompt = `You are the central machine vision processor for GuardianCam Enterprise, a military-grade SecOps security threat analyzer.
Analyze the provided camera frame. Determine the threatLevel ('low', 'medium', 'high', 'critical'), list objectsDetected, write an emergency recommendation, and provide boundingBoxes as percentage values (0-100) relative to image boundaries.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [imagePart, { text: prompt || "Assess perimeter security state." }],
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              threatLevel: { type: Type.STRING, description: "Choose exactly one: 'low', 'medium', 'high', 'critical'." },
              description: { type: Type.STRING, description: "Detailed clinical diagnostic analysis description." },
              objectsDetected: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific objects/obstructions scanned." },
              recommendation: { type: Type.STRING, description: "Direct response action protocol instructions." },
              boundingBoxes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING, description: "Brief identification label." },
                    x: { type: Type.NUMBER, description: "X-axis start percentage (0 to 100)." },
                    y: { type: Type.NUMBER, description: "Y-axis start percentage (0 to 100)." },
                    w: { type: Type.NUMBER, description: "Width percentage (0 to 100)." },
                    h: { type: Type.NUMBER, description: "Height percentage (0 to 100)." }
                  },
                  required: ["label", "x", "y", "w", "h"]
                }
              }
            },
            required: ["threatLevel", "description", "objectsDetected", "recommendation"]
          }
        }
      });

      const text = response.text;
      if (text) {
        finalReport = JSON.parse(text);
      } else {
        throw new Error("Empty analysis payload from model.");
      }
    } catch (sdkError: any) {
      console.warn("AI intelligence engine fallback activated:", sdkError.message);
      
      // Select the best fitting mock template matching prompt keywords
      const promptLower = (prompt || "").toLowerCase();
      let selectedScenario = MOCK_REPORTS.compliance; // Default

      if (promptLower.includes("intruder") || promptLower.includes("suspect")) {
        selectedScenario = MOCK_REPORTS.intruder;
      } else if (promptLower.includes("fire") || promptLower.includes("ignition") || promptLower.includes("smoke")) {
        selectedScenario = MOCK_REPORTS.fire;
      } else if (promptLower.includes("vehicle") || promptLower.includes("truck") || promptLower.includes("commercial")) {
        selectedScenario = MOCK_REPORTS.vehicle;
      } else if (promptLower.includes("compliance") || promptLower.includes("fertilizer") || promptLower.includes("runoff")) {
        selectedScenario = MOCK_REPORTS.compliance;
      }

      finalReport = selectedScenario;
      simulated = true;
    }

    // Database logging flow (creates ai_events and alerts in PostgreSQL if database is active)
    if (db && finalReport) {
      try {
        const deviceIdVal = selectedDevice || "cam-01";
        
        // Log the Machine Vision Ingestion Event
        await db.insert(aiEvents).values({
          deviceId: deviceIdVal,
          imageUrl: image || "",
          prompt: prompt || "Surveillance Threat Ingestion",
          threatLevel: finalReport.threatLevel || "low",
          description: finalReport.description || "Ingestion complete.",
          objectsDetected: finalReport.objectsDetected || [],
          boundingBoxes: finalReport.boundingBoxes || [],
          simulated,
          organizationId: orgId,
        });

        // Log to security Alerts table if severity is elevated
        if (finalReport.threatLevel && ["medium", "high", "critical"].includes(finalReport.threatLevel)) {
          await db.insert(dbAlerts).values({
            id: `alert-${crypto.randomUUID()}`,
            deviceId: deviceIdVal,
            deviceName: selectedDeviceName || "AI Scanner Stream",
            timestamp: new Date().toLocaleTimeString(),
            severity: finalReport.threatLevel,
            message: simulated ? `[SIMULATED] ${finalReport.recommendation || "AI Threat Flagged"}` : (finalReport.recommendation || "AI Threat Flagged"),
            description: finalReport.description || "Thermal profile signature mismatch.",
            objectsDetected: finalReport.objectsDetected || [],
            resolved: false,
            simulated,
            organizationId: orgId,
          });
        }
        console.log("Drizzle database transaction succeeded: logged ai_event/alert.");
      } catch (dbError: any) {
        console.error("Drizzle write transaction skipped or failed:", dbError.message);
      }
    }

    return NextResponse.json({ ...finalReport, simulated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

