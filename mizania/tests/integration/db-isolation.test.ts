import { eq, sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { assertRoleRespectsRls, closeDb, getDb, withOrg } from "@/server/db";
import { contacts, organizations, transactions, users } from "@/server/db/schema";
import { createUserWithOrg, resetDatabase } from "../support/db";

afterAll(closeDb);

describe("configuration de la base", () => {
  it("le rôle applicatif est soumis à la RLS", async () => {
    await expect(assertRoleRespectsRls()).resolves.toBeUndefined();
  });

  it("toute table portant organization_id a la RLS activée ET forcée", async () => {
    const rows = await getDb().execute<{ table_name: string; enabled: boolean; forced: boolean }>(sql`
      select c.table_name, cl.relrowsecurity as enabled, cl.relforcerowsecurity as forced
      from information_schema.columns c
      join pg_class cl on cl.relname = c.table_name and cl.relkind = 'r'
      join pg_namespace n on n.oid = cl.relnamespace and n.nspname = c.table_schema
      where c.table_schema = 'public' and c.column_name = 'organization_id'
        and c.table_name <> 'memberships'
    `);
    expect(rows.length).toBeGreaterThanOrEqual(3);
    for (const r of rows) {
      expect({ table: r.table_name, enabled: r.enabled, forced: r.forced }).toEqual({
        table: r.table_name,
        enabled: true,
        forced: true,
      });
    }
  });
});

describe("isolation des données par organisation (RLS)", () => {
  let a: Awaited<ReturnType<typeof createUserWithOrg>>;
  let b: Awaited<ReturnType<typeof createUserWithOrg>>;
  let contactB: { id: string };

  beforeEach(async () => {
    await resetDatabase();
    a = await createUserWithOrg("Alpha");
    b = await createUserWithOrg("Beta");
    await withOrg(a.org.id, (tx) =>
      tx.insert(transactions).values({
        organizationId: a.org.id,
        direction: "income",
        amountCents: 85_000_000,
        occurredOn: "2026-01-15",
        label: "Prestation A",
      }),
    );
    [contactB] = await withOrg(b.org.id, async (tx) => {
      await tx.insert(transactions).values({
        organizationId: b.org.id,
        direction: "expense",
        amountCents: 12_000_000,
        occurredOn: "2026-01-20",
        label: "Achat B",
      });
      return tx.insert(contacts).values({ organizationId: b.org.id, kind: "client", name: "Client de B" }).returning();
    });
  });

  it("sans contexte d'organisation, aucune donnée métier n'est visible", async () => {
    expect(await getDb().select().from(transactions)).toHaveLength(0);
    expect(await getDb().select().from(contacts)).toHaveLength(0);
  });

  it("sans contexte, l'insertion est refusée", async () => {
    await expect(
      getDb().insert(transactions).values({
        organizationId: a.org.id,
        direction: "income",
        amountCents: 100,
        occurredOn: "2026-01-01",
        label: "x",
      }),
    ).rejects.toThrow();
  });

  it("une organisation ne voit que ses lignes, même sans filtre WHERE", async () => {
    const rowsA = await withOrg(a.org.id, (tx) => tx.select().from(transactions));
    expect(rowsA.map((r) => r.label)).toEqual(["Prestation A"]);
    const rowsB = await withOrg(b.org.id, (tx) => tx.select().from(transactions));
    expect(rowsB.map((r) => r.label)).toEqual(["Achat B"]);
  });

  it("une organisation ne peut pas écrire au nom d'une autre", async () => {
    await expect(
      withOrg(a.org.id, (tx) =>
        tx.insert(transactions).values({
          organizationId: b.org.id,
          direction: "income",
          amountCents: 100,
          occurredOn: "2026-01-01",
          label: "Intrusion",
        }),
      ),
    ).rejects.toThrow();
  });

  it("une organisation ne peut ni modifier ni supprimer les lignes d'une autre", async () => {
    const updated = await withOrg(a.org.id, (tx) =>
      tx.update(transactions).set({ label: "Piraté" }).where(eq(transactions.organizationId, b.org.id)).returning(),
    );
    expect(updated).toHaveLength(0);
    const deleted = await withOrg(a.org.id, (tx) =>
      tx.delete(contacts).where(eq(contacts.id, contactB.id)).returning(),
    );
    expect(deleted).toHaveLength(0);
    const stillThere = await withOrg(b.org.id, (tx) => tx.select().from(transactions));
    expect(stillThere[0].label).toBe("Achat B");
  });

  it("une transaction ne peut pas référencer le contact d'une autre organisation", async () => {
    await expect(
      withOrg(a.org.id, (tx) =>
        tx.insert(transactions).values({
          organizationId: a.org.id,
          direction: "income",
          amountCents: 100,
          occurredOn: "2026-01-01",
          label: "Lien croisé",
          contactId: contactB.id,
        }),
      ),
    ).rejects.toThrow();
  });

  it("le contexte ne fuit pas hors de la transaction", async () => {
    await withOrg(a.org.id, (tx) => tx.select().from(transactions));
    expect(await getDb().select().from(transactions)).toHaveLength(0);
  });

  it("withOrg refuse un identifiant d'organisation mal formé", async () => {
    await expect(withOrg("' or 1=1 --", async () => 1)).rejects.toThrow();
  });

  it("supprimer une organisation supprime ses données (et seulement les siennes)", async () => {
    await getDb().delete(organizations).where(eq(organizations.id, b.org.id));
    expect(await withOrg(b.org.id, (tx) => tx.select().from(transactions))).toHaveLength(0);
    expect(await withOrg(a.org.id, (tx) => tx.select().from(transactions))).toHaveLength(1);
  });
});

describe("contraintes d'intégrité", () => {
  beforeEach(resetDatabase);

  it("refuse un montant nul ou négatif", async () => {
    const { org } = await createUserWithOrg();
    for (const amountCents of [0, -100]) {
      await expect(
        withOrg(org.id, (tx) =>
          tx.insert(transactions).values({
            organizationId: org.id,
            direction: "expense",
            amountCents,
            occurredOn: "2026-01-01",
            label: "x",
          }),
        ),
      ).rejects.toThrow();
    }
  });

  it("conserve les grands montants exactement (bigint)", async () => {
    const { org } = await createUserWithOrg();
    const big = 9_999_999_999_999; // ~ 100 milliards de DA en centimes
    const [row] = await withOrg(org.id, (tx) =>
      tx
        .insert(transactions)
        .values({ organizationId: org.id, direction: "income", amountCents: big, occurredOn: "2026-01-01", label: "x" })
        .returning(),
    );
    expect(row.amountCents).toBe(big);
  });

  it("refuse un email non normalisé et les doublons d'email", async () => {
    const db = getDb();
    await expect(
      db.insert(users).values({ email: "Ali@Example.test", passwordHash: "x", fullName: "Ali" }),
    ).rejects.toThrow();
    await db.insert(users).values({ email: "ali@example.test", passwordHash: "x", fullName: "Ali" });
    await expect(
      db.insert(users).values({ email: "ali@example.test", passwordHash: "x", fullName: "Ali 2" }),
    ).rejects.toThrow();
  });
});
