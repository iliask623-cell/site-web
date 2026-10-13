/**
 * Données de référence initiales. RIEN ici n'est marqué « vérifié » :
 * chaque élément doit être confronté au texte officiel (Journal officiel,
 * DGI, ministères) par un humain, via l'administration, avant d'être utilisé
 * dans un calcul ou un contrôle bloquant.
 *
 * Aucun taux ni seuil fiscal n'est fourni ici volontairement.
 */
import type { officialSources, invoiceMentionRules, taxes } from "@/server/db/schema";

type NewSource = typeof officialSources.$inferInsert;
type NewTax = typeof taxes.$inferInsert;
type NewMention = Omit<typeof invoiceMentionRules.$inferInsert, "sourceId"> & { sourceSlug: string };

const FROM_MF_DOC =
  "Référence citée dans « Le Système Comptable Financier : pour une véritable convergence vers le référentiel comptable international IAS/IFRS » (document du ministère des Finances fourni par l'utilisateur). Texte intégral non consulté.";

export const SOURCES: NewSource[] = [
  // ── Comptabilité (SCF) ──
  {
    slug: "loi-07-11",
    issuer: "jora",
    kind: "law",
    reference: "Loi n° 07-11 du 25 novembre 2007",
    title: "Loi portant système comptable financier",
    publishedOn: null,
    provenanceNote: FROM_MF_DOC,
  },
  {
    slug: "de-08-156",
    issuer: "jora",
    kind: "executive_decree",
    reference: "Décret exécutif n° 08-156 du 26 mai 2008",
    title: "Décret portant application des dispositions de la loi n° 07-11 portant système comptable financier",
    provenanceNote: FROM_MF_DOC,
  },
  {
    slug: "de-09-110",
    issuer: "jora",
    kind: "executive_decree",
    reference: "Décret exécutif n° 09-110 du 7 avril 2009",
    title: "Décret fixant les conditions et modalités de la tenue de la comptabilité au moyen de systèmes informatiques",
    provenanceNote: `${FROM_MF_DOC} Texte directement applicable à un logiciel comme MIZANIA : à lire en priorité.`,
  },
  {
    slug: "arrete-2008-07-26-nomenclature",
    issuer: "jora",
    kind: "order",
    reference: "Arrêté du 26 juillet 2008",
    title:
      "Arrêté fixant les règles d'évaluation et de comptabilisation, le contenu et la présentation des états financiers ainsi que la nomenclature et les règles de fonctionnement des comptes",
    provenanceNote: `${FROM_MF_DOC} Source de la nomenclature des comptes SCF à importer.`,
  },
  {
    slug: "arrete-2008-07-26-petites-entites",
    issuer: "jora",
    kind: "order",
    reference: "Arrêté du 26 juillet 2008",
    title:
      "Arrêté fixant les seuils de chiffre d'affaires, d'effectif et d'activité applicables aux petites entités pour la tenue d'une comptabilité financière simplifiée",
    provenanceNote: FROM_MF_DOC,
  },
  {
    slug: "instruction-02-2009",
    issuer: "finance_ministry",
    kind: "instruction",
    reference: "Instruction ministérielle n° 02 du 29 octobre 2009",
    title: "Instruction portant première application du système comptable financier (tableau de correspondance PCN/SCF en annexe)",
    provenanceNote: FROM_MF_DOC,
  },
  {
    slug: "doc-mf-scf-presentation",
    issuer: "finance_ministry",
    kind: "official_page",
    reference: "Ministère des Finances — présentation du SCF",
    title: "Le Système Comptable Financier : pour une véritable convergence vers le référentiel comptable international IAS/IFRS",
    provenanceNote:
      "Document de 2 pages fourni par l'utilisateur (métadonnées PDF : février 2020). Présentation générale ; ne contient pas la nomenclature des comptes. Origine exacte (URL) à confirmer.",
  },
  // ── Facturation (droit commercial) ──
  {
    slug: "de-05-468",
    issuer: "jora",
    kind: "executive_decree",
    reference: "Décret exécutif n° 05-468 du 10 décembre 2005",
    title:
      "Décret fixant les conditions et modalités d'établissement de la facture, du bon de transfert, du bon de livraison et de la facture récapitulative",
    journalReference: "JO n° 80 du 11 décembre 2005",
    url: "https://www.commerce.gov.dz/fr/reglementation/recueil/conditions-et-modalites-d-etablissement-de-la-facture",
    provenanceNote:
      "Référence et JO relevés via des résultats de recherche pointant vers commerce.gov.dz ; le site n'a pas pu être consulté directement. Texte et modifications éventuelles à vérifier.",
  },
  {
    slug: "de-16-66",
    issuer: "jora",
    kind: "executive_decree",
    reference: "Décret exécutif n° 16-66 du 16 février 2016",
    title: "Décret définissant le modèle du document tenant lieu de facture et les catégories d'agents économiques tenus de l'utiliser",
    provenanceNote: "Relevé via des résultats de recherche (commerce.gov.dz) ; texte non consulté.",
  },
  // ── Fiscalité ──
  {
    slug: "dgi-tva",
    issuer: "dgi",
    kind: "official_page",
    reference: "DGI — documentation sur la TVA",
    title: "Taxe sur la valeur ajoutée : taux et opérations exonérées",
    provenanceNote:
      "Signalée par l'utilisateur comme source de référence pour les taux normal et réduit et les exonérations. URL exacte à renseigner ; site mfdgi.gov.dz non accessible depuis l'environnement de développement.",
  },
  // ── Données personnelles ──
  {
    slug: "loi-18-07",
    issuer: "jora",
    kind: "law",
    reference: "Loi n° 18-07 du 10 juin 2018",
    title: "Loi relative à la protection des personnes physiques dans le traitement des données à caractère personnel",
    provenanceNote: "Texte initial ; modifié et complété par la loi n° 25-11. Travailler sur la version consolidée.",
  },
  {
    slug: "loi-25-11",
    issuer: "jora",
    kind: "law",
    reference: "Loi n° 25-11 du 24 juillet 2025",
    title: "Loi modifiant et complétant la loi n° 18-07 relative à la protection des personnes physiques dans le traitement des données à caractère personnel",
    journalReference: "JO n° 48 (juillet 2025)",
    provenanceNote:
      "Signalée par l'utilisateur ; numéro de JO relevé via des sources secondaires (presse, veille juridique). Texte officiel non consulté.",
  },
];

/** Catalogue des impôts et taxes. AUCUN taux, seuil ou condition n'est fourni. */
export const TAXES: NewTax[] = [
  { code: "TVA", name: "Taxe sur la valeur ajoutée", description: "Taux, exonérations et conditions à documenter depuis les sources DGI." },
  { code: "IBS", name: "Impôt sur les bénéfices des sociétés", description: "À documenter." },
  { code: "IRG", name: "Impôt sur le revenu global", description: "À documenter." },
  { code: "TAP", name: "Taxe sur l'activité professionnelle", description: "Applicabilité actuelle à vérifier au regard des lois de finances successives." },
  { code: "IFU", name: "Impôt forfaitaire unique", description: "Régime des petites entreprises : conditions et seuils à documenter." },
];

const DECREE = "de-05-468";
const DECREE_DATE = "2005-12-10";
const CANDIDATE = "Mention candidate issue du cahier des charges MIZANIA ; à confirmer dans le texte officiel et ses modifications.";
const SECONDARY =
  "Mention citée par une source secondaire (legal-doctrine.com) comme exigée par le décret 05-468 ; à confirmer dans le texte officiel.";

/** Mentions de facture CANDIDATES — toutes « à vérifier ». */
export const INVOICE_MENTIONS: NewMention[] = (
  [
  { code: "SELLER_NAME", scope: "seller", label: "Nom ou raison sociale du vendeur", fieldKey: "seller.name", notes: CANDIDATE },
  { code: "SELLER_LEGAL_FORM", scope: "seller", label: "Forme juridique du vendeur", fieldKey: "seller.legalForm", notes: SECONDARY },
  { code: "SELLER_ADDRESS", scope: "seller", label: "Adresse du vendeur", fieldKey: "seller.address", notes: CANDIDATE },
  { code: "SELLER_RC", scope: "seller", label: "Numéro du registre du commerce du vendeur", fieldKey: "seller.rc", condition: "Lorsque le vendeur est immatriculé au registre du commerce.", notes: SECONDARY },
  { code: "SELLER_NIS", scope: "seller", label: "Numéro d'identification statistique (NIS) du vendeur", fieldKey: "seller.nis", notes: SECONDARY },
  { code: "SELLER_NIF", scope: "seller", label: "Numéro d'identification fiscale (NIF) du vendeur", fieldKey: "seller.nif", notes: CANDIDATE },
  { code: "INVOICE_NUMBER", scope: "document", label: "Numéro (d'ordre) de la facture", fieldKey: "invoice.number", notes: CANDIDATE },
  { code: "INVOICE_DATE", scope: "document", label: "Date de la facture", fieldKey: "invoice.issueDate", notes: CANDIDATE },
  { code: "BUYER_IDENTIFICATION", scope: "buyer", label: "Identification de l'acheteur", fieldKey: "buyer.name", notes: `${CANDIDATE} Les identifiants exigés de l'acheteur dépendent de sa qualité : à préciser.` },
  { code: "LINE_DESIGNATION", scope: "line", label: "Désignation des produits ou services", fieldKey: "line.description", notes: CANDIDATE },
  { code: "LINE_QUANTITY", scope: "line", label: "Quantité", fieldKey: "line.quantity", notes: CANDIDATE },
  { code: "LINE_UNIT_PRICE", scope: "line", label: "Prix unitaire hors taxes", fieldKey: "line.unitPrice", notes: CANDIDATE },
  { code: "TOTAL_EXCL_TAX", scope: "document", label: "Montant total hors taxes", fieldKey: "invoice.totalExclTax", notes: CANDIDATE },
  { code: "TAXES_DETAIL", scope: "document", label: "Taxes applicables, avec leurs taux et montants", fieldKey: "invoice.taxes", condition: "Lorsque des taxes s'appliquent à l'opération.", notes: CANDIDATE },
  { code: "TOTAL_INCL_TAX", scope: "document", label: "Montant total toutes taxes comprises", fieldKey: "invoice.totalInclTax", notes: CANDIDATE },
  { code: "TOTAL_IN_WORDS", scope: "document", label: "Montant total TTC en lettres", fieldKey: "invoice.totalInWords", notes: SECONDARY },
  { code: "OPERATION_SPECIFIC", scope: "document", label: "Autres mentions obligatoires selon la nature de l'opération", fieldKey: null, condition: "Selon l'opération (exonération, régime particulier…) : à détailler cas par cas.", notes: CANDIDATE },
  ] satisfies Omit<NewMention, "sourceSlug" | "validFrom">[]
).map((m) => ({ ...m, sourceSlug: DECREE, validFrom: DECREE_DATE, status: "to_verify" as const }));
