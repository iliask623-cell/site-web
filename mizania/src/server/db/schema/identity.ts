import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  check,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const localeEnum = pgEnum("locale", ["fr", "ar"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Toujours normalisé (trim + minuscules) avant écriture. */
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    fullName: text("full_name").notNull(),
    locale: localeEnum("locale").notNull().default("fr"),
    isPlatformAdmin: boolean("is_platform_admin").notNull().default(false),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("users_email_key").on(t.email),
    check("users_email_normalized", sql`${t.email} = lower(btrim(${t.email}))`),
  ],
);

export const legalFormEnum = pgEnum("legal_form", [
  "personne_physique",
  "auto_entrepreneur",
  "eurl",
  "sarl",
  "snc",
  "spa",
  "other",
]);

export const activityTypeEnum = pgEnum("activity_type", [
  "services",
  "commerce",
  "production",
  "freelance",
  "other",
]);

export const mainGoalEnum = pgEnum("main_goal", [
  "track_finances",
  "invoicing",
  "understand_accounting",
  "prepare_for_accountant",
  "other",
]);

/**
 * Assujettissement à la TVA tel que DÉCLARÉ par l'entreprise. Tant qu'il est
 * `unknown`, aucune règle de TVA n'est appliquée automatiquement.
 */
export const vatLiabilityEnum = pgEnum("vat_liability", ["unknown", "subject", "not_subject"]);

/**
 * L'« activité » de l'entrepreneur. Toutes les données métier lui sont
 * rattachées ; plusieurs utilisateurs pourront y accéder via `memberships`.
 */
export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    legalForm: legalFormEnum("legal_form"),
    activityType: activityTypeEnum("activity_type"),
    sector: text("sector"),
    /** Texte libre : le découpage administratif peut évoluer. */
    wilaya: text("wilaya"),
    address: text("address"),
    phone: text("phone"),
    email: text("email"),
    // Identifiants administratifs facultatifs (saisis par l'utilisateur, non vérifiés).
    nif: text("nif"),
    nis: text("nis"),
    rc: text("rc"),
    articleImposition: text("article_imposition"),
    vatLiability: vatLiabilityEnum("vat_liability").notNull().default("unknown"),
    /** Régime fiscal déclaré (codes gérés par l'administration). NULL = inconnu. */
    taxRegimeCode: text("tax_regime_code"),
    fiscalYearStartMonth: smallint("fiscal_year_start_month").notNull().default(1),
    /** Données de démonstration : jamais mélangées aux données réelles. */
    /** Objectif principal déclaré à l'onboarding (sert à personnaliser l'accueil). */
    mainGoal: mainGoalEnum("main_goal"),
    isDemo: boolean("is_demo").notNull().default(false),
    onboardingCompletedAt: timestamp("onboarding_completed_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [check("organizations_fy_month", sql`${t.fiscalYearStartMonth} between 1 and 12`)],
);

export const membershipRoleEnum = pgEnum("membership_role", ["owner", "member", "accountant"]);

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: membershipRoleEnum("role").notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("memberships_org_user_key").on(t.organizationId, t.userId),
    index("memberships_user_idx").on(t.userId),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** SHA-256 (hex) du token du cookie. Le token brut n'est jamais stocké. */
    tokenHash: text("token_hash").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    activeOrganizationId: uuid("active_organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("sessions_token_hash_key").on(t.tokenHash), index("sessions_user_idx").on(t.userId)],
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tokenHash: text("token_hash").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("password_reset_tokens_hash_key").on(t.tokenHash)],
);

/** Compteurs à fenêtre fixe (connexion, inscription, reset, IA). */
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  count: integer("count").notNull(),
});

export { timestamps };

export const emailVerificationTokens = pgTable(
  "email_verification_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tokenHash: text("token_hash").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("email_verification_tokens_hash_key").on(t.tokenHash)],
);
