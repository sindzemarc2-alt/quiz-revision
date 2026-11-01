import { NextResponse } from "next/server";
import { extractPdfText } from "../../../src/lib/pdf";
import { createGeminiGenerator } from "../../../src/lib/gemini";
import { generateQuiz } from "../../../src/core/generateQuiz";

export const maxDuration = 60;

const MAX_BYTES = 4 * 1024 * 1024; // 4 Mo
const MIN_QUESTIONS = 3;
const MAX_QUESTIONS = 10;
const DEFAULT_QUESTIONS = 5;

// Toutes les erreurs ont la même forme : le web et le mobile les liront pareil
function fail(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: Request) {
  // 1. Lire le formulaire envoyé
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail(400, "BAD_REQUEST", "Requête invalide : envoie un formulaire avec un fichier PDF.");
  }

  // 2. Vérifier le fichier
  const file = form.get("file");
  if (!(file instanceof File)) {
    return fail(400, "NO_FILE", "Aucun fichier reçu (champ « file » attendu).");
  }
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return fail(400, "NOT_PDF", "Le fichier doit être un PDF.");
  }
  if (file.size === 0) {
    return fail(400, "EMPTY_FILE", "Le fichier est vide.");
  }
  if (file.size > MAX_BYTES) {
    return fail(413, "FILE_TOO_LARGE", "Le PDF dépasse 4 Mo. Essaie un extrait du cours.");
  }

  // 3. Nombre de questions : borné pour protéger les quotas
  const asked = Number(form.get("count") ?? DEFAULT_QUESTIONS);
  const count = Number.isFinite(asked)
    ? Math.min(MAX_QUESTIONS, Math.max(MIN_QUESTIONS, Math.round(asked)))
    : DEFAULT_QUESTIONS;

  // 4. Extraire le texte
  let pdf;
  try {
    pdf = await extractPdfText(new Uint8Array(await file.arrayBuffer()));
  } catch (e) {
    console.error("Erreur d'extraction PDF :", e);
    return fail(400, "INVALID_PDF", "Impossible de lire ce PDF (fichier corrompu ou protégé).");
  }
  if (pdf.likelyScanned) {
    return fail(422, "SCANNED_PDF", "Ce PDF semble être un scan (images) : il ne contient pas de texte exploitable.");
  }

  // 5. Préparer l'IA (erreur de configuration = notre faute, pas celle de l'utilisateur)
  let generator;
  try {
    generator = createGeminiGenerator();
  } catch (e) {
    console.error("Configuration IA invalide :", e);
    return fail(500, "CONFIG_ERROR", "Le service de génération est mal configuré.");
  }

  // 6. Générer le quiz
  try {
    const quiz = await generateQuiz(pdf.text, count, generator);
    return NextResponse.json({ quiz });
  } catch (e) {
    // On garde le détail technique dans les journaux, pas dans la réponse
    console.error("Échec de génération :", e);
    return fail(502, "GENERATION_FAILED", "La génération a échoué. Réessaie dans un instant.");
  }
}

