import "server-only";
import { hash, verify } from "@node-rs/argon2";

/**
 * Argon2id avec les paramètres par défaut de @node-rs/argon2
 * (m = 19 MiB, t = 2, p = 1), conformes aux recommandations OWASP.
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

let dummyHash: Promise<string> | undefined;

/**
 * Vérification factice quand l'email est inconnu : le temps de réponse est
 * comparable, ce qui empêche de deviner quels emails ont un compte.
 */
export async function verifyAgainstDummy(password: string): Promise<false> {
  dummyHash ??= hashPassword("mizania-dummy-password-for-timing");
  await verifyPassword(await dummyHash, password);
  return false;
}
