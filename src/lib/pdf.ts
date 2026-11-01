import { extractText, getDocumentProxy } from "unpdf";

export type PdfExtraction = {
  pages: number;
  text: string;
  characters: number;
  charactersPerPage: number;
  likelyScanned: boolean;
};

// En dessous de ce seuil, on considère que le PDF est un scan (images)
const MIN_CHARS_PER_PAGE = 200;

export async function extractPdfText(data: Uint8Array): Promise<PdfExtraction> {
  const pdf = await getDocumentProxy(data);
  const { totalPages, text } = await extractText(pdf, { mergePages: true });

  // Nettoyage : espaces et sauts de ligne multiples remplacés par un espace
  const clean = text.replace(/\s+/g, " ").trim();

  const charactersPerPage =
    totalPages > 0 ? Math.round(clean.length / totalPages) : 0;

  return {
    pages: totalPages,
    text: clean,
    characters: clean.length,
    charactersPerPage,
    likelyScanned: charactersPerPage < MIN_CHARS_PER_PAGE,
  };
}