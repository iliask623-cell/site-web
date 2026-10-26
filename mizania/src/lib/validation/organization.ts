import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `${max} caractères maximum.`)
    .optional()
    .transform((v) => (v ? v : null));

export const LEGAL_FORMS = {
  personne_physique: "Personne physique (commerçant, profession libérale…)",
  auto_entrepreneur: "Auto-entrepreneur",
  eurl: "EURL",
  sarl: "SARL",
  snc: "SNC",
  spa: "SPA",
  other: "Autre",
} as const;

export const ACTIVITY_TYPES = {
  services: "Prestation de services",
  commerce: "Commerce (achat / revente)",
  production: "Production / artisanat",
  freelance: "Freelance / indépendant",
  other: "Autre",
} as const;

export const MAIN_GOALS = {
  track_finances: "Suivre mes recettes et dépenses",
  invoicing: "Créer et suivre mes factures",
  understand_accounting: "Comprendre ma comptabilité",
  prepare_for_accountant: "Préparer mon dossier pour mon comptable",
  other: "Autre",
} as const;

export const VAT_LIABILITY = {
  unknown: "Je ne sais pas",
  subject: "Oui, je suis assujetti à la TVA",
  not_subject: "Non, je ne suis pas assujetti à la TVA",
} as const;

const keys = <T extends Record<string, string>>(o: T) => Object.keys(o) as [keyof T & string, ...(keyof T & string)[]];

const emptyToUndefined = (v: unknown) => (v === "" ? undefined : v);

export const onboardingSchema = z.object({
  name: z.string({ error: "Nom requis." }).trim().min(2, "Indiquez le nom de votre activité.").max(120),
  activityType: z.enum(keys(ACTIVITY_TYPES), { error: "Choisissez un type d'activité." }),
  legalForm: z.preprocess(emptyToUndefined, z.enum(keys(LEGAL_FORMS)).optional()),
  sector: optionalText(120),
  wilaya: optionalText(60),
  mainGoal: z.preprocess(emptyToUndefined, z.enum(keys(MAIN_GOALS)).optional()),
  vatLiability: z.preprocess((v) => (v === "" || v == null ? "unknown" : v), z.enum(keys(VAT_LIABILITY))),
});

export const organizationProfileSchema = onboardingSchema.extend({
  address: optionalText(200),
  phone: optionalText(30),
  email: z.preprocess(emptyToUndefined, z.email("Email invalide.").max(254).optional()).transform((v) => v ?? null),
  nif: optionalText(30),
  nis: optionalText(30),
  rc: optionalText(30),
  articleImposition: optionalText(30),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type OrganizationProfileInput = z.infer<typeof organizationProfileSchema>;
