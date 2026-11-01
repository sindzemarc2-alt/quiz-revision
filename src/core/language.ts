export const SUPPORTED_LANGUAGES = ["fr", "en", "es", "pt", "zh", "ar"] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && SUPPORTED_LANGUAGES.includes(value as Language);
}

const languageNames: Record<Language, string> = {
  fr: "French",
  en: "English",
  es: "Spanish",
  pt: "Portuguese",
  zh: "Mandarin Chinese",
  ar: "Arabic",
};

export function languageName(language: Language): string {
  return languageNames[language];
}
