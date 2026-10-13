import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { closeDb, getDb } from "@/server/db";
import { officialSources, taxes, taxRules } from "@/server/db/schema";
import { explainUndetermined, resolveTaxRule, resolveVatRate } from "@/server/tax/resolve";
import { resetDatabase } from "../support/db";

afterAll(closeDb);

// Valeurs FICTIVES de test : elles ne représentent aucun taux réel.
const FAKE_RATE = "TEST_TAUX";

async function setup() {
  await resetDatabase();
  const db = getDb();
  await db.insert(taxes).values({ code: "TVA", name: "Taxe sur la valeur ajoutée" });
  const [source] = await db
    .insert(officialSources)
    .values({ slug: "src-test", issuer: "dgi", kind: "official_page", reference: "Réf. test", title: "Source de test" })
    .returning();
  return { db, source };
}

const base = { code: FAKE_RATE, taxCode: "TVA", kind: "rate" as const, label: "Taux de test" };

describe("résolution des règles fiscales", () => {
  let ctx: Awaited<ReturnType<typeof setup>>;
  beforeEach(async () => {
    ctx = await setup();
  });

  it("aucune règle → non déterminé (jamais de valeur par défaut)", async () => {
    const r = await resolveTaxRule(ctx.db, FAKE_RATE, "2026-03-01");
    expect(r).toEqual({ status: "undetermined", reason: "no_rule", candidates: [] });
  });

  it("une règle non vérifiée n'est jamais appliquée, mais signalée", async () => {
    await ctx.db.insert(taxRules).values({ ...base, rateBasisPoints: 1234, validFrom: "2020-01-01", status: "to_verify" });
    const r = await resolveTaxRule(ctx.db, FAKE_RATE, "2026-03-01");
    expect(r.status).toBe("undetermined");
    if (r.status === "undetermined") {
      expect(r.reason).toBe("not_verified");
      expect(r.candidates).toHaveLength(1);
    }
  });

  it("applique la version vérifiée en vigueur à la date de l'opération", async () => {
    const now = new Date();
    await ctx.db.insert(taxRules).values([
      { ...base, version: 1, rateBasisPoints: 1000, validFrom: "2020-01-01", validTo: "2025-01-01", status: "verified", sourceId: ctx.source.id, verifiedAt: now },
      { ...base, version: 2, rateBasisPoints: 1500, validFrom: "2025-01-01", status: "verified", sourceId: ctx.source.id, verifiedAt: now },
    ]);
    const old = await resolveTaxRule(ctx.db, FAKE_RATE, "2024-12-31");
    const current = await resolveTaxRule(ctx.db, FAKE_RATE, "2025-01-01");
    expect(old.status === "determined" && old.rule.rateBasisPoints).toBe(1000);
    expect(current.status === "determined" && current.rule.rateBasisPoints).toBe(1500);
    expect(current.status === "determined" && current.source.reference).toBe("Réf. test");
    // Avant toute règle : non déterminé.
    expect((await resolveTaxRule(ctx.db, FAKE_RATE, "2019-06-01")).status).toBe("undetermined");
  });

  it("une règle expirée n'est plus utilisée", async () => {
    await ctx.db.insert(taxRules).values({
      ...base, rateBasisPoints: 1000, validFrom: "2020-01-01", validTo: "2024-01-01",
      status: "verified", sourceId: ctx.source.id, verifiedAt: new Date(),
    });
    expect((await resolveTaxRule(ctx.db, FAKE_RATE, "2024-01-01")).status).toBe("undetermined");
  });

  it("la base refuse deux versions vérifiées qui se chevauchent", async () => {
    const v = { ...base, status: "verified" as const, sourceId: ctx.source.id, verifiedAt: new Date() };
    await ctx.db.insert(taxRules).values({ ...v, version: 1, rateBasisPoints: 1000, validFrom: "2020-01-01" });
    await expect(
      ctx.db.insert(taxRules).values({ ...v, version: 2, rateBasisPoints: 1100, validFrom: "2023-01-01" }),
    ).rejects.toThrow();
  });

  it("la base refuse une règle vérifiée sans source", async () => {
    await expect(
      ctx.db.insert(taxRules).values({ ...base, rateBasisPoints: 1000, validFrom: "2020-01-01", status: "verified", verifiedAt: new Date() }),
    ).rejects.toThrow();
  });

  it("la base refuse un taux manquant ou hors bornes et une période incohérente", async () => {
    await expect(ctx.db.insert(taxRules).values({ ...base, validFrom: "2020-01-01" })).rejects.toThrow();
    await expect(ctx.db.insert(taxRules).values({ ...base, rateBasisPoints: 10_001, validFrom: "2020-01-01" })).rejects.toThrow();
    await expect(
      ctx.db.insert(taxRules).values({ ...base, rateBasisPoints: 100, validFrom: "2020-01-01", validTo: "2020-01-01" }),
    ).rejects.toThrow();
  });

  it("refuse une date mal formée", async () => {
    await expect(resolveTaxRule(ctx.db, FAKE_RATE, "01/03/2026")).rejects.toThrow();
  });
});

describe("TVA selon la situation de l'entreprise", () => {
  let ctx: Awaited<ReturnType<typeof setup>>;
  beforeEach(async () => {
    ctx = await setup();
    await ctx.db.insert(taxRules).values({
      ...base, rateBasisPoints: 1000, validFrom: "2020-01-01", status: "verified", sourceId: ctx.source.id, verifiedAt: new Date(),
    });
  });

  it("situation inconnue → aucune règle appliquée, même si une règle vérifiée existe", async () => {
    const r = await resolveVatRate(ctx.db, { vatLiability: "unknown" }, FAKE_RATE, "2026-03-01");
    expect(r).toEqual({ status: "profile_incomplete" });
    expect(explainUndetermined({ status: "profile_incomplete" })).toMatch(/aucune taxe n'est appliquée/);
  });

  it("non assujettie → non applicable", async () => {
    expect(await resolveVatRate(ctx.db, { vatLiability: "not_subject" }, FAKE_RATE, "2026-03-01")).toEqual({
      status: "not_applicable",
    });
  });

  it("assujettie → règle vérifiée en vigueur", async () => {
    const r = await resolveVatRate(ctx.db, { vatLiability: "subject" }, FAKE_RATE, "2026-03-01");
    expect(r.status === "determined" && r.rule.rateBasisPoints).toBe(1000);
  });
});
