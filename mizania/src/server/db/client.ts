import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/server/env";
import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

type Cache = { sql?: postgres.Sql; db?: Database };
// Conserve une seule connexion entre les rechargements à chaud en développement.
const cache = globalThis as unknown as { __mizaniaDb?: Cache };
cache.__mizaniaDb ??= {};

export function getDb(): Database {
  const c = cache.__mizaniaDb!;
  if (!c.db) {
    c.sql = postgres(env().DATABASE_URL, {
      max: env().NODE_ENV === "production" ? 10 : 5,
      // Pas de journalisation des requêtes (elles contiennent des données financières).
      onnotice: () => {},
    });
    c.db = drizzle(c.sql, { schema, casing: undefined });
  }
  return c.db;
}

/** Ferme la connexion (scripts et tests uniquement). */
export async function closeDb(): Promise<void> {
  const c = cache.__mizaniaDb!;
  await c.sql?.end({ timeout: 5 });
  c.sql = undefined;
  c.db = undefined;
}
