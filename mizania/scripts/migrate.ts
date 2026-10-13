/**
 * Applique les migrations SQL de ./drizzle.
 * Usage : npm run db:migrate            (utilise .env.local)
 *         DOTENV_PATH=.env.test npm run db:migrate
 * En production, DATABASE_URL est lue depuis l'environnement.
 */
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

config({ path: process.env.DOTENV_PATH ?? ".env.local", quiet: true });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL manquante.");
  const client = postgres(url, { max: 1, onnotice: () => {} });
  try {
    await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
    const [role] = await client`select rolsuper, rolbypassrls from pg_roles where rolname = current_user`;
    if (role?.rolsuper || role?.rolbypassrls) {
      console.warn(
        "⚠️  Ce rôle contourne la RLS. L'application doit se connecter avec un rôle sans SUPERUSER ni BYPASSRLS.",
      );
    }
    console.log("Migrations appliquées.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Échec des migrations :", err instanceof Error ? err.message : err);
  process.exit(1);
});
