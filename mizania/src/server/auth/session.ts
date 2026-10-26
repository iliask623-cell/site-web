import "server-only";
import { and, eq, lt } from "drizzle-orm";
import { getDb } from "@/server/db";
import { sessions, users } from "@/server/db/schema";
import { generateToken, hashToken } from "./crypto";

const DAY = 24 * 60 * 60 * 1000;
export const SESSION_DURATION_MS = 30 * DAY;

export type SessionUser = Pick<
  typeof users.$inferSelect,
  "id" | "email" | "fullName" | "locale" | "emailVerifiedAt" | "isPlatformAdmin"
>;

export type ValidSession = {
  id: string;
  userId: string;
  activeOrganizationId: string | null;
  expiresAt: Date;
  user: SessionUser;
};

export async function createSession(userId: string, activeOrganizationId: string | null = null) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await getDb().insert(sessions).values({ tokenHash: hashToken(token), userId, activeOrganizationId, expiresAt });
  return { token, expiresAt };
}

/**
 * Valide un jeton de session. Renvoie null si inconnu ou expiré (et supprime
 * alors la session expirée). Durée fixe de 30 jours après la connexion :
 * le cookie et la session expirent en même temps.
 */
export async function validateSessionToken(token: string): Promise<ValidSession | null> {
  if (!token || token.length > 100) return null;
  const db = getDb();
  const [row] = await db
    .select({
      id: sessions.id,
      userId: sessions.userId,
      activeOrganizationId: sessions.activeOrganizationId,
      expiresAt: sessions.expiresAt,
      user: {
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        locale: users.locale,
        emailVerifiedAt: users.emailVerifiedAt,
        isPlatformAdmin: users.isPlatformAdmin,
      },
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.tokenHash, hashToken(token)))
    .limit(1);
  if (!row) return null;

  const now = Date.now();
  if (row.expiresAt.getTime() <= now) {
    await db.delete(sessions).where(eq(sessions.id, row.id));
    return null;
  }
  return row;
}

export async function invalidateSession(sessionId: string): Promise<void> {
  await getDb().delete(sessions).where(eq(sessions.id, sessionId));
}

export async function invalidateUserSessions(userId: string): Promise<void> {
  await getDb().delete(sessions).where(eq(sessions.userId, userId));
}

export async function setActiveOrganization(sessionId: string, organizationId: string): Promise<void> {
  await getDb().update(sessions).set({ activeOrganizationId: organizationId }).where(eq(sessions.id, sessionId));
}

export async function deleteExpiredSessions(): Promise<void> {
  await getDb().delete(sessions).where(and(lt(sessions.expiresAt, new Date())));
}
