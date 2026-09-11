import { verifyShopifyWebhook } from "../../src/lib/verifyShopifyWebhook.js";
import { cj } from "../../src/lib/cjClient.js";
import { getJSON, setJSON } from "../../src/lib/blobsStore.js";

const ORDER_MAP_STORE = "order-map";

/**
 * Webhook Shopify "orders/create" : à chaque commande payée, on la transmet
 * automatiquement à CJ Dropshipping pour expédition.
 *
 * Sécurité :
 * - signature HMAC obligatoire (rejette tout appel qui ne vient pas de Shopify)
 * - lecture du corps BRUT (pas de parsing avant vérification)
 * - idempotence via Netlify Blobs (Shopify peut renvoyer le même webhook plusieurs fois)
 * - on ne fait confiance à aucune donnée cliente pour le prix/produit : on ne lit que
 *   les IDs de variantes/quantités de la commande, tout le reste vient de nos propres
 *   mappings CJ, jamais du payload externe
 */
export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const rawBody = await req.text();
  const hmac = req.headers.get("x-shopify-hmac-sha256");
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;

  if (!verifyShopifyWebhook(rawBody, hmac, secret)) {
    return new Response("Invalid signature", { status: 401 });
  }

  let order;
  try {
    order = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!order?.id || !Array.isArray(order.line_items)) {
    return new Response("Malformed order payload", { status: 400 });
  }

  const idempotencyKey = String(order.id);
  const existing = await getJSON(ORDER_MAP_STORE, idempotencyKey);
  if (existing) {
    // Déjà traitée : on répond OK sans recréer la commande côté fournisseur.
    return new Response(JSON.stringify({ status: "already_processed", cjOrderId: existing.cjOrderId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const productMappings = await getJSON("product-map", "cj-sku-by-variant") || {};

  const products = order.line_items.map((item) => {
    const mapping = productMappings[String(item.variant_id)];
    if (!mapping) {
      throw new Error(`Aucun mapping CJ trouvé pour la variante Shopify ${item.variant_id}`);
    }
    return { vid: mapping.cjVid, quantity: item.quantity };
  });

  const shipping = order.shipping_address || {};
  const cjOrder = await cj.createOrder({
    orderNumber: `SHOPIFY-${order.id}`,
    shippingCountryCode: shipping.country_code,
    shippingProvince: shipping.province,
    shippingCity: shipping.city,
    shippingAddress: `${shipping.address1 || ""} ${shipping.address2 || ""}`.trim(),
    shippingCustomerName: shipping.name || `${order.customer?.first_name || ""} ${order.customer?.last_name || ""}`.trim(),
    shippingZip: shipping.zip,
    shippingPhone: shipping.phone || order.phone,
    products,
  });

  await setJSON(ORDER_MAP_STORE, idempotencyKey, {
    shopifyOrderId: order.id,
    cjOrderId: cjOrder.orderId,
    status: "submitted",
    createdAt: new Date().toISOString(),
  });

  return new Response(JSON.stringify({ status: "submitted", cjOrderId: cjOrder.orderId }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const config = {
  path: "/order-webhook",
};
