import "server-only";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, type Database } from "./client";

export type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];

const uuidSchema = z.uuid();

/**
 * Exécute `fn` dans une transaction où PostgreSQL ne laisse voir et modifier
 * que les lignes de l'organisation `organizationId` (politiques RLS).
 *
 * Le contrôle d'accès applicatif (l'utilisateur est-il membre ?) doit avoir
 * été fait AVANT l'appel : cette fonction est la seconde barrière.
 */
export async function withOrg<T>(organizationId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  const orgId = uuidSchema.parse(organizationId);
  return getDb().transaction(async (tx) => {
    // `true` = local à la transaction : aucune fuite vers une autre requête du pool.
    await tx.execute(sql`select set_config('app.org_id', ${orgId}, true)`);
    return fn(tx);
  });
}

/**
 * Vérifie que le rôle de connexion est soumis à la RLS. Un superutilisateur
 * ou un rôle BYPASSRLS rendrait l'isolation au niveau base inopérante.
 */
export async function assertRoleRespectsRls(db: Database = getDb()): Promise<void> {
  const rows = await db.execute<{ rolsuper: boolean; rolbypassrls: boolean }>(
    sql`select rolsuper, rolbypassrls from pg_roles where rolname = current_user`,
  );
  const role = rows[0];
  if (!role || role.rolsuper || role.rolbypassrls) {
    throw new Error(
      "Le rôle PostgreSQL de l'application contourne la RLS (superuser ou BYPASSRLS). Utilisez un rôle dédié.",
    );
  }
}
