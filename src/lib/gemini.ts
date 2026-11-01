import { ApiError, GoogleGenAI } from "@google/genai";
import type { TextGenerator } from "../core/generateQuiz";

const GENERATION_TIMEOUT_MS = 45_000;
const FALLBACK_TIMEOUT_MS = 25_000;
const FALLBACK_MODEL = "gemini-3.1-flash-lite";

export class GeminiTimeoutError extends Error {
  constructor() {
    super("La génération Gemini a dépassé le délai autorisé.");
    this.name = "GeminiTimeoutError";
  }
}

export class GeminiUnavailableError extends Error {
  constructor() {
    super("Aucun modèle Gemini n'est disponible pour le moment.");
    this.name = "GeminiUnavailableError";
  }
}

function shouldUseFallback(error: unknown): boolean {
  if (error instanceof GeminiTimeoutError) return true;
  if (error instanceof ApiError) {
    return error.status === 429 || error.status >= 500;
  }
  return error instanceof TypeError;
}

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
    const generateWithModel = async (
      modelName: string,
      timeoutMs = GENERATION_TIMEOUT_MS
    ) => {
      const abortSignal = AbortSignal.timeout(timeoutMs);
      try {
        return await ai.models.generateContent({
          model: modelName,
          contents: user,
          config: {
            abortSignal,
            httpOptions: {
              timeout: timeoutMs + 1_000,
              retryOptions: { attempts: 1 },
            },
            systemInstruction: system,
            // Demande à Gemini de répondre en JSON : moins d'erreurs de format
            responseMimeType,
          },
        });
      } catch (error) {
        if (abortSignal.aborted) throw new GeminiTimeoutError();
        throw error;
      }
    };

    let response;
    try {
      response = await generateWithModel(model);
    } catch (error) {
      if (shouldUseFallback(error) && model !== FALLBACK_MODEL) {
        try {
          response = await generateWithModel(FALLBACK_MODEL, FALLBACK_TIMEOUT_MS);
        } catch (fallbackError) {
          if (fallbackError instanceof GeminiTimeoutError) {
            throw fallbackError;
          }
          if (shouldUseFallback(fallbackError)) {
            throw new GeminiUnavailableError();
          }
          throw fallbackError;
        }
      } else {
        throw error;
      }
    }

    if (!response.text) {
      throw new Error("Réponse vide de Gemini.");
    }
    return response.text;
  };
}