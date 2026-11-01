import { GoogleGenAI } from "@google/genai";

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Erreur : la variable d'environnement GEMINI_API_KEY n'est pas définie.");
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

main().catch((e: unknown) => {
  console.error("Erreur :", e instanceof Error ? e.message : String(e));
  process.exit(1);
});