"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { fieldErrorsOf, formValues, type FormState } from "@/lib/form-state";
import { emailSchema, loginSchema, passwordSchema, registerSchema } from "@/lib/validation/auth";
import { consumeRateLimit, RATE_LIMITS, resetRateLimit } from "@/server/auth/rate-limit";
import { clearSessionCookie, getClientIp, getSession, setSessionCookie } from "@/server/auth/request";
import { authenticate, registerUser, requestPasswordReset, resetPassword, sendVerificationEmail } from "@/server/auth/service";
import { createSession, invalidateSession } from "@/server/auth/session";
import { getMailer } from "@/server/mail/mailer";

const TOO_MANY = "Trop de tentatives. Patientez quelques minutes avant de réessayer.";

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  if (!formData.get("accept")) {
    return { values, fieldErrors: { accept: "Vous devez accepter l'avertissement pour créer un compte." } };
  }
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { values, fieldErrors: fieldErrorsOf(parsed.error) };

  if (!(await consumeRateLimit(`register:ip:${await getClientIp()}`, RATE_LIMITS.registerPerIp))) {
    return { values, error: TOO_MANY };
  }
  const result = await registerUser(parsed.data);
  if (!result.ok) {
    return { values, fieldErrors: { email: "Un compte existe déjà avec cette adresse. Connectez-vous ou réinitialisez votre mot de passe." } };
  }
  const { token, expiresAt } = await createSession(result.user.id);
  await setSessionCookie(token, expiresAt);
  redirect("/app/onboarding");
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { values, fieldErrors: fieldErrorsOf(parsed.error) };
  const { email, password } = parsed.data;

  const ip = await getClientIp();
  const okEmail = await consumeRateLimit(`login:email:${email}`, RATE_LIMITS.loginPerEmail);
  const okIp = await consumeRateLimit(`login:ip:${ip}`, RATE_LIMITS.loginPerIp);
  if (!okEmail || !okIp) return { values, error: TOO_MANY };

  const user = await authenticate(email, password);
  // Message identique que l'email existe ou non.
  if (!user) return { values, error: "Email ou mot de passe incorrect." };

  await resetRateLimit(`login:email:${email}`);
  const { token, expiresAt } = await createSession(user.id);
  await setSessionCookie(token, expiresAt);
  redirect("/app");
}

export async function logoutAction(): Promise<void> {
  const session = await getSession();
  if (session) await invalidateSession(session.id);
  await clearSessionCookie();
  redirect("/connexion?deconnecte=1");
}

export async function forgotPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const parsed = z.object({ email: emailSchema }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { values, fieldErrors: fieldErrorsOf(parsed.error) };
  if (!getMailer()) {
    return { values, error: "L'envoi d'emails n'est pas encore configuré sur ce serveur : la réinitialisation par email est indisponible pour le moment." };
  }
  const email = parsed.data.email;
  const ip = await getClientIp();
  const allowed =
    (await consumeRateLimit(`reset:email:${email}`, RATE_LIMITS.resetPerEmail)) &&
    (await consumeRateLimit(`reset:ip:${ip}`, RATE_LIMITS.resetPerIp));
  if (allowed) {
    try {
      await requestPasswordReset(email);
    } catch {
      return { values, error: "L'email n'a pas pu être envoyé. Réessayez dans quelques minutes." };
    }
  }
  // Même réponse dans tous les cas : on ne révèle pas si le compte existe.
  return {
    ok: true,
    message: "Si un compte existe avec cette adresse, un email contenant un lien de réinitialisation vient d'être envoyé. Le lien est valable 30 minutes.",
  };
}

export async function resetPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({ token: z.string().min(10).max(100), password: passwordSchema, confirm: z.string() })
    .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Les deux mots de passe ne correspondent pas." })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };
  const done = await resetPassword(parsed.data.token, parsed.data.password);
  if (!done) return { error: "Ce lien n'est plus valable (déjà utilisé ou expiré). Faites une nouvelle demande." };
  redirect("/connexion?reinitialise=1");
}

export async function resendVerificationAction(): Promise<FormState> {
  const session = await getSession();
  if (!session) redirect("/connexion");
  if (session.user.emailVerifiedAt) return { ok: true, message: "Votre adresse est déjà vérifiée." };
  if (!(await consumeRateLimit(`verify:user:${session.userId}`, RATE_LIMITS.resetPerEmail))) return { error: TOO_MANY };
  try {
    const sent = await sendVerificationEmail(session.userId, session.user.email, session.user.fullName);
    if (!sent) return { error: "L'envoi d'emails n'est pas encore configuré sur ce serveur." };
  } catch {
    return { error: "L'email n'a pas pu être envoyé. Réessayez plus tard." };
  }
  return { ok: true, message: "Email de vérification envoyé." };
}
