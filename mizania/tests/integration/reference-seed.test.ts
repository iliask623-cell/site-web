import { ne } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { closeDb, getDb } from "@/server/db";
import { invoiceMentionRules, officialSources, taxRules } from "@/server/db/schema";
import { seedReferenceData } from "@/server/reference/seed";
import { INVOICE_MENTIONS, SOURCES, TAXES } from "@/server/reference/seed-data";
import { resetDatabase } from "../support/db";

afterAll(closeDb);

describe("amorçage des données de référence", () => {
  beforeEach(resetDatabase);

  it("insère tout au statut « à vérifier » et aucun taux fiscal", async () => {
    const r = await seedReferenceData(getDb());
    expect(r).toEqual({ sources: SOURCES.length, taxes: TAXES.length, mentions: INVOICE_MENTIONS.length });
    expect(await getDb().select().from(officialSources).where(ne(officialSources.status, "to_verify"))).toHaveLength(0);
    expect(await getDb().select().from(invoiceMentionRules).where(ne(invoiceMentionRules.status, "to_verify"))).toHaveLength(0);
    expect(await getDb().select().from(taxRules)).toHaveLength(0);
  });

  it("est idempotent et n'écrase pas une correction de l'administration", async () => {
    await seedReferenceData(getDb());
    await getDb().update(officialSources).set({ title: "Titre corrigé" });
    const again = await seedReferenceData(getDb());
    expect(again).toEqual({ sources: 0, taxes: 0, mentions: 0 });
    const rows = await getDb().select().from(officialSources);
    expect(rows.every((s) => s.title === "Titre corrigé")).toBe(true);
  });
});
