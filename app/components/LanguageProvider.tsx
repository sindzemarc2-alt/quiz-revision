"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { isLanguage, SUPPORTED_LANGUAGES, type Language } from "../../src/core/language";
export type { Language } from "../../src/core/language";

const french = {
  brand: "Révision par QCM", language: "Langue", french: "Français", english: "English",
  spanish: "Español", portuguese: "Português", chinese: "中文（普通话）", arabic: "العربية",
  homeEyebrow: "Ton espace de révision", homeTitle: "Apprends à ta façon", homeTitleAccent: ".",
  homeDescription: "Choisis un outil et transforme tes cours en moments de révision plus simples.",
  quizOptionTitle: "Transformer mon cours en quiz",
  quizOptionDescription: "Teste tes connaissances avec des questions créées depuis ton PDF.",
  summaryOptionTitle: "Résumer un PDF",
  summaryOptionDescription: "Retrouve les idées essentielles de ton cours en un résumé clair.",
  homeCaption: "Survole ou sélectionne une option : le globe tourne avant d’ouvrir l’outil.",
  homeFooter: "Tes cours, un nouvel horizon.", backHome: "Accueil", quizEyebrow: "Quiz interactif",
  quizTitle: "Ton cours, à portée de quiz.", quizDescription: "Importe ton cours en PDF et teste-toi à ton rythme.",
  quizRegion: "Création et passage du quiz", uploadTitle: "Ton cours en PDF", questionCount: "Nombre de questions",
  selectedFile: "Sélectionné : {name} ({size} Ko)", questions: "{count} questions",
  choosePdf: "Choisis d'abord un fichier PDF.", pdfOnly: "Le fichier doit être un PDF.",
  fileTooLarge: "Le PDF dépasse 4 Mo. Essaie un extrait du cours.", generateQuiz: "Générer mon quiz",
  pdfHint: "PDF avec du texte sélectionnable, 4 Mo maximum. Évite les documents confidentiels.",
  quizLoading: "Génération du quiz en cours...",
  quizLoadingHint: "Lecture du PDF puis création des questions. Cela peut prendre jusqu’à 2 minutes.",
  generationError: "Une erreur est survenue. Réessaie.", timeoutError: "La génération a pris trop de temps. Réessaie.",
  connectionError: "Connexion impossible. Vérifie ta connexion internet.",
  questionProgress: "Question {current} sur {total}", correctAnswer: "Bonne réponse !",
  wrongAnswer: "Raté, voici pourquoi :", nextQuestion: "Question suivante", viewScore: "Voir mon score",
  yourScore: "Ton score", retryNewQuestions: "Réessayer avec d'autres questions", retryQuiz: "Refaire ce quiz",
  newPdf: "Nouveau PDF", review: "À revoir ({count})", yourAnswer: "Ta réponse : {answer}",
  rightAnswer: "Bonne réponse : {answer}", quizFooter: "Un petit quiz, un grand pas dans tes révisions.",
  summaryEyebrow: "Résumé intelligent", summaryTitle: "L’essentiel de ton cours, en clair.",
  summaryDescription: "Ajoute ton PDF pour en extraire les notions importantes et les retenir plus facilement.",
  createSummaryRegion: "Créer un résumé depuis un PDF", choosePdfFirst: "Choisis d’abord un fichier PDF.",
  summaryLoadingButton: "Lecture du cours et rédaction du résumé…", summarizePdf: "Résumer mon PDF",
  summaryLoading: "Ton résumé se prépare...", summaryLoadingHint: "Lecture du PDF puis synthèse des notions essentielles.",
  summaryTimeout: "La génération prend plus de temps que prévu. Réessaie.",
  summaryFallbackError: "Le résumé n’a pas pu être généré. Réessaie.", summaryReady: "Ton résumé est prêt",
  pageAnalyzed: "1 page analysée", pagesAnalyzed: "{count} pages analysées", copySummary: "Copier le résumé",
  copied: "Copié !", copyError: "Impossible de copier le résumé depuis ce navigateur.",
  summaryFooter: "Tes cours, un nouvel horizon.",
} as const;

type TranslationKey = keyof typeof french;
type TranslationTable = Record<TranslationKey, string>;

const translations: Record<Language, TranslationTable> = {
  fr: french,
  en: {
    brand: "Study Quiz", language: "Language", french: "Français", english: "English",
    spanish: "Español", portuguese: "Português", chinese: "中文（普通话）", arabic: "العربية",
    homeEyebrow: "Your study space", homeTitle: "Learn your way", homeTitleAccent: ".",
    homeDescription: "Choose a tool and make studying your courses easier.",
    quizOptionTitle: "Turn my course into a quiz", quizOptionDescription: "Test your knowledge with questions based on your PDF.",
    summaryOptionTitle: "Summarize a PDF", summaryOptionDescription: "Find the key ideas in your course with a clear summary.",
    homeCaption: "Hover over or select an option: the globe spins before opening the tool.",
    homeFooter: "Your courses, a new horizon.", backHome: "Home", quizEyebrow: "Interactive quiz",
    quizTitle: "Your course, turned into a quiz.", quizDescription: "Upload your course PDF and test yourself at your own pace.",
    quizRegion: "Create and take a quiz", uploadTitle: "Your course PDF", questionCount: "Number of questions",
    selectedFile: "Selected: {name} ({size} KB)", questions: "{count} questions",
    choosePdf: "Choose a PDF file first.", pdfOnly: "The file must be a PDF.",
    fileTooLarge: "The PDF is larger than 4 MB. Try a shorter excerpt.", generateQuiz: "Generate my quiz",
    pdfHint: "Text-based PDF, up to 4 MB. Avoid uploading confidential documents.",
    quizLoading: "Generating your quiz...", quizLoadingHint: "Reading the PDF and creating questions. This may take up to 2 minutes.",
    generationError: "Something went wrong. Please try again.", timeoutError: "Quiz generation took too long. Please try again.",
    connectionError: "Unable to connect. Check your internet connection.",
    questionProgress: "Question {current} of {total}", correctAnswer: "Correct!", wrongAnswer: "Not quite. Here’s why:",
    nextQuestion: "Next question", viewScore: "View my score", yourScore: "Your score",
    retryNewQuestions: "Try again with new questions", retryQuiz: "Retake this quiz", newPdf: "New PDF",
    review: "Review ({count})", yourAnswer: "Your answer: {answer}", rightAnswer: "Correct answer: {answer}",
    quizFooter: "A quick quiz can make a big difference.", summaryEyebrow: "Smart summary",
    summaryTitle: "The key ideas, made clear.", summaryDescription: "Upload your PDF to extract the key ideas and make them easier to remember.",
    createSummaryRegion: "Create a summary from a PDF", choosePdfFirst: "Choose a PDF file first.",
    summaryLoadingButton: "Reading your course and writing the summary…", summarizePdf: "Summarize my PDF",
    summaryLoading: "Your summary is on its way...", summaryLoadingHint: "Reading the PDF and extracting the key ideas.",
    summaryTimeout: "This is taking longer than expected. Please try again.",
    summaryFallbackError: "Could not generate the summary. Please try again.", summaryReady: "Your summary is ready",
    pageAnalyzed: "1 page analyzed", pagesAnalyzed: "{count} pages analyzed", copySummary: "Copy summary",
    copied: "Copied!", copyError: "Could not copy the summary in this browser.", summaryFooter: "Your courses, a new horizon.",
  },
  es: {
    brand: "Quiz de estudio", language: "Idioma", french: "Français", english: "English",
    spanish: "Español", portuguese: "Português", chinese: "中文（普通话）", arabic: "العربية",
    homeEyebrow: "Tu espacio de estudio", homeTitle: "Aprende a tu manera", homeTitleAccent: ".",
    homeDescription: "Elige una herramienta y convierte tus cursos en sesiones de estudio más sencillas.",
    quizOptionTitle: "Convertir mi curso en un quiz", quizOptionDescription: "Pon a prueba tus conocimientos con preguntas basadas en tu PDF.",
    summaryOptionTitle: "Resumir un PDF", summaryOptionDescription: "Encuentra las ideas clave de tu curso en un resumen claro.",
    homeCaption: "Pasa el cursor o elige una opción: el globo gira antes de abrir la herramienta.",
    homeFooter: "Tus cursos, un nuevo horizonte.", backHome: "Inicio", quizEyebrow: "Quiz interactivo",
    quizTitle: "Tu curso, convertido en un quiz.", quizDescription: "Sube tu curso en PDF y ponte a prueba a tu ritmo.",
    quizRegion: "Crear y responder un quiz", uploadTitle: "Tu curso en PDF", questionCount: "Número de preguntas",
    selectedFile: "Seleccionado: {name} ({size} KB)", questions: "{count} preguntas",
    choosePdf: "Primero elige un archivo PDF.", pdfOnly: "El archivo debe ser un PDF.",
    fileTooLarge: "El PDF supera los 4 MB. Prueba con un fragmento más corto.", generateQuiz: "Generar mi quiz",
    pdfHint: "PDF con texto seleccionable, máximo 4 MB. No subas documentos confidenciales.",
    quizLoading: "Generando el quiz...", quizLoadingHint: "Leyendo el PDF y creando preguntas. Puede tardar hasta 2 minutos.",
    generationError: "Se produjo un error. Inténtalo de nuevo.", timeoutError: "La generación tardó demasiado. Inténtalo de nuevo.",
    connectionError: "No se pudo conectar. Comprueba tu conexión a Internet.",
    questionProgress: "Pregunta {current} de {total}", correctAnswer: "¡Correcto!", wrongAnswer: "No exactamente. Aquí tienes la explicación:",
    nextQuestion: "Siguiente pregunta", viewScore: "Ver mi puntuación", yourScore: "Tu puntuación",
    retryNewQuestions: "Intentar de nuevo con otras preguntas", retryQuiz: "Repetir este quiz", newPdf: "Nuevo PDF",
    review: "Repasar ({count})", yourAnswer: "Tu respuesta: {answer}", rightAnswer: "Respuesta correcta: {answer}",
    quizFooter: "Un pequeño quiz puede marcar una gran diferencia.", summaryEyebrow: "Resumen inteligente",
    summaryTitle: "Las ideas clave, explicadas con claridad.", summaryDescription: "Sube tu PDF para extraer las ideas clave y recordarlas mejor.",
    createSummaryRegion: "Crear un resumen desde un PDF", choosePdfFirst: "Primero elige un archivo PDF.",
    summaryLoadingButton: "Leyendo el curso y redactando el resumen…", summarizePdf: "Resumir mi PDF",
    summaryLoading: "Tu resumen se está preparando...", summaryLoadingHint: "Leyendo el PDF y sintetizando las ideas clave.",
    summaryTimeout: "Está tardando más de lo esperado. Inténtalo de nuevo.",
    summaryFallbackError: "No se pudo generar el resumen. Inténtalo de nuevo.", summaryReady: "Tu resumen está listo",
    pageAnalyzed: "1 página analizada", pagesAnalyzed: "{count} páginas analizadas", copySummary: "Copiar resumen",
    copied: "¡Copiado!", copyError: "No se pudo copiar el resumen en este navegador.", summaryFooter: "Tus cursos, un nuevo horizonte.",
  },
  pt: {
    brand: "Quiz de estudo", language: "Idioma", french: "Français", english: "English",
    spanish: "Español", portuguese: "Português", chinese: "中文（普通话）", arabic: "العربية",
    homeEyebrow: "Seu espaço de estudo", homeTitle: "Aprenda do seu jeito", homeTitleAccent: ".",
    homeDescription: "Escolha uma ferramenta e transforme seus estudos em momentos mais simples.",
    quizOptionTitle: "Transformar meu curso em quiz", quizOptionDescription: "Teste seus conhecimentos com perguntas baseadas no seu PDF.",
    summaryOptionTitle: "Resumir um PDF", summaryOptionDescription: "Encontre as ideias principais do seu curso em um resumo claro.",
    homeCaption: "Passe o cursor ou escolha uma opção: o globo gira antes de abrir a ferramenta.",
    homeFooter: "Seus cursos, um novo horizonte.", backHome: "Início", quizEyebrow: "Quiz interativo",
    quizTitle: "Seu curso transformado em quiz.", quizDescription: "Envie seu curso em PDF e teste seus conhecimentos no seu ritmo.",
    quizRegion: "Criar e responder a um quiz", uploadTitle: "Seu curso em PDF", questionCount: "Número de perguntas",
    selectedFile: "Selecionado: {name} ({size} KB)", questions: "{count} perguntas",
    choosePdf: "Escolha primeiro um arquivo PDF.", pdfOnly: "O arquivo deve ser um PDF.",
    fileTooLarge: "O PDF excede 4 MB. Tente usar um trecho menor.", generateQuiz: "Gerar meu quiz",
    pdfHint: "PDF com texto selecionável, até 4 MB. Evite enviar documentos confidenciais.",
    quizLoading: "Gerando seu quiz...", quizLoadingHint: "Lendo o PDF e criando perguntas. Isso pode levar até 2 minutos.",
    generationError: "Ocorreu um erro. Tente novamente.", timeoutError: "A geração demorou demais. Tente novamente.",
    connectionError: "Não foi possível conectar. Verifique sua conexão com a internet.",
    questionProgress: "Pergunta {current} de {total}", correctAnswer: "Correto!", wrongAnswer: "Não foi bem assim. Veja por quê:",
    nextQuestion: "Próxima pergunta", viewScore: "Ver minha pontuação", yourScore: "Sua pontuação",
    retryNewQuestions: "Tentar novamente com outras perguntas", retryQuiz: "Refazer este quiz", newPdf: "Novo PDF",
    review: "Revisar ({count})", yourAnswer: "Sua resposta: {answer}", rightAnswer: "Resposta correta: {answer}",
    quizFooter: "Um quiz rápido pode fazer uma grande diferença.", summaryEyebrow: "Resumo inteligente",
    summaryTitle: "As ideias principais, explicadas com clareza.", summaryDescription: "Envie seu PDF para extrair as ideias principais e lembrá-las com mais facilidade.",
    createSummaryRegion: "Criar um resumo a partir de um PDF", choosePdfFirst: "Escolha primeiro um arquivo PDF.",
    summaryLoadingButton: "Lendo o curso e escrevendo o resumo…", summarizePdf: "Resumir meu PDF",
    summaryLoading: "Seu resumo está sendo preparado...", summaryLoadingHint: "Lendo o PDF e sintetizando as ideias principais.",
    summaryTimeout: "Está demorando mais do que o esperado. Tente novamente.",
    summaryFallbackError: "Não foi possível gerar o resumo. Tente novamente.", summaryReady: "Seu resumo está pronto",
    pageAnalyzed: "1 página analisada", pagesAnalyzed: "{count} páginas analisadas", copySummary: "Copiar resumo",
    copied: "Copiado!", copyError: "Não foi possível copiar o resumo neste navegador.", summaryFooter: "Seus cursos, um novo horizonte.",
  },
  zh: {
    brand: "学习测验", language: "语言", french: "Français", english: "English",
    spanish: "Español", portuguese: "Português", chinese: "中文（普通话）", arabic: "العربية",
    homeEyebrow: "你的学习空间", homeTitle: "按自己的方式学习", homeTitleAccent: "。",
    homeDescription: "选择一种工具，让课程复习变得更轻松。",
    quizOptionTitle: "将课程转换为测验", quizOptionDescription: "根据 PDF 内容生成问题，检验你的知识。",
    summaryOptionTitle: "总结 PDF", summaryOptionDescription: "通过清晰的摘要掌握课程重点。",
    homeCaption: "悬停或选择一个选项：地球旋转后将打开对应工具。",
    homeFooter: "课程学习，开启新视野。", backHome: "首页", quizEyebrow: "互动测验",
    quizTitle: "把课程变成测验。", quizDescription: "上传课程 PDF，按照自己的节奏检验学习成果。",
    quizRegion: "创建并完成测验", uploadTitle: "课程 PDF", questionCount: "问题数量",
    selectedFile: "已选择：{name}（{size} KB）", questions: "{count} 个问题",
    choosePdf: "请先选择 PDF 文件。", pdfOnly: "文件必须是 PDF 格式。",
    fileTooLarge: "PDF 超过 4 MB。请尝试更短的课程片段。", generateQuiz: "生成测验",
    pdfHint: "请使用可选择文本的 PDF，最大 4 MB。避免上传机密文件。",
    quizLoading: "正在生成测验…", quizLoadingHint: "正在读取 PDF 并创建问题，最多可能需要 2 分钟。",
    generationError: "发生错误，请重试。", timeoutError: "生成时间过长，请重试。",
    connectionError: "无法连接。请检查网络连接。", questionProgress: "第 {current} 题，共 {total} 题",
    correctAnswer: "回答正确！", wrongAnswer: "不太对，原因如下：", nextQuestion: "下一题",
    viewScore: "查看分数", yourScore: "你的分数", retryNewQuestions: "使用新问题再试一次",
    retryQuiz: "重新完成此测验", newPdf: "新 PDF", review: "复习（{count}）",
    yourAnswer: "你的答案：{answer}", rightAnswer: "正确答案：{answer}",
    quizFooter: "一次小测验，让复习更进一步。", summaryEyebrow: "智能摘要",
    summaryTitle: "清晰了解课程重点。", summaryDescription: "上传 PDF，提取重要概念并轻松记忆。",
    createSummaryRegion: "从 PDF 创建摘要", choosePdfFirst: "请先选择 PDF 文件。",
    summaryLoadingButton: "正在阅读课程并撰写摘要…", summarizePdf: "总结 PDF",
    summaryLoading: "正在准备摘要…", summaryLoadingHint: "正在读取 PDF 并提炼核心内容。",
    summaryTimeout: "处理时间超出预期，请重试。", summaryFallbackError: "无法生成摘要，请重试。",
    summaryReady: "摘要已准备就绪", pageAnalyzed: "已分析 1 页", pagesAnalyzed: "已分析 {count} 页",
    copySummary: "复制摘要", copied: "已复制！", copyError: "无法在此浏览器中复制摘要。",
    summaryFooter: "课程学习，开启新视野。",
  },
  ar: {
    brand: "اختبار المراجعة", language: "اللغة", french: "Français", english: "English",
    spanish: "Español", portuguese: "Português", chinese: "中文（普通话）", arabic: "العربية",
    homeEyebrow: "مساحة دراستك", homeTitle: "تعلّم بطريقتك", homeTitleAccent: ".",
    homeDescription: "اختر أداة وحوّل دروسك إلى جلسات مراجعة أسهل.",
    quizOptionTitle: "حوّل درسي إلى اختبار", quizOptionDescription: "اختبر معلوماتك بأسئلة مستندة إلى ملف PDF.",
    summaryOptionTitle: "تلخيص ملف PDF", summaryOptionDescription: "اكتشف أهم أفكار درسك في ملخص واضح.",
    homeCaption: "مرّر المؤشر أو اختر خيارًا: ستدور الكرة الأرضية قبل فتح الأداة.",
    homeFooter: "دروسك نحو آفاق جديدة.", backHome: "الرئيسية", quizEyebrow: "اختبار تفاعلي",
    quizTitle: "حوّل درسك إلى اختبار.", quizDescription: "ارفع ملف الدرس بصيغة PDF واختبر نفسك بالسرعة التي تناسبك.",
    quizRegion: "إنشاء اختبار وإجراؤه", uploadTitle: "ملف الدرس PDF", questionCount: "عدد الأسئلة",
    selectedFile: "تم الاختيار: {name} ({size} كيلوبايت)", questions: "{count} أسئلة",
    choosePdf: "اختر ملف PDF أولاً.", pdfOnly: "يجب أن يكون الملف بصيغة PDF.",
    fileTooLarge: "حجم PDF أكبر من 4 ميغابايت. جرّب جزءًا أقصر من الدرس.", generateQuiz: "إنشاء الاختبار",
    pdfHint: "استخدم ملف PDF يحتوي على نص قابل للتحديد، بحد أقصى 4 ميغابايت. تجنب الملفات السرية.",
    quizLoading: "جارٍ إنشاء الاختبار...", quizLoadingHint: "جارٍ قراءة PDF وإنشاء الأسئلة. قد يستغرق ذلك دقيقتين.",
    generationError: "حدث خطأ. حاول مرة أخرى.", timeoutError: "استغرق الإنشاء وقتًا طويلاً. حاول مرة أخرى.",
    connectionError: "تعذر الاتصال. تحقق من اتصالك بالإنترنت.", questionProgress: "السؤال {current} من {total}",
    correctAnswer: "إجابة صحيحة!", wrongAnswer: "إجابة غير صحيحة. إليك السبب:", nextQuestion: "السؤال التالي",
    viewScore: "عرض نتيجتي", yourScore: "نتيجتك", retryNewQuestions: "أعد المحاولة بأسئلة جديدة",
    retryQuiz: "أعد هذا الاختبار", newPdf: "ملف PDF جديد", review: "للمراجعة ({count})",
    yourAnswer: "إجابتك: {answer}", rightAnswer: "الإجابة الصحيحة: {answer}",
    quizFooter: "اختبار قصير يحقق تقدمًا كبيرًا في دراستك.", summaryEyebrow: "ملخص ذكي",
    summaryTitle: "أهم أفكار درسك بوضوح.", summaryDescription: "أضف ملف PDF لاستخراج المفاهيم المهمة وتذكرها بسهولة.",
    createSummaryRegion: "إنشاء ملخص من ملف PDF", choosePdfFirst: "اختر ملف PDF أولاً.",
    summaryLoadingButton: "جارٍ قراءة الدرس وكتابة الملخص…", summarizePdf: "تلخيص ملف PDF",
    summaryLoading: "جارٍ إعداد الملخص...", summaryLoadingHint: "جارٍ قراءة PDF واستخراج الأفكار الأساسية.",
    summaryTimeout: "استغرق الأمر وقتًا أطول من المتوقع. حاول مرة أخرى.",
    summaryFallbackError: "تعذر إنشاء الملخص. حاول مرة أخرى.", summaryReady: "ملخصك جاهز",
    pageAnalyzed: "تم تحليل صفحة واحدة", pagesAnalyzed: "تم تحليل {count} صفحات",
    copySummary: "نسخ الملخص", copied: "تم النسخ!", copyError: "تعذر نسخ الملخص في هذا المتصفح.",
    summaryFooter: "دروسك نحو آفاق جديدة.",
  },
};

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = "quiz-revision-language";
const languageLabelKeys: Record<Language, TranslationKey> = {
  fr: "french",
  en: "english",
  es: "spanish",
  pt: "portuguese",
  zh: "chinese",
  ar: "arabic",
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("fr");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (isLanguage(saved)) setLanguage(saved);
      setReady(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.title = translations[language].brand;
  }, [language, ready]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key, values = {}) =>
        Object.entries(values).reduce(
          (text, [name, replacement]) => text.replaceAll(`{${name}}`, String(replacement)),
          translations[language][key]
        ),
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within a LanguageProvider.");
  return context;
}

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <label className="language-control">
      <span className="language-control-label">{t("language")}</span>
      <select
        className="language-select"
        aria-label={t("language")}
        value={language}
        onChange={(event) => {
          if (isLanguage(event.target.value)) setLanguage(event.target.value);
        }}
      >
        {SUPPORTED_LANGUAGES.map((code) => (
          <option key={code} value={code}>
            {t(languageLabelKeys[code])}
          </option>
        ))}
      </select>
    </label>
  );
}
