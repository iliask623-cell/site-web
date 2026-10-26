import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { env } from "@/server/env";
import { getMembership, listMemberships, type OrgContext } from "@/server/services/organizations";
import { setActiveOrganization, validateSessionToken, type ValidSession } from "./session";

/**
 * En production (HTTPS), le préfixe __Host- impose Secure, Path=/ et
 * l'absence de Domain : le cookie ne peut pas être posé par un sous-domaine.
 */
function cookieName() {
  return env().APP_URL.startsWith("https://") ? "__Host-mizania_session" : "mizania_session";
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  (await cookies()).set(cookieName(), token, {
    httpOnly: true,
    secure: env().APP_URL.startsWith("https://"),
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(cookieName());
}

/** Session de la requête courante (mise en cache pour la durée de la requête). */
export const getSession = cache(async (): Promise<ValidSession | null> => {
  const token = (await cookies()).get(cookieName())?.value;
  return token ? validateSessionToken(token) : null;
});

export async function requireUser(): Promise<ValidSession> {
  const session = await getSession();
  if (!session) redirect("/connexion");
  return session;
}

export type AppContext = {
  session: ValidSession;
  org: OrgContext;
  organization: NonNullable<Awaited<ReturnType<typeof getMembership>>>["organization"];
};

/**
 * Utilisateur connecté + organisation active dont il est membre. Redirige
 * vers la connexion ou l'onboarding si nécessaire. À appeler dans CHAQUE page
 * et action de l'espace connecté.
 */
export const requireOrg = cache(async (): Promise<AppContext> => {
  const session = await requireUser();
  let membership = session.activeOrganizationId
    ? await getMembership(session.userId, session.activeOrganizationId)
    : null;
  if (!membership) {
    const [first] = await listMemberships(session.userId);
    if (!first) redirect("/app/onboarding");
    membership = await getMembership(session.userId, first.organizationId);
    if (!membership) redirect("/app/onboarding");
    await setActiveOrganization(session.id, first.organizationId);
  }
  return {
    session,
    organization: membership.organization,
    org: { userId: session.userId, organizationId: membership.organization.id, role: membership.role },
  };
});

/** Adresse IP du client (premier élément de X-Forwarded-For derrière un proxy). */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}
