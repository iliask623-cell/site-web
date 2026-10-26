import "server-only";
import { and, desc, eq, gte, lt, ne, sql } from "drizzle-orm";
import { addMonths, startOfFiscalYear, startOfMonth } from "@/lib/dates";
import { withOrg } from "@/server/db";
import { categories, transactions } from "@/server/db/schema";
import type { OrgContext } from "./organizations";

const cents = (expr: ReturnType<typeof sql>) => sql<number>`coalesce(${expr}, 0)`.mapWith(Number);

/** Totaux d'une période [from, to[ (opérations annulées exclues). */
function periodTotals(from: string, to: string) {
  const inPeriod = sql`${transactions.occurredOn} >= ${from} and ${transactions.occurredOn} < ${to} and ${transactions.status} <> 'cancelled'`;
  return {
    income: cents(sql`sum(${transactions.amountCents}) filter (where ${transactions.direction} = 'income' and ${inPeriod})`),
    expense: cents(sql`sum(${transactions.amountCents}) filter (where ${transactions.direction} = 'expense' and ${inPeriod})`),
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboard>>;

/**
 * Indicateurs du tableau de bord, calculés exclusivement à partir des
 * opérations enregistrées (aucune estimation, aucune donnée inventée).
 */
export async function getDashboard(ctx: OrgContext, today: string, fiscalYearStartMonth: number) {
  const monthStart = startOfMonth(today);
  const nextMonth = addMonths(monthStart, 1);
  const fyStart = startOfFiscalYear(today, fiscalYearStartMonth);
  const seriesStart = addMonths(monthStart, -5);

  // Filtre explicite en plus de la RLS (défense en profondeur).
  const own = eq(transactions.organizationId, ctx.organizationId);
  return withOrg(ctx.organizationId, async (tx) => {
    const month = periodTotals(monthStart, nextMonth);
    const year = periodTotals(fyStart, nextMonth);
    const [totals] = await tx
      .select({
        count: sql<number>`count(*)`.mapWith(Number),
        monthIncome: month.income,
        monthExpense: month.expense,
        yearIncome: year.income,
        yearExpense: year.expense,
        pendingIncome: cents(sql`sum(${transactions.amountCents}) filter (where ${transactions.direction} = 'income' and ${transactions.status} = 'pending')`),
        pendingExpense: cents(sql`sum(${transactions.amountCents}) filter (where ${transactions.direction} = 'expense' and ${transactions.status} = 'pending')`),
        settledIn: cents(sql`sum(${transactions.amountCents}) filter (where ${transactions.direction} = 'income' and ${transactions.status} = 'settled' and ${transactions.occurredOn} <= ${today})`),
        settledOut: cents(sql`sum(${transactions.amountCents}) filter (where ${transactions.direction} = 'expense' and ${transactions.status} = 'settled' and ${transactions.occurredOn} <= ${today})`),
      })
      .from(transactions)
      .where(own);

    const monthly = await tx
      .select({
        month: sql<string>`to_char(date_trunc('month', ${transactions.occurredOn}), 'YYYY-MM-01')`,
        income: cents(sql`sum(${transactions.amountCents}) filter (where ${transactions.direction} = 'income')`),
        expense: cents(sql`sum(${transactions.amountCents}) filter (where ${transactions.direction} = 'expense')`),
      })
      .from(transactions)
      .where(and(own, gte(transactions.occurredOn, seriesStart), lt(transactions.occurredOn, nextMonth), ne(transactions.status, "cancelled")))
      .groupBy(sql`1`);
    const byMonth = new Map(monthly.map((m) => [m.month, m]));
    const series = Array.from({ length: 6 }, (_, i) => {
      const m = addMonths(seriesStart, i);
      return { month: m, income: byMonth.get(m)?.income ?? 0, expense: byMonth.get(m)?.expense ?? 0 };
    });

    const recent = await tx
      .select({
        id: transactions.id,
        direction: transactions.direction,
        amountCents: transactions.amountCents,
        occurredOn: transactions.occurredOn,
        label: transactions.label,
        status: transactions.status,
        categoryName: categories.name,
      })
      .from(transactions)
      .leftJoin(categories, eq(categories.id, transactions.categoryId))
      .where(own)
      .orderBy(desc(transactions.occurredOn), desc(transactions.createdAt))
      .limit(6);

    const topExpenseCategories = await tx
      .select({
        name: sql<string>`coalesce(${categories.name}, 'Sans catégorie')`,
        total: cents(sql`sum(${transactions.amountCents})`),
      })
      .from(transactions)
      .leftJoin(categories, eq(categories.id, transactions.categoryId))
      .where(and(own, eq(transactions.direction, "expense"), ne(transactions.status, "cancelled"), gte(transactions.occurredOn, fyStart), lt(transactions.occurredOn, nextMonth)))
      .groupBy(sql`1`)
      .orderBy(sql`2 desc`)
      .limit(5);

    return {
      hasData: totals.count > 0,
      period: { monthStart, fyStart, today },
      month: { income: totals.monthIncome, expense: totals.monthExpense, net: totals.monthIncome - totals.monthExpense },
      year: { income: totals.yearIncome, expense: totals.yearExpense, net: totals.yearIncome - totals.yearExpense },
      pending: { income: totals.pendingIncome, expense: totals.pendingExpense },
      /** Encaissé − payé à ce jour (hors solde de départ, non saisi). */
      settledNet: totals.settledIn - totals.settledOut,
      series,
      recent,
      topExpenseCategories,
    };
  });
}
