import "server-only";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/server/db";
import { emailVerificationTokens, passwordResetTokens, sessions, users } from "@/server/db/schema";
import { env } from "@/server/env";
import { getMailer } from "@/server/mail/mailer";
import { passwordResetEmail, verificationEmail } from "@/server/mail/templates";
import { generateToken, hashToken } from "./crypto";
import { hashPassword, verifyAgainstDummy, verifyPassword } from "./password";

const RESET_TTL_MS = 30 * 60 * 1000;
const VERIFY_TTL_MS = 48 * 60 * 60 * 1000;

export type RegisterInput = { email: string; password: string; fullName: string };

/** Entrées déjà validées et normalisées (schémas de src/lib/validation/auth). */
export async function registerUser(input: RegisterInput) {
  const passwordHash = await hashPassword(input.password);
  const [user] = await getDb()
    .insert(users)
    .values({ email: input.email, passwordHash, fullName: input.fullName })
    .onConflictDoNothing({ target: users.email })
    .returning({ id: users.id, email: users.email, fullName: users.fullName });
  if (!user) return { ok: false as const, error: "email_taken" as const };
  await sendVerificationEmail(user.id, user.email, user.fullName).catch(() => {
    // L'inscription réussit même si l'email ne part pas : l'utilisateur pourra le renvoyer.
  });
  return { ok: true as const, user };
}

export async function authenticate(email: string, password: string) {
  const [user] = await getDb()
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!user) return verifyAgainstDummy(password).then(() => null);
  return (await verifyPassword(user.passwordHash, password)) ? { id: user.id } : null;
}

// ───────────── Vérification de l'adresse email ─────────────

export async function sendVerificationEmail(userId: string, email: string, fullName: string): Promise<boolean> {
  const mailer = getMailer();
  if (!mailer) return false;
  const token = generateToken();
  await getDb()
    .insert(emailVerificationTokens)
    .values({ userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + VERIFY_TTL_MS) });
  await mailer.send(verificationEmail(email, fullName, `${env().APP_URL}/verifier-email/${token}`));
  return true;
}

export async function verifyEmail(token: string): Promise<boolean> {
  return getDb().transaction(async (tx) => {
    const [row] = await tx
      .update(emailVerificationTokens)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(emailVerificationTokens.tokenHash, hashToken(token)),
          isNull(emailVerificationTokens.usedAt),
          gt(emailVerificationTokens.expiresAt, new Date()),
        ),
      )
      .returning({ userId: emailVerificationTokens.userId });
    if (!row) return false;
    await tx.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, row.userId));
    return true;
  });
}

// ───────────── Mot de passe oublié ─────────────

/**
 * Envoie un lien de réinitialisation si le compte existe. Ne révèle JAMAIS
 * si l'email correspond à un compte. Renvoie le jeton (tests uniquement).
 */
export async function requestPasswordReset(email: string): Promise<string | null> {
  const mailer = getMailer();
  if (!mailer) return null;
  const [user] = await getDb().select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (!user) return null;
  const token = generateToken();
  await getDb()
    .insert(passwordResetTokens)
    .values({ userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + RESET_TTL_MS) });
  await mailer.send(passwordResetEmail(email, `${env().APP_URL}/reinitialiser/${token}`));
  return token;
}

export async function isResetTokenValid(token: string): Promise<boolean> {
  const [row] = await getDb()
    .select({ id: passwordResetTokens.id })
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, hashToken(token)),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return Boolean(row);
}

/** Usage unique ; déconnecte toutes les sessions existantes. */
export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  const passwordHash = await hashPassword(newPassword);
  return getDb().transaction(async (tx) => {
    const [row] = await tx
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(passwordResetTokens.tokenHash, hashToken(token)),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, new Date()),
        ),
      )
      .returning({ userId: passwordResetTokens.userId });
    if (!row) return false;
    await tx.update(users).set({ passwordHash }).where(eq(users.id, row.userId));
    await tx.delete(sessions).where(eq(sessions.userId, row.userId));
    // Les autres liens de réinitialisation en attente deviennent inutilisables.
    await tx
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(and(eq(passwordResetTokens.userId, row.userId), isNull(passwordResetTokens.usedAt)));
    // L'utilisateur a prouvé qu'il reçoit les emails à cette adresse.
    await tx.update(users).set({ emailVerifiedAt: new Date() }).where(and(eq(users.id, row.userId), isNull(users.emailVerifiedAt)));
    return true;
  });
}

/** Change le mot de passe et ferme les AUTRES sessions. */
export async function changePassword(userId: string, currentSessionId: string, current: string, next: string) {
  const [user] = await getDb().select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, userId));
  if (!user || !(await verifyPassword(user.passwordHash, current))) return false;
  const passwordHash = await hashPassword(next);
  await getDb().transaction(async (tx) => {
    await tx.update(users).set({ passwordHash }).where(eq(users.id, userId));
    const others = await tx.select({ id: sessions.id }).from(sessions).where(eq(sessions.userId, userId));
    for (const s of others) if (s.id !== currentSessionId) await tx.delete(sessions).where(eq(sessions.id, s.id));
  });
  return true;
}

export async function updateProfile(userId: string, fullName: string) {
  await getDb().update(users).set({ fullName }).where(eq(users.id, userId));
}
