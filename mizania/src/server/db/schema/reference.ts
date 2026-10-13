import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { timestamps, users } from "./identity";

/**
 * Référentiels réglementaires GLOBAUX (non rattachés à une organisation).
 * Lecture pour tous les utilisateurs connectés, écriture réservée à
 * l'administration. Rien ici n'est utilisé pour un calcul tant que le statut
 * n'est pas `verified` (vérifié par un humain contre le texte officiel).
 */

export const verificationStatusEnum = pgEnum("verification_status", [
  "draft",
  "to_verify",
  "verified",
  "retired",
]);

// ───────────────────────── Sources officielles ─────────────────────────

export const sourceIssuerEnum = pgEnum("source_issuer", [
  "jora", // Journal officiel de la République algérienne
  "finance_ministry",
  "dgi",
  "commerce_ministry",
  "justice_ministry",
  "anpdp",
  "other",
]);

export const sourceKindEnum = pgEnum("source_kind", [
  "law",
  "ordinance",
  "executive_decree",
  "order", // arrêté
  "instruction",
  "methodological_note",
  "official_page",
  "other",
]);

export const officialSources = pgTable(
  "official_sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Clé stable lisible, ex. « loi-07-11 ». */
    slug: text("slug").notNull(),
    issuer: sourceIssuerEnum("issuer").notNull(),
    kind: sourceKindEnum("kind").notNull(),
    /** Référence officielle, ex. « Loi n° 07-11 du 25 novembre 2007 ». */
    reference: text("reference").notNull(),
    title: text("title").notNull(),
    publishedOn: date("published_on", { mode: "string" }),
    /** Ex. « JO n° 80 du 11 décembre 2005 ». */
    journalReference: text("journal_reference"),
    url: text("url"),
    /** D'où vient l'information et ce qui reste à confirmer. */
    provenanceNote: text("provenance_note"),
    status: verificationStatusEnum("status").notNull().default("to_verify"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    verifiedBy: uuid("verified_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("official_sources_slug_key").on(t.slug),
    check("official_sources_verified_has_date", sql`${t.status} <> 'verified' or ${t.verifiedAt} is not null`),
  ],
);

// ───────────────────────── Couche FISCALE (distincte du SCF) ─────────────────────────

/** Catalogue des impôts et taxes (TVA, IBS, IRG…). Aucun taux ici. */
export const taxes = pgTable(
  "taxes",
  {
    code: text("code").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    ...timestamps,
  },
  (t) => [check("taxes_code_format", sql`${t.code} ~ '^[A-Z][A-Z0-9_]{1,31}$'`)],
);

export const taxRuleKindEnum = pgEnum("tax_rule_kind", [
  "rate", // taux (points de base)
  "threshold", // seuil (centimes)
  "exemption", // exonération
  "regime_condition", // condition d'éligibilité à un régime
]);

/**
 * Règles fiscales datées, versionnées et sourcées. Une même règle (`code`)
 * peut avoir plusieurs versions dans le temps ; deux versions VÉRIFIÉES ne
 * peuvent pas se chevaucher (contrainte d'exclusion en base).
 */
export const taxRules = pgTable(
  "tax_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Identifiant stable de la règle, ex. « TVA_TAUX_NORMAL ». */
    code: text("code").notNull(),
    taxCode: text("tax_code")
      .notNull()
      .references(() => taxes.code),
    kind: taxRuleKindEnum("kind").notNull(),
    label: text("label").notNull(),
    /** Pour `rate` : 1 % = 100 points de base. */
    rateBasisPoints: integer("rate_basis_points"),
    /** Pour `threshold` : montant en centimes de DA. */
    amountCents: bigint("amount_cents", { mode: "number" }),
    conditions: text("conditions"),
    exemptions: text("exemptions"),
    validFrom: date("valid_from", { mode: "string" }).notNull(),
    /** Exclusive. NULL = toujours en vigueur à notre connaissance. */
    validTo: date("valid_to", { mode: "string" }),
    /** Loi de finances / exercice concerné, si pertinent. */
    fiscalYear: integer("fiscal_year"),
    sourceId: uuid("source_id").references(() => officialSources.id),
    legalArticle: text("legal_article"),
    version: integer("version").notNull().default(1),
    status: verificationStatusEnum("status").notNull().default("draft"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    verifiedBy: uuid("verified_by").references(() => users.id, { onDelete: "set null" }),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("tax_rules_code_version_key").on(t.code, t.version),
    index("tax_rules_lookup_idx").on(t.code, t.validFrom),
    check("tax_rules_code_format", sql`${t.code} ~ '^[A-Z][A-Z0-9_]{1,63}$'`),
    check("tax_rules_period", sql`${t.validTo} is null or ${t.validTo} > ${t.validFrom}`),
    check(
      "tax_rules_rate_value",
      sql`${t.kind} <> 'rate' or (${t.rateBasisPoints} is not null and ${t.rateBasisPoints} between 0 and 10000)`,
    ),
    check("tax_rules_threshold_value", sql`${t.kind} <> 'threshold' or (${t.amountCents} is not null and ${t.amountCents} >= 0)`),
    // Une règle vérifiée est forcément sourcée, datée et attribuée.
    check(
      "tax_rules_verified_is_sourced",
      sql`${t.status} <> 'verified' or (${t.sourceId} is not null and ${t.verifiedAt} is not null)`,
    ),
  ],
);

// ───────────────────────── Mentions de facturation (droit commercial) ─────────────────────────

export const invoiceMentionScopeEnum = pgEnum("invoice_mention_scope", ["seller", "buyer", "document", "line"]);

/**
 * Mentions devant figurer sur une facture, configurables et sourcées.
 * `fieldKey` relie la mention à la donnée contrôlée avant émission
 * (ex. « seller.rc »). Seules les mentions `verified` bloquent l'émission ;
 * les autres produisent un avertissement « à vérifier ».
 */
export const invoiceMentionRules = pgTable(
  "invoice_mention_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull(),
    scope: invoiceMentionScopeEnum("scope").notNull(),
    label: text("label").notNull(),
    fieldKey: text("field_key"),
    /** Situation dans laquelle la mention s'applique (texte libre, revu par un humain). */
    condition: text("condition"),
    validFrom: date("valid_from", { mode: "string" }).notNull(),
    validTo: date("valid_to", { mode: "string" }),
    sourceId: uuid("source_id").references(() => officialSources.id),
    legalArticle: text("legal_article"),
    version: integer("version").notNull().default(1),
    status: verificationStatusEnum("status").notNull().default("draft"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    verifiedBy: uuid("verified_by").references(() => users.id, { onDelete: "set null" }),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("invoice_mention_rules_code_version_key").on(t.code, t.version),
    check("invoice_mention_rules_period", sql`${t.validTo} is null or ${t.validTo} > ${t.validFrom}`),
    check(
      "invoice_mention_rules_verified_is_sourced",
      sql`${t.status} <> 'verified' or (${t.sourceId} is not null and ${t.verifiedAt} is not null)`,
    ),
  ],
);
