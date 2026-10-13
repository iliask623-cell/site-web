import "server-only";
import { z } from "zod";

/**
 * Configuration serveur validée au démarrage. Aucune de ces valeurs ne doit
 * être exposée au navigateur (pas de préfixe NEXT_PUBLIC_).
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  APP_URL: z.url().default("http://localhost:3000"),
  /** Fournisseur IA : vide = assistant désactivé (affiché comme tel). */
  AI_PROVIDER: z.enum(["anthropic"]).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  AI_MODEL: z.string().min(1).optional(),
});

export type Env = z.infer<typeof schema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  // Les chaînes vides sont traitées comme absentes.
  const cleaned = Object.fromEntries(Object.entries(source).filter(([, v]) => v !== undefined && v !== ""));
  const result = schema.safeParse(cleaned);
  if (!result.success) {
    // On liste les clés invalides, jamais leurs valeurs (qui peuvent être des secrets).
    const keys = [...new Set(result.error.issues.map((i) => i.path.join(".")))].join(", ");
    throw new Error(`Configuration invalide ou manquante : ${keys}. Voir .env.example.`);
  }
  const env = result.data;
  if (env.AI_PROVIDER === "anthropic" && !env.ANTHROPIC_API_KEY) {
    throw new Error("Configuration invalide : AI_PROVIDER=anthropic exige ANTHROPIC_API_KEY.");
  }
  return env;
}

let cached: Env | undefined;

export function env(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}
