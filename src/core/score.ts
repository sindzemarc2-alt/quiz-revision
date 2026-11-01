import type { Quiz } from "./types";

// Une réponse = l'index choisi (0 à 3), ou null si pas encore répondu
export type Answers = (number | null)[];

export function computeScore(quiz: Quiz, answers: Answers) {
  const total = quiz.questions.length;
  const correct = quiz.questions.reduce(
    (sum, q, i) => sum + (answers[i] === q.correctIndex ? 1 : 0),
    0
  );
  const percent = total === 0 ? 0 : Math.round((correct / total) * 100);
  return { correct, total, percent };
}
