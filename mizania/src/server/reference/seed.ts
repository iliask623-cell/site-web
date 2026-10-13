import "server-only";
import { sql } from "drizzle-orm";
import type { Database } from "@/server/db";
import { invoiceMentionRules, officialSources, taxes } from "@/server/db/schema";
import { INVOICE_MENTIONS, SOURCES, TAXES } from "./seed-data";

/**
 * Insère les données de référence initiales. Idempotent, et ne modifie JAMAIS
 * une ligne existante : une source ou une mention déjà vérifiée/corrigée par
 * l'administration n'est pas écrasée.
 */
export async function seedReferenceData(db: Database) {
  return db.transaction(async (tx) => {
    const sources = await tx.insert(officialSources).values(SOURCES).onConflictDoNothing().returning({ id: officialSources.id });
    const taxRows = await tx.insert(taxes).values(TAXES).onConflictDoNothing().returning({ code: taxes.code });

    const all = await tx.select({ id: officialSources.id, slug: officialSources.slug }).from(officialSources);
    const bySlug = new Map(all.map((s) => [s.slug, s.id]));
    const mentions = await tx
      .insert(invoiceMentionRules)
      .values(
        INVOICE_MENTIONS.map(({ sourceSlug, ...m }) => {
          const sourceId = bySlug.get(sourceSlug);
          if (!sourceId) throw new Error(`Source inconnue : ${sourceSlug}`);
          return { ...m, sourceId };
        }),
      )
      .onConflictDoNothing()
      .returning({ id: invoiceMentionRules.id });

    // Garde-fou : l'amorçage ne doit jamais produire de donnée « vérifiée ».
    const [{ verified }] = await tx.execute<{ verified: number }>(sql`
      select (select count(*) from official_sources where status = 'verified' and verified_by is null)::int
           + (select count(*) from invoice_mention_rules where status = 'verified' and verified_by is null)::int as verified
    `);
    if (verified > 0) throw new Error("Donnée de référence marquée vérifiée sans vérificateur.");

    return { sources: sources.length, taxes: taxRows.length, mentions: mentions.length };
  });
}
