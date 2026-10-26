import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { registerSchema } from "@/lib/validation/auth";
import { consumeRateLimit } from "@/server/auth/rate-limit";
import {
  authenticate,
  changePassword,
  isResetTokenValid,
  registerUser,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
} from "@/server/auth/service";
import { createSession, invalidateSession, validateSessionToken } from "@/server/auth/session";
import { hashToken } from "@/server/auth/crypto";
import { closeDb, getDb } from "@/server/db";
import { passwordResetTokens, sessions, users } from "@/server/db/schema";
import { ConsoleMailer, setMailerForTests } from "@/server/mail/mailer";
import { resetDatabase } from "../support/db";

afterAll(closeDb);

let mailer: ConsoleMailer;
beforeEach(async () => {
  await resetDatabase();
  mailer = new ConsoleMailer();
  setMailerForTests(mailer);
});

const input = registerSchema.parse({ fullName: "Amina B.", email: "  Amina@Example.TEST ", password: "motdepasse-solide" });

describe("inscription", () => {
  it("normalise l'email et ne stocke jamais le mot de passe en clair", async () => {
    const r = await registerUser(input);
    expect(r.ok).toBe(true);
    const [u] = await getDb().select().from(users);
    expect(u.email).toBe("amina@example.test");
    expect(u.passwordHash).toMatch(/^\$argon2id\$/);
    expect(u.passwordHash).not.toContain("motdepasse");
    expect(u.emailVerifiedAt).toBeNull();
  });

  it("refuse un email déjà utilisé", async () => {
    await registerUser(input);
    expect(await registerUser({ ...input, fullName: "Autre" })).toEqual({ ok: false, error: "email_taken" });
  });

  it("valide les entrées (mot de passe trop court, email invalide)", () => {
    expect(registerSchema.safeParse({ ...input, password: "court" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...input, email: "pas-un-email" }).success).toBe(false);
  });

  it("envoie un email de vérification à usage unique", async () => {
    await registerUser(input);
    expect(mailer.sent).toHaveLength(1);
    const token = mailer.sent[0].text.match(/verifier-email\/([\w-]+)/)![1];
    expect(await verifyEmail(token)).toBe(true);
    expect(await verifyEmail(token)).toBe(false);
    const [u] = await getDb().select().from(users);
    expect(u.emailVerifiedAt).not.toBeNull();
  });
});

describe("connexion et sessions", () => {
  it("authentifie avec le bon mot de passe uniquement", async () => {
    await registerUser(input);
    expect(await authenticate("amina@example.test", "motdepasse-solide")).not.toBeNull();
    expect(await authenticate("amina@example.test", "mauvais-mot-de-passe")).toBeNull();
    expect(await authenticate("inconnu@example.test", "motdepasse-solide")).toBeNull();
  });

  it("stocke uniquement l'empreinte du jeton de session", async () => {
    const r = await registerUser(input);
    if (!r.ok) throw new Error();
    const { token } = await createSession(r.user.id);
    const [s] = await getDb().select().from(sessions);
    expect(s.tokenHash).toBe(hashToken(token));
    expect(s.tokenHash).not.toBe(token);
    const valid = await validateSessionToken(token);
    expect(valid?.user.email).toBe("amina@example.test");
  });

  it("refuse un jeton inconnu, expiré ou révoqué", async () => {
    const r = await registerUser(input);
    if (!r.ok) throw new Error();
    expect(await validateSessionToken("inconnu")).toBeNull();
    const { token } = await createSession(r.user.id);
    await getDb().update(sessions).set({ expiresAt: new Date(Date.now() - 1000) });
    expect(await validateSessionToken(token)).toBeNull();
    expect(await getDb().select().from(sessions)).toHaveLength(0); // session expirée supprimée
    const second = await createSession(r.user.id);
    const valid = await validateSessionToken(second.token);
    await invalidateSession(valid!.id);
    expect(await validateSessionToken(second.token)).toBeNull();
  });

  it("le changement de mot de passe ferme les autres sessions", async () => {
    const r = await registerUser(input);
    if (!r.ok) throw new Error();
    const a = await createSession(r.user.id);
    const b = await createSession(r.user.id);
    const current = await validateSessionToken(a.token);
    expect(await changePassword(r.user.id, current!.id, "faux", "nouveau-mot-de-passe")).toBe(false);
    expect(await changePassword(r.user.id, current!.id, "motdepasse-solide", "nouveau-mot-de-passe")).toBe(true);
    expect(await validateSessionToken(a.token)).not.toBeNull();
    expect(await validateSessionToken(b.token)).toBeNull();
    expect(await authenticate("amina@example.test", "nouveau-mot-de-passe")).not.toBeNull();
  });
});

describe("mot de passe oublié", () => {
  it("ne révèle pas si un compte existe et n'envoie rien pour un email inconnu", async () => {
    expect(await requestPasswordReset("inconnu@example.test")).toBeNull();
    expect(mailer.sent).toHaveLength(0);
  });

  it("réinitialise une seule fois et déconnecte toutes les sessions", async () => {
    const r = await registerUser(input);
    if (!r.ok) throw new Error();
    const s = await createSession(r.user.id);
    const token = await requestPasswordReset("amina@example.test");
    expect(token).toBeTruthy();
    expect(mailer.sent.at(-1)!.text).toContain(`/reinitialiser/${token}`);
    const [row] = await getDb().select().from(passwordResetTokens);
    expect(row.tokenHash).toBe(hashToken(token!));
    expect(await isResetTokenValid(token!)).toBe(true);
    expect(await resetPassword(token!, "tout-nouveau-mdp")).toBe(true);
    expect(await resetPassword(token!, "encore-un-autre")).toBe(false);
    expect(await validateSessionToken(s.token)).toBeNull();
    expect(await authenticate("amina@example.test", "tout-nouveau-mdp")).not.toBeNull();
  });

  it("refuse un lien expiré", async () => {
    await registerUser(input);
    const token = await requestPasswordReset("amina@example.test");
    await getDb()
      .update(passwordResetTokens)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(passwordResetTokens.tokenHash, hashToken(token!)));
    expect(await isResetTokenValid(token!)).toBe(false);
    expect(await resetPassword(token!, "tout-nouveau-mdp")).toBe(false);
  });

  it("sans service d'email configuré, aucun jeton n'est créé", async () => {
    await registerUser(input);
    setMailerForTests(null);
    expect(await requestPasswordReset("amina@example.test")).toBeNull();
    expect(await getDb().select().from(passwordResetTokens)).toHaveLength(0);
  });
});

describe("limitation des tentatives", () => {
  it("bloque au-delà de la limite dans la fenêtre", async () => {
    const rule = { limit: 3, windowSeconds: 60 };
    const results = [];
    for (let i = 0; i < 5; i++) results.push(await consumeRateLimit("test:key", rule));
    expect(results).toEqual([true, true, true, false, false]);
    expect(await consumeRateLimit("test:autre", rule)).toBe(true);
  });

  it("repart à zéro après la fenêtre", async () => {
    const rule = { limit: 1, windowSeconds: 1 };
    expect(await consumeRateLimit("test:fenetre", rule)).toBe(true);
    expect(await consumeRateLimit("test:fenetre", rule)).toBe(false);
    await new Promise((r) => setTimeout(r, 1100));
    expect(await consumeRateLimit("test:fenetre", rule)).toBe(true);
  });
});
