import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: process.env.DOTENV_PATH ?? ".env.local", quiet: true });

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  strict: true,
});
