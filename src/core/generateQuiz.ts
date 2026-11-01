import { QuizSchema } from "./schemas";
import type { Quiz } from "./types";
import { languageName, type Language } from "./language";

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
- Si des questions précédentes sont fournies, crée des questions différentes
  portant sur d'autres faits ou notions du cours.
- Répartis la bonne réponse entre les positions 0, 1, 2 et 3.
- "correctIndex" est la position (0 à 3) de la bonne réponse.
- "explanation" explique en une ou deux phrases pourquoi c'est la bonne réponse.
- Utilise la langue explicitement demandée dans les consignes de génération.
- Le texte vient d'une extraction PDF et peut contenir du bruit
  (puces lues comme la lettre "n", mots coupés) : ignore ce bruit.

Réponds UNIQUEMENT par un objet JSON valide, sans texte autour, de cette forme :
{"title": "...", "questions": [{"id": "q1", "question": "...", "choices": ["...", "...", "...", "..."], "correctIndex": 0, "explanation": "..."}]}`;

export function buildUserPrompt(
  courseText: string,
  count: number,
  previousQuestions: string[] = [],
  language: Language = "fr"
): string {
  const exclusions = previousQuestions.length
    ? language !== "fr"
      ? `\n\nDo not repeat these questions or test the same concepts:\n${JSON.stringify(previousQuestions)}`
      : `\n\nNe répète pas ces questions et ne teste pas les mêmes notions :\n${JSON.stringify(previousQuestions)}`
    : "";
  const instruction =
    language === "fr"
      ? `Génère exactement ${count} questions à choix multiples à partir de ce cours. Écris le titre, les questions, les réponses et les explications en français :${exclusions}`
      : `Generate exactly ${count} multiple-choice questions from this course. Write the quiz title, questions, answer choices, and explanations in ${languageName(language)}:${exclusions}`;
  return `${instruction}\n\n${courseText.slice(0, MAX_COURSE_CHARS)}`;
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

function normalizeQuestion(question: string): string {
  return question
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export async function generateQuiz(
  courseText: string,
  count: number,
  generate: TextGenerator,
  options: { maxAttempts?: number; previousQuestions?: string[]; language?: Language } = {}
): Promise<Quiz> {
  const { maxAttempts = 2, previousQuestions = [], language = "fr" } = options;
  const previousQuestionSet = new Set(previousQuestions.map(normalizeQuestion));
  let lastError = "";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Si un essai a renvoyé un contenu invalide, on précise quoi corriger.
    const correction = lastError
      ? language === "en"
        ? `\n\nYour previous response was invalid: ${lastError}\nCorrect it and return only the JSON.`
        : `\n\nTa réponse précédente était invalide : ${lastError}\nCorrige et renvoie uniquement le JSON.`
      : "";

    const raw = await generate({
      system: `${SYSTEM_PROMPT}\n- Write all quiz content in ${languageName(language)}, even if the course uses another language.`,
      user:
        buildUserPrompt(courseText, count, previousQuestions, language) +
        correction,
    });

    try {
      const parsed = QuizSchema.safeParse(extractJson(raw));
      if (parsed.success) {
        const repeatsPreviousQuestion = parsed.data.questions.some((question) =>
          previousQuestionSet.has(normalizeQuestion(question.question))
        );
        if (!repeatsPreviousQuestion) return parsed.data;

        lastError =
          "Une ou plusieurs questions reprennent exactement une question précédente. Génère des questions différentes.";
        continue;
      }

      lastError = parsed.error.issues
        .map((i) => `${i.path.join(".")} : ${i.message}`)
        .join(" ; ");
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  throw new Error(
    `Impossible de générer un quiz valide après ${maxAttempts} essais. Dernière erreur : ${lastError}`
  );
}