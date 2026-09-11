const REQUIRED_ENV = ["SHOPIFY_STORE_DOMAIN", "SHOPIFY_ADMIN_API_ACCESS_TOKEN"];

function assertConfigured() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Variables Shopify manquantes: ${missing.join(", ")}`);
  }
}

function baseUrl() {
  const version = process.env.SHOPIFY_API_VERSION || "2024-10";
  return `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/${version}`;
}

/**
 * Appel générique à l'API Admin Shopify avec retry sur 429 (rate limit)
 * en respectant le header Retry-After renvoyé par Shopify.
 */
async function shopifyRequest(path, { method = "GET", body, attempt = 1 } = {}) {
  assertConfigured();

  const res = await fetch(`${baseUrl()}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 429 && attempt <= 4) {
    const retryAfter = Number(res.headers.get("Retry-After") || "1");
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
    return shopifyRequest(path, { method, body, attempt: attempt + 1 });
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Shopify API ${method} ${path} -> ${res.status}: ${text.slice(0, 500)}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const shopify = {
  getProductByHandle: (handle) => shopifyRequest(`/products.json?handle=${encodeURIComponent(handle)}`),

  createProduct: (product) => shopifyRequest("/products.json", { method: "POST", body: { product } }),

  updateVariant: (variantId, variant) =>
    shopifyRequest(`/variants/${variantId}.json`, { method: "PUT", body: { variant } }),

  setInventoryLevel: (inventoryItemId, locationId, available) =>
    shopifyRequest("/inventory_levels/set.json", {
      method: "POST",
      body: { inventory_item_id: inventoryItemId, location_id: locationId, available },
    }),

  getOrder: (orderId) => shopifyRequest(`/orders/${orderId}.json`),

  createFulfillment: (orderId, fulfillment) =>
    shopifyRequest(`/orders/${orderId}/fulfillments.json`, {
      method: "POST",
      body: { fulfillment },
    }),

  getLocations: () => shopifyRequest("/locations.json"),
};
