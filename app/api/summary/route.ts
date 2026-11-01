import { NextResponse } from "next/server";
import { extractPdfText } from "../../../src/lib/pdf";
import {
  createGeminiGenerator,
  GeminiTimeoutError,
  GeminiUnavailableError,
} from "../../../src/lib/gemini";
import { isLanguage, type Language } from "../../../src/core/language";

export const maxDuration = 120;

const MAX_BYTES = 4 * 1024 * 1024;
const MAX_COURSE_CHARS = 30000;

const errorMessages: Record<string, Record<Language, string>> = {
  BAD_REQUEST: {
    fr: "Requête invalide : envoie un formulaire avec un fichier PDF.",
    en: "Invalid request: submit a form with a PDF file.",
    es: "Solicitud no válida: envía un formulario con un archivo PDF.",
    pt: "Solicitação inválida: envie um formulário com um arquivo PDF.",
    zh: "请求无效：请提交包含 PDF 文件的表单。",
    ar: "طلب غير صالح: أرسل نموذجًا يحتوي على ملف PDF.",
  },
  NO_FILE: { fr: "Aucun fichier PDF reçu.", en: "No PDF file was received.", es: "No se recibió ningún archivo PDF.", pt: "Nenhum arquivo PDF foi recebido.", zh: "未收到 PDF 文件。", ar: "لم يتم استلام ملف PDF." },
  NOT_PDF: { fr: "Le fichier doit être un PDF.", en: "The file must be a PDF.", es: "El archivo debe ser un PDF.", pt: "O arquivo deve ser um PDF.", zh: "文件必须为 PDF 格式。", ar: "يجب أن يكون الملف بصيغة PDF." },
  EMPTY_FILE: { fr: "Le PDF est vide.", en: "The PDF is empty.", es: "El PDF está vacío.", pt: "O PDF está vazio.", zh: "PDF 文件为空。", ar: "ملف PDF فارغ." },
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
    fr: "Ce PDF semble être un scan : il ne contient pas de texte exploitable.",
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
    fr: "La génération du résumé a échoué. Réessaie dans un instant.",
    en: "Summary generation failed. Please try again shortly.",
    es: "No se pudo generar el resumen. Inténtalo de nuevo en unos momentos.",
    pt: "Não foi possível gerar o resumo. Tente novamente em instantes.",
    zh: "摘要生成失败，请稍后重试。",
    ar: "تعذر إنشاء الملخص. حاول مرة أخرى بعد قليل.",
  },
  GENERATION_TIMEOUT: {
    fr: "Le service IA met trop de temps à répondre. Réessaie dans un instant.",
    en: "The AI service is taking too long to respond. Please try again shortly.",
    es: "El servicio de IA tarda demasiado en responder. Inténtalo de nuevo en unos momentos.",
    pt: "O serviço de IA está demorando para responder. Tente novamente em instantes.",
    zh: "AI 服务响应时间过长，请稍后重试。",
    ar: "تستغرق خدمة الذكاء الاصطناعي وقتًا طويلاً للرد. حاول مرة أخرى بعد قليل.",
  },
  GENERATION_BUSY: {
    fr: "Le service IA est très sollicité. Réessaie dans quelques instants.",
    en: "The AI service is busy right now. Please try again in a few moments.",
    es: "El servicio de IA está muy ocupado. Inténtalo de nuevo en unos momentos.",
    pt: "O serviço de IA está muito ocupado. Tente novamente em instantes.",
    zh: "AI 服务当前繁忙，请稍后重试。",
    ar: "خدمة الذكاء الاصطناعي مشغولة حاليًا. حاول مرة أخرى بعد قليل.",
  },
};

function fail(status: number, code: string, language: Language = "fr") {
  const message = errorMessages[code]?.[language] ?? errorMessages.BAD_REQUEST[language];
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: Request) {
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

  let pdf;
  try {
    pdf = await extractPdfText(new Uint8Array(await file.arrayBuffer()));
  } catch (error) {
    console.error("Erreur d’extraction PDF :", error);
    return fail(400, "INVALID_PDF", language);
  }
  if (pdf.likelyScanned) {
    return fail(422, "SCANNED_PDF", language);
  }

  let generate;
  try {
    generate = createGeminiGenerator("text/plain");
  } catch (error) {
    console.error("Configuration IA invalide :", error);
    return fail(500, "CONFIG_ERROR", language);
  }

  try {
    const instructions: Record<Language, { system: string; user: string }> = {
      fr: {
        system: `Tu es un assistant pédagogique. Résume fidèlement le cours fourni en français, même si le document source est dans une autre langue.
Présente le résultat en Markdown avec un titre, une synthèse courte, les notions clés et les définitions ou dates importantes si elles sont présentes.
Base-toi uniquement sur le texte fourni : n'ajoute pas de faits et signale clairement les passages incomplets.
Reste concis, clair et utile pour réviser.`,
        user: "Fais un résumé structuré de ce cours :",
      },
      en: {
        system: `You are a study assistant. Faithfully summarize the provided course in English, even if the source is in another language.
Format the result in Markdown with a title, a short synthesis, key concepts, and important definitions or dates when present.
Use only information from the supplied text. Do not add facts, and clearly flag incomplete passages.
Be concise, clear, and useful for studying.`,
        user: "Write a structured summary of this course:",
      },
      es: {
        system: `Eres un asistente de estudio. Resume fielmente el curso proporcionado en español, aunque el documento original esté en otro idioma.
Redacta el resultado en Markdown con un título, una síntesis breve, conceptos clave y definiciones o fechas importantes cuando aparezcan.
Usa solo la información del texto proporcionado. No añadas datos y señala claramente los pasajes incompletos.
Sé conciso, claro y útil para estudiar.`,
        user: "Escribe un resumen estructurado de este curso:",
      },
      pt: {
        system: `Você é um assistente de estudos. Resuma fielmente o curso fornecido em português, mesmo que o documento original esteja em outro idioma.
Formate o resultado em Markdown com título, síntese breve, conceitos principais e definições ou datas importantes quando houver.
Use somente as informações do texto fornecido. Não invente fatos e sinalize claramente os trechos incompletos.
Seja conciso, claro e útil para estudar.`,
        user: "Escreva um resumo estruturado deste curso:",
      },
      zh: {
        system: `你是一名学习助手。请用简体中文忠实总结提供的课程，即使原文使用其他语言。
请使用 Markdown 格式，包含标题、简短概述、核心概念，以及文中出现的重要定义或日期。
仅使用提供文本中的信息，不要添加事实，并明确指出不完整的段落。
内容应简洁、清晰且适合复习。`,
        user: "请对以下课程撰写结构化摘要：",
      },
      ar: {
        system: `أنت مساعد دراسي. لخّص الدرس المقدم بأمانة باللغة العربية، حتى إن كان المصدر بلغة أخرى.
نسّق النتيجة باستخدام Markdown مع عنوان وموجز قصير والمفاهيم الأساسية والتعريفات أو التواريخ المهمة عند ورودها.
استخدم المعلومات الواردة في النص فقط. لا تضف حقائق، وأشر بوضوح إلى المقاطع غير المكتملة.
كن موجزًا وواضحًا ومفيدًا للمذاكرة.`,
        user: "اكتب ملخصًا منظمًا لهذا الدرس:",
      },
    };
    const prompt = instructions[language];
    const summary = await generate({
      system: prompt.system,
      user: `${prompt.user}\n\n${pdf.text.slice(0, MAX_COURSE_CHARS)}`,
    });

    return NextResponse.json({ summary, pages: pdf.pages });
  } catch (error) {
    if (error instanceof GeminiTimeoutError) {
      return fail(504, "GENERATION_TIMEOUT", language);
    }
    if (error instanceof GeminiUnavailableError) {
      return fail(503, "GENERATION_BUSY", language);
    }
    console.error("Échec de génération du résumé :", error);
    return fail(502, "GENERATION_FAILED", language);
  }
}
