import { getStore } from "@netlify/blobs";

/**
 * Petit magasin clé/valeur durable (Netlify Blobs) utilisé pour :
 * - mettre en cache le token d'accès CJ Dropshipping (évite de le régénérer à chaque appel)
 * - stocker le mapping commande Shopify <-> commande CJ (pour le suivi et éviter les doublons)
 * - stocker le mapping produit CJ <-> produit/variant Shopify (pour la synchro stock/prix)
 */
export function store(name) {
  // En production (fonctions Netlify), getStore(name) suffit : le contexte est injecté
  // automatiquement. En local (script d'import lancé via `node`), il faut passer
  // explicitement le site et le token pour écrire dans le même magasin.
  if (process.env.NETLIFY_SITE_ID && process.env.NETLIFY_AUTH_TOKEN) {
    return getStore({ name, siteID: process.env.NETLIFY_SITE_ID, token: process.env.NETLIFY_AUTH_TOKEN });
  }
  return getStore(name);
}

export async function getJSON(storeName, key) {
  const value = await store(storeName).get(key, { type: "json" });
  return value ?? null;
}

export async function setJSON(storeName, key, value) {
  await store(storeName).setJSON(key, value);
}
