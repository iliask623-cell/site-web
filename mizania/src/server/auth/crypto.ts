import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/** Jeton aléatoire de 256 bits, encodé pour une URL ou un cookie. */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Empreinte SHA-256 (hex). Seule l'empreinte d'un jeton est stockée en base. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}
