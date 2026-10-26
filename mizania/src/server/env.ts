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
  /** Envoi d'emails : vide = non configuré (en dev/test, les emails sont affichés dans la console). */
  MAIL_PROVIDER: z.enum(["console", "resend", "brevo"]).optional(),
  /** Ex. « MIZANIA <no-reply@votre-domaine.dz> » */
  MAIL_FROM: z.string().min(3).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  BREVO_API_KEY: z.string().min(1).optional(),
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
  if (env.MAIL_PROVIDER === "resend" && !(env.RESEND_API_KEY && env.MAIL_FROM)) {
    throw new Error("Configuration invalide : MAIL_PROVIDER=resend exige RESEND_API_KEY et MAIL_FROM.");
  }
  if (env.MAIL_PROVIDER === "brevo" && !(env.BREVO_API_KEY && env.MAIL_FROM)) {
    throw new Error("Configuration invalide : MAIL_PROVIDER=brevo exige BREVO_API_KEY et MAIL_FROM.");
  }
  return env;
}

let cached: Env | undefined;

export function env(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}
