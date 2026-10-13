/**
 * Amorce les données de référence (sources, catalogue des taxes, mentions de
 * facture candidates), toutes au statut « à vérifier ».
 * Usage : npm run db:seed-reference
 */
import { config } from "dotenv";

config({ path: process.env.DOTENV_PATH ?? ".env.local", quiet: true });

async function main() {
  const { getDb, closeDb } = await import("@/server/db");
  const { seedReferenceData } = await import("@/server/reference/seed");
  try {
    const r = await seedReferenceData(getDb());
    console.log(`Ajoutés : ${r.sources} sources, ${r.taxes} taxes, ${r.mentions} mentions (toutes « à vérifier »).`);
  } finally {
    await closeDb();
  }
}

main().catch((err) => {
  console.error("Échec de l'amorçage :", err instanceof Error ? err.message : err);
  process.exit(1);
});
