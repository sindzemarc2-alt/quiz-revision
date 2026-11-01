import { GoogleGenAI } from "@google/genai";
import type { TextGenerator } from "../core/generateQuiz";

export function createGeminiGenerator(
  responseMimeType: "application/json" | "text/plain" = "application/json"
): TextGenerator {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;

  // On échoue tôt, avec un message clair, si la configuration manque
  if (!apiKey) throw new Error("GEMINI_API_KEY manquante dans .env.local");
  if (!model) throw new Error("GEMINI_MODEL manquant dans .env.local");

  const ai = new GoogleGenAI({ apiKey });

  return async ({ system, user }) => {
    const response = await ai.models.generateContent({
      model,
      contents: user,
      config: {
        systemInstruction: system,
        // Demande à Gemini de répondre en JSON : moins d'erreurs de format
        responseMimeType,
      },
    });

    if (!response.text) {
      throw new Error("Réponse vide de Gemini.");
    }
    return response.text;
  };
}