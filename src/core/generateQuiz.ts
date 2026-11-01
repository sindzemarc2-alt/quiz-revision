import { QuizSchema } from "./schemas";
import type { Quiz } from "./types";

// Une "IA" = n'importe quelle fonction qui reçoit un prompt et renvoie du texte.
// Gemini, une autre IA ou une IA locale respectent toutes ce contrat.
export type TextGenerator = (prompt: {
  system: string;
  user: string;
}) => Promise<string>;

// Limite pour rester dans les quotas : on n'envoie pas 500 pages d'un coup
const MAX_COURSE_CHARS = 30000;

export const SYSTEM_PROMPT = `Tu es un assistant pédagogique qui crée des QCM de révision.

Règles :
- Base-toi UNIQUEMENT sur le cours fourni, n'invente rien.
- Chaque question a exactement 4 choix et une seule bonne réponse.
- Les mauvaises réponses doivent être plausibles, pas absurdes.
- Répartis la bonne réponse entre les positions 0, 1, 2 et 3.
- "correctIndex" est la position (0 à 3) de la bonne réponse.
- "explanation" explique en une ou deux phrases pourquoi c'est la bonne réponse.
- Écris dans la même langue que le cours.
- Le texte vient d'une extraction PDF et peut contenir du bruit
  (puces lues comme la lettre "n", mots coupés) : ignore ce bruit.

Réponds UNIQUEMENT par un objet JSON valide, sans texte autour, de cette forme :
{"title": "...", "questions": [{"id": "q1", "question": "...", "choices": ["...", "...", "...", "..."], "correctIndex": 0, "explanation": "..."}]}`;

export function buildUserPrompt(courseText: string, count: number): string {
  return `Génère exactement ${count} questions à choix multiples à partir de ce cours :\n\n${courseText.slice(0, MAX_COURSE_CHARS)}`;
}

// L'IA entoure parfois le JSON de texte ou de ```json : on isole l'objet
export function extractJson(raw: string): unknown {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Aucun JSON trouvé dans la réponse de l'IA.");
  }
  return JSON.parse(raw.slice(start, end + 1));
}

export async function generateQuiz(
  courseText: string,
  count: number,
  generate: TextGenerator,
  maxAttempts = 2
): Promise<Quiz> {
  let lastError = "";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Si un essai a échoué, on dit à l'IA ce qui n'allait pas
      const correction = lastError
        ? `\n\nTa réponse précédente était invalide : ${lastError}\nCorrige et renvoie uniquement le JSON.`
        : "";

      const raw = await generate({
        system: SYSTEM_PROMPT,
        user: buildUserPrompt(courseText, count) + correction,
      });

      const parsed = QuizSchema.safeParse(extractJson(raw));
      if (parsed.success) return parsed.data;

      lastError = parsed.error.issues
        .map((i) => `${i.path.join(".")} : ${i.message}`)
        .join(" ; ");
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }
  }

  throw new Error(
    `Impossible de générer un quiz valide après ${maxAttempts} essais. Dernière erreur : ${lastError}`
  );
}