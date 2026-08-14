import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", app: "Umgangssprache" });
  });

  // AI Slang Scenario Generator and Slang Judge
  app.post("/api/ai/scenario", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const { slangTerm, region, category, difficulty } = req.body;

      if (!apiKey) {
        return res.json({
          success: false,
          fallback: true,
          message: "API key not provided. Using built-in scenario engine."
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a German youth culture & slang expert creating a funny comic scenario for the German slang app 'Umgangssprache'.
Generate a short 2-character dialogue (in German) where one character uses or should use the German slang word "${slangTerm || 'Digga'}".
Region: ${region || 'Allgemein / Jugend'}.
Category: ${category || 'Street'}.
Difficulty: ${difficulty || 'Medium'}.

Output STRICTLY valid JSON in this format:
{
  "scenarioTitle": "Short funny title",
  "speaker1": "Name or archetype",
  "speaker1Text": "German line setting up the context",
  "speaker2": "Name or archetype",
  "speaker2Text": "German response featuring the slang or blank spot",
  "englishMeaning": "Brief explanation in English",
  "funFact": "One fun cultural tip about when to use this word in Germany"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "{}";
      const parsed = JSON.parse(responseText);
      return res.json({ success: true, data: parsed });
    } catch (err: any) {
      console.error("AI Generation Error:", err);
      return res.json({
        success: false,
        fallback: true,
        error: err.message || "Failed to generate AI scenario"
      });
    }
  });

  // AI Slang Sentence Rater & Judge
  app.post("/api/ai/rate-sentence", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const { userSentence, targetSlang } = req.body;

      if (!apiKey) {
        return res.json({
          success: false,
          fallback: true,
          score: 85,
          verdict: "Stabil!",
          feedback: "Guter Einsatz! (Lokale Bewertung aktiv)"
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a witty German slang judge called 'Der Slang-Guru'. 
The user is learning the German slang term "${targetSlang}".
They wrote this sentence: "${userSentence}"

Rate the naturalness and authenticity from 0 to 100.
Provide a funny, encouraging German slang feedback (e.g. "Voll cringe!", "Macher-Move!", "Ehrenmann-Niveau!", "Digga, fast!").

Output STRICTLY valid JSON:
{
  "score": number (0-100),
  "verdict": "Short slang verdict (e.g. 'Absoluter Macher!', 'Stabil', 'Bisschen Lost', 'Ehrenwert')",
  "feedback": "2 sentences in funny German explaining what was good or how to make it sound more like a real native",
  "correctedSentence": "A super natural German slang version"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json({ success: true, data: parsed });
    } catch (err: any) {
      console.error("AI Rating Error:", err);
      return res.json({
        success: false,
        fallback: true,
        score: 80,
        verdict: "Stabil!",
        feedback: "Klingt gut und verständlich! Weiter so!"
      });
    }
  });

  // Vite middleware in dev / static in prod
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
    console.log(`Umgangssprache server running on http://localhost:${PORT}`);
  });
}

startServer();
