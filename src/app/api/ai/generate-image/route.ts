import { NextResponse } from "next/server";
import { getGeminiClient } from "../../../../lib/gemini";
import { generateImageSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

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

    const jsonBody = await req.json();

    // Input Validation
    const validated = generateImageSchema.safeParse(jsonBody);
    if (!validated.success) {
      return NextResponse.json({ error: "Invalid generation request", details: validated.error.format() }, { status: 400 });
    }

    const { prompt, aspectRatio, imageSize } = validated.data;

    try {
      const ai = getGeminiClient();
      
      // Determine standard aspect ratio strings
      const ratio = aspectRatio || "16:9";
      const size = imageSize || "1K";
      const selectedModel = "gemini-3.1-flash-image"; // Safe high-quality model alias
      
      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: {
          parts: [{ text: prompt || "A dark perimeter fence at night with thermal imaging" }]
        },
        config: {
          imageConfig: {
            aspectRatio: ratio,
            imageSize: size
          }
        }
      });

      const parts = response.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData) {
            const base64EncodeString = part.inlineData.data;
            return NextResponse.json({
              imageUrl: `data:image/png;base64,${base64EncodeString}`
            });
          }
        }
      }

      throw new Error("No image data returned from Gemini Vision model");
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

      return NextResponse.json({ imageUrl });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
