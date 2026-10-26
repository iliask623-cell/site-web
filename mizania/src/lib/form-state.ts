import type { z } from "zod";

/** État renvoyé par une Server Action de formulaire. */
export type FormState = {
  ok?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Valeurs saisies, pour ré-afficher le formulaire après une erreur. */
  values?: Record<string, string>;
};

export function formValues(formData: FormData, exclude: string[] = ["password", "currentPassword", "newPassword"]) {
  const values: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string" && !exclude.includes(k) && !k.startsWith("$ACTION")) values[k] = v;
  }
  return values;
}

/** Première erreur par champ, en français (messages des schémas Zod). */
export function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    out[key] ??= issue.message;
  }
  return out;
}
