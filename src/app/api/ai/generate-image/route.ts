import { NextResponse } from "next/server";
import { getGeminiClient } from "../../../../lib/gemini";
import { generateImageSchema, validateAIPrompt } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { requireRole } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// Visual simulation placeholders for demo fallback mode
const MOCK_SCENARIOS = [
  {
    keywords: ["drone", "hovering", "depot"],
    url: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&q=80&w=800&h=450"
  },
  {
    keywords: ["fence", "climbing", "suspicious", "barbed"],
    url: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&q=80&w=800&h=450"
  },
  {
    keywords: ["refinery", "vehicle", "breach", "lights"],
    url: "https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&q=80&w=800&h=450"
  },
  {
    keywords: ["smoke", "fire", "electrical", "vault"],
    url: "https://images.unsplash.com/photo-1486520299386-6d106b22014b?auto=format&fit=crop&q=80&w=800&h=450"
  }
];

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!rateLimit(ip, 15, 60000).success) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const ctx = await requireRole("admin", "operator");
    if (!ctx) {
      return NextResponse.json({ error: "Forbidden", message: "Adequate privilege role required." }, { status: 403 });
    }
    const orgId = ctx.organizationId;

    const jsonBody = await req.json();

    // Input Validation
    const validated = generateImageSchema.safeParse(jsonBody);
    if (!validated.success) {
      return NextResponse.json({ error: "Invalid generation request", details: validated.error.format() }, { status: 400 });
    }

    const { prompt, aspectRatio, imageSize } = validated.data;

    // Safety check on AI prompt to prevent injection and abuse
    const promptCheck = validateAIPrompt(prompt);
    if (!promptCheck.success) {
      return NextResponse.json({ error: promptCheck.error }, { status: 400 });
    }

    try {
      const ai = getGeminiClient();
      
      // Determine standard aspect ratio strings
      const ratio = (aspectRatio || "16:9") as any;
      const selectedModel = "imagen-3.0-generate-002";
      
      const response = await ai.models.generateImages({
        model: selectedModel,
        prompt: prompt || "A dark perimeter fence at night with thermal imaging",
        config: {
          numberOfImages: 1,
          aspectRatio: ratio,
          outputMimeType: "image/jpeg",
        }
      });

      const base64Image = response.generatedImages?.[0]?.image?.imageBytes;
      if (base64Image) {
        return NextResponse.json({
          imageUrl: `data:image/jpeg;base64,${base64Image}`,
          simulated: false
        });
      }

      throw new Error("No image data returned from Imagen model");
    } catch (sdkError: any) {
      console.warn("Gemini Image API client unavailable. Falling back to simulation mode...", sdkError.message);
      
      // Select the best fitting mock template matching prompt keywords
      const promptLower = (prompt || "").toLowerCase();
      const matched = MOCK_SCENARIOS.find(s => 
        s.keywords.some(k => promptLower.includes(k))
      );
      
      const imageUrl = matched 
        ? matched.url 
        : "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800&h=450"; // Generic tech/ops fallback

      return NextResponse.json({ imageUrl, simulated: true });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
