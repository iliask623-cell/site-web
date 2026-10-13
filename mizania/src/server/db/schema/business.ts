import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  date,
  foreignKey,
  index,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { organizations, timestamps, users } from "./identity";

/**
 * Politique RLS commune : une ligne n'est visible / modifiable que si son
 * organisation correspond au contexte de la transaction (`app.org_id`),
 * positionné par `withOrg()`. Sans contexte, aucune ligne n'est visible.
 */
const orgIsolation = (table: string) =>
  pgPolicy(`${table}_org_isolation`, {
    as: "permissive",
    for: "all",
    using: sql`organization_id = nullif(current_setting('app.org_id', true), '')::uuid`,
    withCheck: sql`organization_id = nullif(current_setting('app.org_id', true), '')::uuid`,
  });

const orgColumn = () =>
  uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" });

// ───────────────────────── Clients & fournisseurs ─────────────────────────

export const contactKindEnum = pgEnum("contact_kind", ["client", "supplier"]);
export const contactTypeEnum = pgEnum("contact_type", ["individual", "company"]);

export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: orgColumn(),
    kind: contactKindEnum("kind").notNull(),
    contactType: contactTypeEnum("contact_type").notNull().default("company"),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
    wilaya: text("wilaya"),
    nif: text("nif"),
    nis: text("nis"),
    rc: text("rc"),
    articleImposition: text("article_imposition"),
    notes: text("notes"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    unique("contacts_org_id_key").on(t.organizationId, t.id),
    index("contacts_org_kind_name_idx").on(t.organizationId, t.kind, t.name),
    check("contacts_name_not_blank", sql`btrim(${t.name}) <> ''`),
    orgIsolation("contacts"),
  ],
).enableRLS();

// ───────────────────────── Catégories ─────────────────────────

export const directionEnum = pgEnum("direction", ["income", "expense"]);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: orgColumn(),
    direction: directionEnum("direction").notNull(),
    name: text("name").notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    unique("categories_org_id_key").on(t.organizationId, t.id),
    uniqueIndex("categories_org_direction_name_key").on(t.organizationId, t.direction, sql`lower(${t.name})`),
    check("categories_name_not_blank", sql`btrim(${t.name}) <> ''`),
    orgIsolation("categories"),
  ],
).enableRLS();

// ───────────────────────── Recettes & dépenses ─────────────────────────

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "bank_transfer",
  "cheque",
  "card",
  "ccp",
  "baridimob",
  "other",
]);

/** settled = encaissée / payée ; pending = à encaisser / à payer. */
export const transactionStatusEnum = pgEnum("transaction_status", ["settled", "pending", "cancelled"]);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: orgColumn(),
    direction: directionEnum("direction").notNull(),
    /** Centimes de DA, strictement positif. Le sens est donné par `direction`. */
    amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
    occurredOn: date("occurred_on", { mode: "string" }).notNull(),
    contactId: uuid("contact_id"),
    categoryId: uuid("category_id"),
    paymentMethod: paymentMethodEnum("payment_method"),
    status: transactionStatusEnum("status").notNull().default("settled"),
    label: text("label").notNull(),
    description: text("description"),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [
    check("transactions_amount_positive", sql`${t.amountCents} > 0`),
    check("transactions_label_not_blank", sql`btrim(${t.label}) <> ''`),
    // Clés étrangères composites : un contact / une catégorie d'une AUTRE
    // organisation ne peut pas être référencé, même par erreur.
    foreignKey({
      name: "transactions_contact_fk",
      columns: [t.organizationId, t.contactId],
      foreignColumns: [contacts.organizationId, contacts.id],
    }),
    foreignKey({
      name: "transactions_category_fk",
      columns: [t.organizationId, t.categoryId],
      foreignColumns: [categories.organizationId, categories.id],
    }),
    index("transactions_org_date_idx").on(t.organizationId, t.occurredOn),
    index("transactions_org_direction_date_idx").on(t.organizationId, t.direction, t.occurredOn),
    index("transactions_contact_idx").on(t.organizationId, t.contactId),
    orgIsolation("transactions"),
  ],
).enableRLS();
