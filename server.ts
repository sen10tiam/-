import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// Lazy initialization of GoogleGenAI
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Image generation endpoint supporting gemini-3-pro-image-preview and gemini-3.1-flash-image-preview
// with aspect ratio ('1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', '21:9')
// and imageSize ('1K', '2K', '4K')
app.post("/api/generate-image", async (req, res) => {
  try {
    const { prompt, model, aspectRatio, imageSize } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Prompt string is required" });
    }

    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({
        error: "GEMINI_API_KEY is not configured in the environment. Please add it in Settings > Secrets.",
      });
    }

    const selectedModel = model || "gemini-3-pro-image-preview";

    const imageConfig: Record<string, string> = {};
    if (aspectRatio) {
      imageConfig.aspectRatio = aspectRatio;
    }
    if (imageSize) {
      imageConfig.imageSize = imageSize;
    }

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig,
      },
    });

    let imageUrl = "";
    let textResponse = "";
    const parts = response.candidates?.[0]?.content?.parts || [];

    for (const part of parts) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType || "image/png";
        imageUrl = `data:${mime};base64,${part.inlineData.data}`;
      } else if (part.text) {
        textResponse += part.text;
      }
    }

    if (!imageUrl) {
      return res.status(500).json({
        error: textResponse || "No image was returned by the model. Try refining your prompt.",
      });
    }

    return res.json({ imageUrl, text: textResponse });
  } catch (error: any) {
    console.error("Gemini image generation error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to generate image via Gemini API",
    });
  }
});

// Dynamic NPC and Quest lore generation endpoint
app.post("/api/generate-lore", async (req, res) => {
  try {
    const { characterName, heroClass, zone, questType } = req.body;
    const ai = getGenAI();
    if (!ai) {
      return res.json({
        lore: "The ancient winds of Eldoria whisper of destiny and peril...",
      });
    }

    const prompt = `Write a short immersive 2-sentence RPG quest rumor or prophecy for a hero named ${characterName || "Adventurer"} (Class: ${heroClass || "Warrior"}) exploring ${zone || "The Whispering Forest"} related to ${questType || "an ancient artifact"}.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });

    return res.json({ lore: response.text || "Destiny awaits you in the shadows." });
  } catch (error: any) {
    return res.json({ lore: "The ancient winds of Eldoria whisper of forgotten battles..." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Eldoria RPG server running on http://localhost:${PORT}`);
  });
}

startServer();
