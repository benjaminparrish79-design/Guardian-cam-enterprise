import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Body parser
app.use(express.json({ limit: "50mb" }));

// Initialize Gemini client lazily and safely
let aiClient: GoogleGenAI | null = null;
function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// Check if API key is active
app.get("/api/config", (req, res) => {
  const isKeyLoaded = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY";
  res.json({
    status: "ok",
    apiKeyLoaded: isKeyLoaded,
    environment: process.env.NODE_ENV || "development",
  });
});

// AI Analyze Endpoint (Computer Vision Threat Assessment)
app.post("/api/ai/analyze", async (req, res) => {
  try {
    const { image, prompt, model } = req.body;
    const selectedModel = model || "gemini-3.5-flash";

    const ai = getAiClient();

    if (!ai) {
      // Simulation mode fallback if no API key is set
      console.log("No Gemini API key found. Returning simulated threat assessment.");
      return res.json(getSimulatedThreatResponse(prompt, image));
    }

    if (!image) {
      return res.status(400).json({ error: "Missing required field: image (base64 string)" });
    }

    // Clean base64 string
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    const imagePart = {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Data,
      },
    };

    const textInstruction = prompt || "Analyze this security surveillance frame. Identify any potential security, hazard, intrusion, fire, property damage or compliance threats. Output structural response.";

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: [
        imagePart,
        { text: textInstruction }
      ],
      config: {
        systemInstruction: "You are GuardianCam Enterprise's primary SecOps AI Analyzer. Your goal is to inspect security camera frames with mathematical precision and identify visual anomalies, intruders, fire, safety hazards, and compliance errors. Always respond strictly in the requested JSON structure.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["threatLevel", "objectsDetected", "description", "recommendation", "boundingBoxes"],
          properties: {
            threatLevel: {
              type: Type.STRING,
              description: "Threat severity: 'low', 'medium', 'high', or 'critical'."
            },
            objectsDetected: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of key security objects identified (e.g. 'person', 'unauthorized vehicle', 'debris', 'ladder')."
            },
            description: {
              type: Type.STRING,
              description: "A professional 2-3 sentence technical assessment of the visual anomalies."
            },
            recommendation: {
              type: Type.STRING,
              description: "The immediately actionable SecOps protocol recommendation."
            },
            boundingBoxes: {
              type: Type.ARRAY,
              description: "Synthesized boxes bounding the threats in normalized percentage coordinates (0-100).",
              items: {
                type: Type.OBJECT,
                required: ["label", "x", "y", "w", "h"],
                properties: {
                  label: { type: Type.STRING, description: "Object name." },
                  x: { type: Type.NUMBER, description: "X coordinate of top-left corner (0-100)." },
                  y: { type: Type.NUMBER, description: "Y coordinate of top-left corner (0-100)." },
                  w: { type: Type.NUMBER, description: "Width as percentage of image width (0-100)." },
                  h: { type: Type.NUMBER, description: "Height as percentage of image height (0-100)." }
                }
              }
            }
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.error("AI Analysis error:", error);
    res.status(500).json({
      error: "Failed to perform computer vision assessment.",
      details: error?.message || String(error)
    });
  }
});

// AI Scenario Image Generator Endpoint
app.post("/api/ai/generate-image", async (req, res) => {
  try {
    const { prompt, aspectRatio, imageSize, model } = req.body;
    const selectedModel = model || "gemini-3-pro-image-preview";
    const selectedRatio = aspectRatio || "1:1";
    const selectedSize = imageSize || "1K";

    const ai = getAiClient();

    if (!ai) {
      console.log("No Gemini API key found. Returning simulated synthesized threat image.");
      return res.json({
        mock: true,
        prompt,
        aspectRatio: selectedRatio,
        imageSize: selectedSize,
        imageUrl: getSimulatedImageUrl(prompt, selectedRatio)
      });
    }

    const imagePrompt = `SecOps Training Simulation. Security footage style, high-definition camera perspective. Subject matter: ${prompt || "a suspicious character wearing a dark hoodie near a security perimeter fence, night, security infrared overlay"}`;

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: {
        parts: [
          { text: imagePrompt }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: selectedRatio,
          imageSize: selectedSize
        }
      }
    });

    let base64Image = "";
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          base64Image = part.inlineData.data;
          break;
        }
      }
    }

    if (!base64Image) {
      throw new Error("Model returned no inline image data.");
    }

    res.json({
      success: true,
      model: selectedModel,
      aspectRatio: selectedRatio,
      imageSize: selectedSize,
      imageUrl: `data:image/png;base64,${base64Image}`
    });

  } catch (error: any) {
    console.error("AI Image Generation error:", error);
    res.status(500).json({
      error: "Failed to synthesize security reference image.",
      details: error?.message || String(error)
    });
  }
});

// Mock generator fallbacks
function getSimulatedThreatResponse(prompt: string, imageSrc: string) {
  // Determine if there is a keyword
  const normalized = (prompt || "").toLowerCase() + (imageSrc || "").toLowerCase();
  
  let threatLevel = "low";
  let objectsDetected = ["Camera 04 feed", "Secure fence"];
  let description = "Surveillance area scanned. Thermal sensors indicate normal background radiation with no structural breaches.";
  let recommendation = "Maintain baseline patrol patterns. Standard infrared monitoring remains operational.";
  let boundingBoxes = [] as any[];

  if (normalized.includes("person") || normalized.includes("intruder") || normalized.includes("climb") || normalized.includes("man")) {
    threatLevel = "high";
    objectsDetected = ["Unidentified Subject", "Tactical Apparel", "Security Fence Line"];
    description = "Intrusion warning triggered. A suspect wearing dark tactical apparel is detected scaling the primary security perimeter fence at Zone B.";
    recommendation = "Dispatch patrol vehicle Patrol-Alpha to Zone B immediately. Sound the audible siren on Device 01.";
    boundingBoxes = [
      { label: "Intruder (Scale)", x: 35, y: 15, w: 28, h: 65 },
      { label: "Fence Breach Point", x: 25, y: 40, w: 50, h: 30 }
    ];
  } else if (normalized.includes("fire") || normalized.includes("smoke") || normalized.includes("chemical") || normalized.includes("hazard")) {
    threatLevel = "critical";
    objectsDetected = ["Active Combustion Source", "Thick Smoke Plume", "Hazmat Barrel"];
    description = "Critical environmental alarm triggered. Visual evidence of active combustion and dense smoke plume is identified behind the waste storage perimeter.";
    recommendation = "Automate immediate fire suppression systems. Signal municipal fire rescue response and alert nearby staff.";
    boundingBoxes = [
      { label: "Fire Source", x: 45, y: 55, w: 30, h: 35 },
      { label: "Toxic Smoke Column", x: 30, y: 10, w: 55, h: 50 }
    ];
  } else if (normalized.includes("vehicle") || normalized.includes("car") || normalized.includes("truck") || normalized.includes("park")) {
    threatLevel = "medium";
    objectsDetected = ["Unauthorized Transport", "Zone Violation"];
    description = "Perimeter violation detected. An unregistered commercial vehicle is idling in the emergency service vehicle lane without active permits.";
    recommendation = "Issue warning beacon command. If vehicle remains unstaffed within 5 minutes, proceed with towing escalation.";
    boundingBoxes = [
      { label: "Unauthorized Vehicle", x: 15, y: 45, w: 70, h: 45 }
    ];
  } else if (normalized.includes("litter") || normalized.includes("debris") || normalized.includes("compliance") || normalized.includes("inspec")) {
    threatLevel = "medium";
    objectsDetected = ["Compliance Debris Violation", "Blocked Emergency Door", "Improper Chemical Container"];
    description = "Compliance safety check. Visual scan identified solid waste materials obstructing the emergency egress path, failing local environmental safety codes.";
    recommendation = "Assign task to grounds technician for immediate removal. Log inspection entry into GIBMP portal.";
    boundingBoxes = [
      { label: "Waste Debris", x: 50, y: 70, w: 35, h: 20 },
      { label: "Blocked Egress Door", x: 10, y: 15, w: 25, h: 70 }
    ];
  }

  return {
    threatLevel,
    objectsDetected,
    description,
    recommendation,
    boundingBoxes,
    mock: true
  };
}

function getSimulatedImageUrl(prompt: string, ratio: string) {
  // Use a secure collection of beautiful mock security scenario images from Unsplash
  const q = encodeURIComponent(prompt || "security monitoring camera night");
  // Default sizes matching ratios
  let w = 800, h = 800;
  if (ratio === "16:9") { w = 1200; h = 675; }
  else if (ratio === "9:16") { w = 675; h = 1200; }
  else if (ratio === "4:3") { w = 1000; h = 750; }
  else if (ratio === "3:4") { w = 750; h = 1000; }
  else if (ratio === "2:3") { w = 600; h = 900; }
  else if (ratio === "3:2") { w = 900; h = 600; }
  else if (ratio === "21:9") { w = 1200; h = 512; }

  return `https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&q=80&w=${w}&h=${h}&sig=${Math.floor(Math.random() * 1000)}`;
}

// Start full-stack Server setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode with Vite Dev Server Middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    
    app.use(vite.middlewares);
    
    // Fallback for SPA routing in development
    app.use("*", (req, res, next) => {
      vite.middlewares(req, res, next);
    });
  } else {
    // Production mode - Serve static files from the dist build
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`GuardianCam Enterprise Server listening on port ${PORT}`);
  });
}

startServer();
