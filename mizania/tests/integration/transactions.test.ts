import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { listFiltersSchema, transactionSchema } from "@/lib/validation/transaction";
import { closeDb } from "@/server/db";
import { getDashboard } from "@/server/services/dashboard";
import { createOrganizationForUser, DEFAULT_CATEGORIES, type OrgContext } from "@/server/services/organizations";
import { createTransaction, deleteTransaction, getTransaction, listCategories, listTransactions, updateTransaction } from "@/server/services/transactions";
import { getDb } from "@/server/db";
import { users } from "@/server/db/schema";
import { resetDatabase } from "../support/db";

afterAll(closeDb);

async function newOrg(name: string): Promise<OrgContext> {
  const [u] = await getDb().insert(users).values({ email: `${name.toLowerCase()}@example.test`, passwordHash: "x", fullName: name }).returning();
  const org = await createOrganizationForUser(u.id, { name, activityType: "services", vatLiability: "unknown", legalForm: undefined, sector: null, wilaya: null, mainGoal: undefined });
  return { userId: u.id, organizationId: org.id, role: "owner" };
}

const input = (o: Record<string, string> = {}) =>
  transactionSchema.parse({ amount: "120 000", occurredOn: "2026-03-10", label: "Prestation", status: "settled", ...o });

const filters = (o: Record<string, unknown> = {}) => listFiltersSchema.parse(o);

describe("validation d'une recette / dépense", () => {
  it("convertit le montant en centimes", () => {
    expect(input({ amount: "1 500,50" }).amount).toBe(150_050);
  });
  it("refuse montant nul, invalide, date impossible, libellé vide", () => {
    const base = { amount: "100", occurredOn: "2026-03-10", label: "x", status: "settled" };
    for (const bad of [{ amount: "0" }, { amount: "abc" }, { amount: "-5" }, { occurredOn: "2026-02-30" }, { label: "  " }, { status: "x" }]) {
      expect(transactionSchema.safeParse({ ...base, ...bad }).success).toBe(false);
    }
  });
  it("filtres invalides → valeurs par défaut (pas d'erreur)", () => {
    expect(listFiltersSchema.parse({ page: "-3", sort: "hack", status: "x", category: "1 or 1=1" })).toMatchObject({ page: 1, sort: "date_desc", status: undefined, category: undefined });
  });
});

describe("recettes et dépenses", () => {
  let a: OrgContext;
  let b: OrgContext;
  beforeEach(async () => {
    await resetDatabase();
    a = await newOrg("Alpha");
    b = await newOrg("Beta");
  });

  it("l'onboarding crée les catégories par défaut", async () => {
    expect((await listCategories(a, "expense")).length).toBe(DEFAULT_CATEGORIES.expense.length);
  });

  it("crée, lit, modifie et supprime", async () => {
    const { id } = await createTransaction(a, "income", input({ categoryName: "Prestations de services" }));
    const got = await getTransaction(a, id, "income");
    expect(got?.transaction.amountCents).toBe(12_000_000);
    expect(got?.categoryName).toBe("Prestations de services");
    expect(await updateTransaction(a, id, "income", input({ amount: "130 000", status: "pending" }))).toEqual({ id });
    expect((await getTransaction(a, id, "income"))?.transaction).toMatchObject({ amountCents: 13_000_000, status: "pending", categoryId: null });
    expect(await deleteTransaction(a, id, "income")).toBe(true);
    expect(await getTransaction(a, id, "income")).toBeNull();
  });

  it("réutilise une catégorie existante sans tenir compte de la casse, ou en crée une", async () => {
    const before = (await listCategories(a, "expense")).length;
    await createTransaction(a, "expense", input({ categoryName: "loyer" }));
    await createTransaction(a, "expense", input({ categoryName: "Abonnement logiciel" }));
    expect((await listCategories(a, "expense")).length).toBe(before + 1);
  });

  it("une recette n'est pas accessible comme dépense", async () => {
    const { id } = await createTransaction(a, "income", input());
    expect(await getTransaction(a, id, "expense")).toBeNull();
    expect(await deleteTransaction(a, id, "expense")).toBe(false);
  });

  it("une organisation ne peut ni lire, ni modifier, ni supprimer les opérations d'une autre", async () => {
    const { id } = await createTransaction(a, "income", input());
    expect(await getTransaction(b, id, "income")).toBeNull();
    expect(await updateTransaction(b, id, "income", input({ amount: "1" }))).toBeNull();
    expect(await deleteTransaction(b, id, "income")).toBe(false);
    expect((await listTransactions(b, "income", filters())).total).toBe(0);
    expect((await getTransaction(a, id, "income"))?.transaction.amountCents).toBe(12_000_000);
  });

  it("un rôle en lecture seule ne peut pas écrire", async () => {
    await expect(createTransaction({ ...a, role: "accountant" }, "income", input())).rejects.toThrow(/non autorisée/);
  });

  it("recherche, filtre, trie et pagine ; le total exclut les annulées", async () => {
    for (let i = 1; i <= 25; i++) {
      await createTransaction(a, "income", input({ amount: String(i * 1000), occurredOn: `2026-01-${String(i).padStart(2, "0")}`, label: i === 7 ? "Mission spéciale 50%" : `Vente ${i}` }));
    }
    await createTransaction(a, "income", input({ amount: "999999", label: "Annulée", status: "cancelled" }));

    const p1 = await listTransactions(a, "income", filters());
    expect(p1).toMatchObject({ total: 26, pageCount: 2, page: 1 });
    expect(p1.rows).toHaveLength(20);
    expect(p1.sumCents).toBe(((25 * 26) / 2) * 1000 * 100);
    expect((await listTransactions(a, "income", filters({ page: "2" }))).rows).toHaveLength(6);
    expect((await listTransactions(a, "income", filters({ page: "99" }))).page).toBe(2);

    expect((await listTransactions(a, "income", filters({ q: "spéciale" }))).rows.map((r) => r.label)).toEqual(["Mission spéciale 50%"]);
    expect((await listTransactions(a, "income", filters({ q: "%" }))).total).toBe(1); // % traité littéralement
    expect((await listTransactions(a, "income", filters({ status: "cancelled" }))).total).toBe(1);
    expect((await listTransactions(a, "income", filters({ from: "2026-01-10", to: "2026-01-12" }))).total).toBe(3);
    const sorted = await listTransactions(a, "income", filters({ sort: "amount_asc" }));
    expect(sorted.rows[0].amountCents).toBe(100_000);
  });
});

describe("tableau de bord", () => {
  let a: OrgContext;
  beforeEach(async () => {
    await resetDatabase();
    a = await newOrg("Alpha");
  });

  it("organisation vide → aucune donnée, tous les totaux à zéro", async () => {
    const d = await getDashboard(a, "2026-03-15", 1);
    expect(d.hasData).toBe(false);
    expect(d.month).toEqual({ income: 0, expense: 0, net: 0 });
    expect(d.series).toHaveLength(6);
  });

  it("calcule les totaux exacts à partir des opérations enregistrées", async () => {
    const add = (direction: "income" | "expense", amount: string, occurredOn: string, status = "settled", categoryName?: string) =>
      createTransaction(a, direction, input({ amount, occurredOn, status, ...(categoryName ? { categoryName } : {}) }));
    await add("income", "850 000", "2026-03-02");
    await add("income", "150 000", "2026-03-20", "pending");
    await add("income", "500 000", "2026-03-21", "cancelled");
    await add("expense", "120 000", "2026-03-05", "settled", "Loyer");
    await add("expense", "30 000,50", "2026-03-06", "pending", "Électricité, eau, gaz");
    await add("income", "200 000", "2026-01-10");
    await add("expense", "50 000", "2025-12-15"); // exercice précédent
    await add("income", "75 000", "2026-03-30"); // futur par rapport au 15/03 : compté dans le mois, pas dans l'encaissé

    const d = await getDashboard(a, "2026-03-15", 1);
    expect(d.hasData).toBe(true);
    expect(d.month).toEqual({ income: 107_500_000, expense: 15_000_050, net: 92_499_950 });
    expect(d.year).toEqual({ income: 127_500_000, expense: 15_000_050, net: 112_499_950 });
    expect(d.pending).toEqual({ income: 15_000_000, expense: 3_000_050 });
    // Encaissé à ce jour : 850 000 + 200 000 ; payé : 120 000 + 50 000
    expect(d.settledNet).toBe(88_000_000);
    expect(d.series.map((s) => s.month)).toEqual(["2025-10-01", "2025-11-01", "2025-12-01", "2026-01-01", "2026-02-01", "2026-03-01"]);
    expect(d.series[2]).toEqual({ month: "2025-12-01", income: 0, expense: 5_000_000 });
    expect(d.series[5]).toEqual({ month: "2026-03-01", income: 107_500_000, expense: 15_000_050 });
    expect(d.topExpenseCategories[0]).toEqual({ name: "Loyer", total: 12_000_000 });
    expect(d.recent[0].label).toBe("Prestation");
  });

  it("respecte le mois de début d'exercice", async () => {
    await createTransaction(a, "income", input({ amount: "100", occurredOn: "2025-08-01" }));
    expect((await getDashboard(a, "2026-03-15", 7)).year.income).toBe(10_000);
    expect((await getDashboard(a, "2026-03-15", 1)).year.income).toBe(0);
  });
});
