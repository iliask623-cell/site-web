import crypto from "node:crypto";

/**
 * Vérifie qu'une requête webhook provient bien de Shopify.
 * Doit être appelé sur le corps BRUT (non parsé en JSON) de la requête,
 * sinon la signature ne correspondra jamais.
 */
export function verifyShopifyWebhook(rawBody, hmacHeader, secret) {
  if (!hmacHeader || !secret) return false;

  const digest = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");

  const digestBuffer = Buffer.from(digest);
  const headerBuffer = Buffer.from(hmacHeader);

  if (digestBuffer.length !== headerBuffer.length) return false;
  return crypto.timingSafeEqual(digestBuffer, headerBuffer);
}
