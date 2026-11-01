import { NextResponse } from "next/server";
import { extractPdfText } from "../../../src/lib/pdf";
import { createGeminiGenerator, GeminiTimeoutError } from "../../../src/lib/gemini";
import { generateQuiz } from "../../../src/core/generateQuiz";
import { isLanguage, type Language } from "../../../src/core/language";

export const maxDuration = 120;

const MAX_BYTES = 4 * 1024 * 1024; // 4 Mo
const MIN_QUESTIONS = 3;
const MAX_QUESTIONS = 10;
const DEFAULT_QUESTIONS = 5;

// Toutes les erreurs ont la même forme : le web et le mobile les liront pareil
const errorMessages: Record<string, Record<Language, string>> = {
  BAD_REQUEST: {
    fr: "Requête invalide : vérifie les informations envoyées.",
    en: "Invalid request. Please check the submitted information.",
    es: "Solicitud no válida. Comprueba los datos enviados.",
    pt: "Solicitação inválida. Verifique os dados enviados.",
    zh: "请求无效，请检查提交的信息。",
    ar: "الطلب غير صالح. يُرجى التحقق من المعلومات المُرسلة.",
  },
  NO_FILE: { fr: "Aucun fichier PDF reçu.", en: "No PDF file was received.", es: "No se recibió ningún archivo PDF.", pt: "Nenhum arquivo PDF foi recebido.", zh: "未收到 PDF 文件。", ar: "لم يتم استلام ملف PDF." },
  NOT_PDF: { fr: "Le fichier doit être un PDF.", en: "The file must be a PDF.", es: "El archivo debe ser un PDF.", pt: "O arquivo deve ser um PDF.", zh: "文件必须为 PDF 格式。", ar: "يجب أن يكون الملف بصيغة PDF." },
  EMPTY_FILE: { fr: "Le fichier PDF est vide.", en: "The PDF file is empty.", es: "El archivo PDF está vacío.", pt: "O arquivo PDF está vazio.", zh: "PDF 文件为空。", ar: "ملف PDF فارغ." },
  FILE_TOO_LARGE: {
    fr: "Le PDF dépasse 4 Mo. Essaie un extrait du cours.",
    en: "The PDF is larger than 4 MB. Try a shorter excerpt.",
    es: "El PDF supera los 4 MB. Prueba con un fragmento más corto.",
    pt: "O PDF excede 4 MB. Tente usar um trecho menor.",
    zh: "PDF 超过 4 MB。请尝试更短的课程片段。",
    ar: "حجم PDF أكبر من 4 ميغابايت. جرّب جزءًا أقصر من الدرس.",
  },
  INVALID_PDF: {
    fr: "Impossible de lire ce PDF (fichier corrompu ou protégé).",
    en: "Could not read this PDF (it may be corrupted or password-protected).",
    es: "No se pudo leer el PDF (puede estar dañado o protegido).",
    pt: "Não foi possível ler o PDF (ele pode estar corrompido ou protegido).",
    zh: "无法读取此 PDF（文件可能已损坏或受密码保护）。",
    ar: "تعذرت قراءة ملف PDF (قد يكون تالفًا أو محميًا بكلمة مرور).",
  },
  SCANNED_PDF: {
    fr: "Ce PDF semble être un scan (images) : il ne contient pas de texte exploitable.",
    en: "This PDF appears to be a scan and does not contain readable text.",
    es: "Este PDF parece ser un escaneo y no contiene texto legible.",
    pt: "Este PDF parece ser uma digitalização e não contém texto legível.",
    zh: "此 PDF 似乎是扫描件，不包含可读取的文本。",
    ar: "يبدو أن ملف PDF ممسوح ضوئيًا ولا يحتوي على نص قابل للقراءة.",
  },
  CONFIG_ERROR: {
    fr: "Le service de génération est mal configuré.",
    en: "The generation service is not configured correctly.",
    es: "El servicio de generación no está configurado correctamente.",
    pt: "O serviço de geração não está configurado corretamente.",
    zh: "生成服务配置不正确。",
    ar: "خدمة الإنشاء غير مُهيأة بشكل صحيح.",
  },
  GENERATION_FAILED: {
    fr: "La génération a échoué. Réessaie dans un instant.",
    en: "Quiz generation failed. Please try again shortly.",
    es: "No se pudo generar el quiz. Inténtalo de nuevo en unos momentos.",
    pt: "A geração do quiz falhou. Tente novamente em instantes.",
    zh: "测验生成失败，请稍后重试。",
    ar: "تعذر إنشاء الاختبار. حاول مرة أخرى بعد قليل.",
  },
  GENERATION_TIMEOUT: {
    fr: "Le service IA met trop de temps à répondre. Réessaie dans un instant.",
    en: "The AI service is taking too long to respond. Please try again shortly.",
    es: "El servicio de IA tarda demasiado en responder. Inténtalo de nuevo en unos momentos.",
    pt: "O serviço de IA está demorando para responder. Tente novamente em instantes.",
    zh: "AI 服务响应时间过长，请稍后重试。",
    ar: "تستغرق خدمة الذكاء الاصطناعي وقتًا طويلاً للرد. حاول مرة أخرى بعد قليل.",
  },
};

function fail(status: number, code: string, language: Language = "fr") {
  const message = errorMessages[code]?.[language] ?? errorMessages.BAD_REQUEST[language];
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: Request) {
  // 1. Lire le formulaire envoyé
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail(400, "BAD_REQUEST");
  }

  const requestedLanguage = form.get("language");
  if (requestedLanguage !== null && !isLanguage(requestedLanguage)) {
    return fail(400, "BAD_REQUEST");
  }
  const language: Language = isLanguage(requestedLanguage) ? requestedLanguage : "fr";

  // 2. Vérifier le fichier
  const file = form.get("file");
  if (!(file instanceof File)) {
    return fail(400, "NO_FILE", language);
  }
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return fail(400, "NOT_PDF", language);
  }
  if (file.size === 0) {
    return fail(400, "EMPTY_FILE", language);
  }
  if (file.size > MAX_BYTES) {
    return fail(413, "FILE_TOO_LARGE", language);
  }

  // 3. Nombre de questions : borné pour protéger les quotas
  const asked = Number(form.get("count") ?? DEFAULT_QUESTIONS);
  const count = Number.isFinite(asked)
    ? Math.min(MAX_QUESTIONS, Math.max(MIN_QUESTIONS, Math.round(asked)))
    : DEFAULT_QUESTIONS;

  // 4. Vérifier les questions précédentes à éviter lors d'une nouvelle tentative
  const previousQuestionsField = form.get("previousQuestions");
  let previousQuestions: string[] = [];
  if (previousQuestionsField !== null) {
    if (typeof previousQuestionsField !== "string") {
      return fail(400, "BAD_REQUEST", language);
    }

    try {
      const parsed: unknown = JSON.parse(previousQuestionsField);
      if (
        !Array.isArray(parsed) ||
        parsed.length > MAX_QUESTIONS ||
        !parsed.every(
          (question): question is string =>
            typeof question === "string" && question.trim().length > 0 && question.length <= 500
        )
      ) {
        return fail(400, "BAD_REQUEST", language);
      }
      previousQuestions = parsed;
    } catch (e) {
      if (e instanceof SyntaxError) {
        return fail(400, "BAD_REQUEST", language);
      }
      throw e;
    }
  }

  // 5. Extraire le texte
  let pdf;
  try {
    pdf = await extractPdfText(new Uint8Array(await file.arrayBuffer()));
  } catch (e) {
    console.error("Erreur d'extraction PDF :", e);
    return fail(400, "INVALID_PDF", language);
  }
  if (pdf.likelyScanned) {
    return fail(422, "SCANNED_PDF", language);
  }

  // 6. Préparer l'IA (erreur de configuration = notre faute, pas celle de l'utilisateur)
  let generator;
  try {
    generator = createGeminiGenerator();
  } catch (e) {
    console.error("Configuration IA invalide :", e);
    return fail(500, "CONFIG_ERROR", language);
  }

  // 7. Générer le quiz
  try {
    const quiz = await generateQuiz(pdf.text, count, generator, { previousQuestions, language });
    return NextResponse.json({ quiz });
  } catch (e) {
    if (e instanceof GeminiTimeoutError) {
      return fail(504, "GENERATION_TIMEOUT", language);
    }
    // On garde le détail technique dans les journaux, pas dans la réponse
    console.error("Échec de génération :", e);
    return fail(502, "GENERATION_FAILED", language);
  }
}
