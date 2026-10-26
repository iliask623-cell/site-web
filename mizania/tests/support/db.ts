import { sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import { memberships, organizations, users } from "@/server/db/schema";

/** Vide toutes les tables applicatives de la base de test. */
export async function resetDatabase(): Promise<void> {
  if (!process.env.DATABASE_URL?.includes("_test")) {
    throw new Error("Refus de vider une base qui n'est pas une base de test.");
  }
  // Toutes les tables du schéma public (sauf le journal des migrations).
  const tables = await getDb().execute<{ tablename: string }>(
    sql`select tablename from pg_tables where schemaname = 'public'`,
  );
  const list = tables.map((t) => `"${t.tablename}"`).join(", ");
  if (list) await getDb().execute(sql.raw(`truncate table ${list} restart identity cascade`));
}

let counter = 0;

export async function createUserWithOrg(name = "Test") {
  counter += 1;
  const db = getDb();
  const [user] = await db
    .insert(users)
    .values({ email: `user${counter}-${Date.now()}@example.test`, passwordHash: "x", fullName: name })
    .returning();
  const [org] = await db.insert(organizations).values({ name: `${name} SARL` }).returning();
  await db.insert(memberships).values({ organizationId: org.id, userId: user.id, role: "owner" });
  return { user, org };
}
