import { readFile } from "node:fs/promises";
import { extractPdfText } from "../src/lib/pdf";
import { generateQuiz } from "../src/core/generateQuiz";
import { createGeminiGenerator } from "../src/lib/gemini";

async function main() {
  const chemin = process.argv[2];
  if (!chemin) {
    console.error("Usage : npx tsx --env-file=.env.local scripts/spike-quiz-real.ts samples/cours.pdf");
    process.exit(1);
  }

  console.log("1. Lecture du PDF...");
  const buffer = await readFile(chemin);
  const pdf = await extractPdfText(new Uint8Array(buffer));

  if (pdf.likelyScanned) {
    console.error("⚠️ PDF scanné : pas assez de texte pour générer un quiz.");
    process.exit(1);
  }
  console.log(`   ${pdf.pages} pages, ${pdf.characters} caractères`);

  console.log("2. Génération du quiz par l'IA (quelques secondes)...");
  const quiz = await generateQuiz(pdf.text, 5, createGeminiGenerator());

  console.log(`\n✅ ${quiz.title}\n`);
  quiz.questions.forEach((q, i) => {
    console.log(`Q${i + 1}. ${q.question}`);
    q.choices.forEach((c, j) => {
      console.log(`   ${"ABCD"[j]}. ${c}${j === q.correctIndex ? "  ✓" : ""}`);
    });
    console.log(`   → ${q.explanation}\n`);
  });
}

main().catch((e) => {
  console.error("Erreur :", e.message ?? e);
  process.exit(1);
});