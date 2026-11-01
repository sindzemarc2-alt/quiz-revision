import { readFile } from "node:fs/promises";
import { extractPdfText } from "../src/lib/pdf";

async function main() {
  const chemin = process.argv[2];

  if (!chemin) {
    console.error("Usage : npx tsx scripts/spike-pdf.ts samples/cours.pdf");
    process.exit(1);
  }

  const buffer = await readFile(chemin);
  const result = await extractPdfText(new Uint8Array(buffer));

  console.log("Pages :", result.pages);
  console.log("Caractères :", result.characters);
  console.log("Caractères par page :", result.charactersPerPage);
  console.log("---- Début du texte ----");
  console.log(result.text.slice(0, 500));
  console.log("------------------------");
  console.log(
    result.likelyScanned
      ? "⚠️ Très peu de texte : PDF probablement scanné."
      : "✅ Texte exploitable."
  );
}

main().catch((erreur) => {
  console.error("Erreur :", erreur);
  process.exit(1);
});