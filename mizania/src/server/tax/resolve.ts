import "server-only";
import { and, asc, eq, gt, isNull, lte, or } from "drizzle-orm";
import { z } from "zod";
import type { Database, Tx } from "@/server/db";
import { officialSources, taxRules } from "@/server/db/schema";

type Reader = Database | Tx;
type TaxRuleRow = typeof taxRules.$inferSelect;
type SourceRow = typeof officialSources.$inferSelect;

export type ResolvedRule = { rule: TaxRuleRow; source: SourceRow };

/**
 * Résultat d'une résolution de règle fiscale. `determined` n'est renvoyé que
 * pour une règle VÉRIFIÉE, sourcée et en vigueur à la date demandée. Dans tous
 * les autres cas, l'appelant doit afficher que l'information est à vérifier :
 * aucune valeur par défaut n'est jamais utilisée.
 */
export type RuleResolution =
  | { status: "determined"; rule: TaxRuleRow; source: SourceRow }
  | {
      status: "undetermined";
      reason: "no_rule" | "not_verified";
      /** Versions non vérifiées en vigueur à la date (à afficher comme « à vérifier »). */
      candidates: TaxRuleRow[];
    };

const isoDate = z.iso.date();

export async function resolveTaxRule(db: Reader, code: string, on: string): Promise<RuleResolution> {
  const day = isoDate.parse(on);
  const inForce = and(
    eq(taxRules.code, code),
    lte(taxRules.validFrom, day),
    or(isNull(taxRules.validTo), gt(taxRules.validTo, day)),
  );
  const rows = await db
    .select({ rule: taxRules, source: officialSources })
    .from(taxRules)
    .leftJoin(officialSources, eq(taxRules.sourceId, officialSources.id))
    .where(inForce)
    .orderBy(asc(taxRules.version));

  // La contrainte d'exclusion garantit au plus une version vérifiée à une date.
  const verified = rows.find((r) => r.rule.status === "verified");
  if (verified?.source) {
    return { status: "determined", rule: verified.rule, source: verified.source };
  }
  const candidates = rows.filter((r) => r.rule.status === "to_verify" || r.rule.status === "draft").map((r) => r.rule);
  return { status: "undetermined", reason: candidates.length > 0 ? "not_verified" : "no_rule", candidates };
}

export type VatProfile = { vatLiability: "unknown" | "subject" | "not_subject" };

export type VatResolution =
  | RuleResolution
  | { status: "profile_incomplete" }
  | { status: "not_applicable" };

/**
 * Détermine un taux de TVA pour une entreprise. Si la situation fiscale de
 * l'entreprise n'est pas connue, AUCUNE règle n'est appliquée.
 * Les exonérations par opération sont traitées au niveau de la ligne de facture.
 */
export async function resolveVatRate(
  db: Reader,
  profile: VatProfile,
  rateCode: string,
  on: string,
): Promise<VatResolution> {
  if (profile.vatLiability === "unknown") return { status: "profile_incomplete" };
  if (profile.vatLiability === "not_subject") return { status: "not_applicable" };
  return resolveTaxRule(db, rateCode, on);
}

/** Message utilisateur en français pour chaque cas non déterminé. */
export function explainUndetermined(r: Exclude<VatResolution, { status: "determined" }>): string {
  switch (r.status) {
    case "profile_incomplete":
      return "Votre situation au regard de la TVA n'est pas encore renseignée : aucune taxe n'est appliquée automatiquement. Complétez votre profil fiscal.";
    case "not_applicable":
      return "Votre entreprise est déclarée non assujettie à la TVA : aucune TVA n'est calculée.";
    case "undetermined":
      return r.reason === "not_verified"
        ? "Une règle existe mais n'a pas encore été vérifiée contre le texte officiel. Information à vérifier avant utilisation."
        : "Aucune règle fiscale vérifiée n'est disponible pour cette date. Information à vérifier auprès des sources officielles.";
  }
}
