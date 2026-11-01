import { GoogleGenAI } from "@google/genai";

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY manquante dans .env.local");
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });
  const pager = await ai.models.list();

  console.log("Modèles utilisables pour générer du texte :\n");
  for await (const m of pager) {
    if (m.supportedActions?.includes("generateContent")) {
      console.log(" ", m.name?.replace("models/", ""));
    }
  }
}

main().catch((e) => {
  console.error("Erreur :", e.message ?? e);
  process.exit(1);
});
