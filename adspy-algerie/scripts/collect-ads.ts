#!/usr/bin/env -S tsx
import { searchAdsForTerms } from "../src/lib/metaAdLibrary.js";
import {
  analyzeAd,
  dedupeAds,
  filterByMinDays,
  sortByDaysRunning,
  type AnalyzedAd,
} from "../src/lib/adAnalysis.js";
import { DEFAULT_SEARCH_TERMS } from "../src/config/searchTerms.js";

try {
  process.loadEnvFile(new URL("../.env", import.meta.url));
} catch {
  // Pas de .env : on retombe sur les variables d'environnement deja presentes.
}

interface CliOptions {
  country: string;
  minDays: number;
  limit: number;
  terms: string[];
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    country: "DZ",
    minDays: 15,
    limit: 25,
    terms: DEFAULT_SEARCH_TERMS,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = argv[i + 1];
    if (arg === "--country" && value) {
      options.country = value.toUpperCase();
      i++;
    } else if (arg === "--min-days" && value) {
      options.minDays = Number(value);
      i++;
    } else if (arg === "--limit" && value) {
      options.limit = Number(value);
      i++;
    } else if (arg === "--terms" && value) {
      options.terms = value.split(",").map((t) => t.trim()).filter(Boolean);
      i++;
    }
  }
  return options;
}

function printTable(ads: AnalyzedAd[]): void {
  if (ads.length === 0) {
    console.log("Aucune pub trouvee avec ces criteres.");
    return;
  }
  console.log(
    `\n${ads.length} pub(s) trouvee(s), triees par jours de diffusion decroissants :\n`,
  );
  for (const ad of ads) {
    console.log(`- ${ad.daysRunning}j  |  ${ad.pageName}`);
    if (ad.snippet) console.log(`       ${ad.snippet.slice(0, 100)}`);
    if (ad.snapshotUrl) console.log(`       ${ad.snapshotUrl}`);
  }
  console.log("");
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!accessToken) {
    console.error(
      "META_ACCESS_TOKEN manquant. Copiez .env.example vers .env et renseignez " +
        "votre token d'acces Meta (voir README.md pour la procedure).",
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    `Recherche des pubs actives en ${options.country}, mots-cles: ${options.terms.join(", ")}`,
  );

  const rawAds = await searchAdsForTerms(options.terms, {
    accessToken,
    country: options.country,
    limit: options.limit,
  });

  const analyzed = rawAds
    .map((ad) => analyzeAd(ad))
    .filter((ad): ad is NonNullable<typeof ad> => ad !== null);

  const deduped = dedupeAds(analyzed);
  const filtered = filterByMinDays(deduped, options.minDays);
  const sorted = sortByDaysRunning(filtered);

  printTable(sorted);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
