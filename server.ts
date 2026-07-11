import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy initialize Gemini client to prevent crashes if key is missing
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured.");
    }
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

// AI Endpoint: Enhance a goal statement
app.post("/api/ai/enhance-goal", async (req, res) => {
  try {
    const { goalText } = req.body;
    if (!goalText || typeof goalText !== "string" || goalText.trim() === "") {
      res.status(400).json({ error: "Goal text is required." });
      return;
    }

    const ai = getGeminiClient();
    const prompt = `Convert the following daily goal or task into three different versions:
1. SMART version: Specific, Measurable, Actionable, Realistic, and Time-bound.
2. Motivational version: Highly inspiring, action-oriented, and positive.
3. Minimalist version: Short, punchy, and highly concise (3-5 words).

Original goal: "${goalText}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            smart: {
              type: Type.STRING,
              description: "A SMART formatted version of the goal.",
            },
            motivational: {
              type: Type.STRING,
              description: "A highly motivating, positive version.",
            },
            minimal: {
              type: Type.STRING,
              description: "A short, punchy 3-5 word version.",
            },
          },
          required: ["smart", "motivational", "minimal"],
        },
      },
    });

    const jsonText = response.text?.trim() || "{}";
    const result = JSON.parse(jsonText);
    res.json(result);
  } catch (error: any) {
    console.error("Error in enhance-goal API:", error);
    res.status(500).json({
      error: error.message || "Failed to enhance goal. Please check if your GEMINI_API_KEY is configured correctly.",
    });
  }
});

// AI Endpoint: Suggest motivational quotes or photo captions
app.post("/api/ai/suggest-captions", async (req, res) => {
  try {
    const { goalTitle, captionContext } = req.body;
    if (!goalTitle || typeof goalTitle !== "string") {
      res.status(400).json({ error: "Goal title or theme is required." });
      return;
    }

    const ai = getGeminiClient();
    const contextPrompt = captionContext ? ` Additional visual context: "${captionContext}".` : "";
    const prompt = `Generate a list of 5 premium, aesthetic, and inspiring captions or daily motivational quotes. These captions are meant to be overlaid on a Daily Goal Card or associated images.
The primary daily goal is: "${goalTitle}".${contextPrompt}

Provide 5 diverse options, ranging from minimalist wisdom to energetic push. Keep them elegant and professional.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            captions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of 5 unique aesthetic captions or quotes.",
            },
          },
          required: ["captions"],
        },
      },
    });

    const jsonText = response.text?.trim() || "{}";
    const result = JSON.parse(jsonText);
    res.json(result);
  } catch (error: any) {
    console.error("Error in suggest-captions API:", error);
    res.status(500).json({
      error: error.message || "Failed to suggest captions. Please check if your GEMINI_API_KEY is configured correctly.",
    });
  }
});

// Vite Middleware for development, or static serving for production
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

setupViteOrStatic().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
  });
});
