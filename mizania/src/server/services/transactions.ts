import "server-only";
import { and, asc, count, desc, eq, gte, ilike, isNull, lte, or, sql, type SQL } from "drizzle-orm";
import type { Direction, ListFilters, TransactionInput } from "@/lib/validation/transaction";
import { withOrg, type Tx } from "@/server/db";
import { categories, transactions } from "@/server/db/schema";
import type { OrgContext } from "./organizations";
import { assertCanWrite } from "./permissions";

export const PAGE_SIZE = 20;

/** Trouve la catégorie (insensible à la casse) ou la crée. */
async function resolveCategoryId(tx: Tx, ctx: OrgContext, direction: Direction, name: string | null) {
  if (!name) return null;
  await tx
    .insert(categories)
    .values({ organizationId: ctx.organizationId, direction, name })
    .onConflictDoNothing();
  const [row] = await tx
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.direction, direction), sql`lower(${categories.name}) = lower(${name})`))
    .limit(1);
  return row.id;
}

function toRow(ctx: OrgContext, direction: Direction, input: TransactionInput, categoryId: string | null) {
  return {
    organizationId: ctx.organizationId,
    direction,
    amountCents: input.amount,
    occurredOn: input.occurredOn,
    label: input.label,
    categoryId,
    paymentMethod: input.paymentMethod,
    status: input.status,
    description: input.description,
  };
}

export async function createTransaction(ctx: OrgContext, direction: Direction, input: TransactionInput) {
  assertCanWrite(ctx);
  return withOrg(ctx.organizationId, async (tx) => {
    const categoryId = await resolveCategoryId(tx, ctx, direction, input.categoryName);
    const [row] = await tx
      .insert(transactions)
      .values({ ...toRow(ctx, direction, input, categoryId), createdBy: ctx.userId })
      .returning({ id: transactions.id });
    return row;
  });
}

/** Renvoie null si la ligne n'existe pas pour cette organisation et ce sens. */
export async function updateTransaction(ctx: OrgContext, id: string, direction: Direction, input: TransactionInput) {
  assertCanWrite(ctx);
  return withOrg(ctx.organizationId, async (tx) => {
    const categoryId = await resolveCategoryId(tx, ctx, direction, input.categoryName);
    const [row] = await tx
      .update(transactions)
      .set(toRow(ctx, direction, input, categoryId))
      .where(and(eq(transactions.id, id), eq(transactions.direction, direction)))
      .returning({ id: transactions.id });
    return row ?? null;
  });
}

export async function deleteTransaction(ctx: OrgContext, id: string, direction: Direction) {
  assertCanWrite(ctx);
  return withOrg(ctx.organizationId, async (tx) => {
    const rows = await tx
      .delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.direction, direction)))
      .returning({ id: transactions.id });
    return rows.length > 0;
  });
}

export async function getTransaction(ctx: OrgContext, id: string, direction: Direction) {
  return withOrg(ctx.organizationId, async (tx) => {
    const [row] = await tx
      .select({ transaction: transactions, categoryName: categories.name })
      .from(transactions)
      .leftJoin(categories, eq(categories.id, transactions.categoryId))
      .where(and(eq(transactions.id, id), eq(transactions.direction, direction)))
      .limit(1);
    return row ?? null;
  });
}

export async function listCategories(ctx: OrgContext, direction: Direction) {
  return withOrg(ctx.organizationId, (tx) =>
    tx
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .where(and(eq(categories.direction, direction), isNull(categories.archivedAt)))
      .orderBy(asc(categories.name)),
  );
}

function escapeLike(s: string) {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export async function listTransactions(ctx: OrgContext, direction: Direction, f: ListFilters) {
  const where: SQL[] = [eq(transactions.direction, direction)];
  if (f.q) {
    const p = `%${escapeLike(f.q)}%`;
    where.push(or(ilike(transactions.label, p), ilike(transactions.description, p))!);
  }
  if (f.status) where.push(eq(transactions.status, f.status));
  if (f.category) where.push(eq(transactions.categoryId, f.category));
  if (f.from) where.push(gte(transactions.occurredOn, f.from));
  if (f.to) where.push(lte(transactions.occurredOn, f.to));
  const condition = and(...where);

  const order = {
    date_desc: [desc(transactions.occurredOn), desc(transactions.createdAt)],
    date_asc: [asc(transactions.occurredOn), asc(transactions.createdAt)],
    amount_desc: [desc(transactions.amountCents), desc(transactions.occurredOn)],
    amount_asc: [asc(transactions.amountCents), desc(transactions.occurredOn)],
  }[f.sort];

  return withOrg(ctx.organizationId, async (tx) => {
    const [totals] = await tx
      .select({
        total: count(),
        // Les opérations annulées ne comptent pas dans le total affiché.
        sumCents: sql<number>`coalesce(sum(${transactions.amountCents}) filter (where ${transactions.status} <> 'cancelled'), 0)`.mapWith(Number),
      })
      .from(transactions)
      .where(condition);
    const pageCount = Math.max(1, Math.ceil(totals.total / PAGE_SIZE));
    const page = Math.min(f.page, pageCount);
    const rows = await tx
      .select({
        id: transactions.id,
        amountCents: transactions.amountCents,
        occurredOn: transactions.occurredOn,
        label: transactions.label,
        status: transactions.status,
        paymentMethod: transactions.paymentMethod,
        categoryName: categories.name,
      })
      .from(transactions)
      .leftJoin(categories, eq(categories.id, transactions.categoryId))
      .where(condition)
      .orderBy(...order)
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE);
    return { rows, total: totals.total, sumCents: totals.sumCents, page, pageCount };
  });
}

