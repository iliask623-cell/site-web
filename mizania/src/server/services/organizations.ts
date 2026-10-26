import "server-only";
import { and, asc, eq } from "drizzle-orm";
import type { OnboardingInput, OrganizationProfileInput } from "@/lib/validation/organization";
import { getDb, withOrg } from "@/server/db";
import { categories, memberships, organizations } from "@/server/db/schema";

export type MembershipRole = (typeof memberships.$inferSelect)["role"];

export type OrgContext = {
  userId: string;
  organizationId: string;
  role: MembershipRole;
};

/**
 * Catégories proposées par défaut (simples libellés de gestion, modifiables).
 * Ce ne sont PAS des comptes SCF.
 */
export const DEFAULT_CATEGORIES = {
  income: ["Ventes de marchandises", "Prestations de services", "Autres recettes"],
  expense: [
    "Achats de marchandises",
    "Fournitures et petit matériel",
    "Loyer",
    "Électricité, eau, gaz",
    "Téléphone et internet",
    "Transport et déplacements",
    "Salaires et rémunérations",
    "Frais bancaires",
    "Publicité",
    "Autres dépenses",
  ],
} as const;

export async function createOrganizationForUser(userId: string, input: OnboardingInput) {
  const db = getDb();
  const org = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(organizations)
      .values({ ...input, onboardingCompletedAt: new Date() })
      .returning();
    await tx.insert(memberships).values({ organizationId: created.id, userId, role: "owner" });
    return created;
  });
  await withOrg(org.id, (tx) =>
    tx.insert(categories).values([
      ...DEFAULT_CATEGORIES.income.map((name) => ({ organizationId: org.id, direction: "income" as const, name })),
      ...DEFAULT_CATEGORIES.expense.map((name) => ({ organizationId: org.id, direction: "expense" as const, name })),
    ]),
  );
  return org;
}

/** Organisations dont l'utilisateur est membre (la plus ancienne en premier). */
export async function listMemberships(userId: string) {
  return getDb()
    .select({ organizationId: memberships.organizationId, role: memberships.role, name: organizations.name, isDemo: organizations.isDemo })
    .from(memberships)
    .innerJoin(organizations, eq(organizations.id, memberships.organizationId))
    .where(eq(memberships.userId, userId))
    .orderBy(asc(memberships.createdAt));
}

/** Contrôle d'accès applicatif : null si l'utilisateur n'est pas membre. */
export async function getMembership(userId: string, organizationId: string) {
  const [row] = await getDb()
    .select({ role: memberships.role, organization: organizations })
    .from(memberships)
    .innerJoin(organizations, eq(organizations.id, memberships.organizationId))
    .where(and(eq(memberships.userId, userId), eq(memberships.organizationId, organizationId)))
    .limit(1);
  return row ?? null;
}

export function canManageOrganization(role: MembershipRole) {
  return role === "owner";
}

export async function updateOrganizationProfile(ctx: OrgContext, input: OrganizationProfileInput) {
  if (!canManageOrganization(ctx.role)) throw new Error("FORBIDDEN");
  await getDb().update(organizations).set(input).where(eq(organizations.id, ctx.organizationId));
}
