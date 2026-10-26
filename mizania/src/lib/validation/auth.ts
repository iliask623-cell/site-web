import { z } from "zod";

export const emailSchema = z
  .string({ error: "Adresse email requise." })
  .trim()
  .toLowerCase()
  .max(254, "Adresse email trop longue.")
  .pipe(z.email("Adresse email invalide."));

export const PASSWORD_MIN = 10;

export const passwordSchema = z
  .string({ error: "Mot de passe requis." })
  .min(PASSWORD_MIN, `Le mot de passe doit contenir au moins ${PASSWORD_MIN} caractères.`)
  .max(128, "Le mot de passe est trop long (128 caractères maximum).");

export const fullNameSchema = z
  .string({ error: "Nom requis." })
  .trim()
  .min(2, "Indiquez votre nom (2 caractères minimum).")
  .max(100, "Nom trop long.");

export const registerSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  // À la connexion on ne révèle pas la politique : on refuse juste les valeurs absurdes.
  password: z.string().min(1, "Mot de passe requis.").max(128),
});
