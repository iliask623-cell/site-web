import { cj } from "../../src/lib/cjClient.js";
import { shopify } from "../../src/lib/shopifyClient.js";
import { computeSellingPrice } from "../../src/lib/pricing.js";
import { getJSON } from "../../src/lib/blobsStore.js";

/**
 * Tourne toutes les 6h : relit le stock et le coût actuel chez CJ Dropshipping
 * pour chaque produit importé, et met à jour Shopify en conséquence.
 * - rupture de stock côté fournisseur -> variante désactivée (inventory = 0)
 * - changement de coût -> prix Shopify recalculé avec la même règle de marge
 *   (jamais de prix qui descend sous le plancher de marge minimum)
 */
export default async () => {
  const productMappings = (await getJSON("product-map", "cj-sku-by-variant")) || {};
  const locations = await shopify.getLocations();
  const locationId = locations.locations?.[0]?.id;

  const markupMultiplier = Number(process.env.MARKUP_MULTIPLIER || "2.8");
  const minMarginEur = Number(process.env.MIN_MARGIN_EUR || "8");

  const results = [];

  for (const [variantId, mapping] of Object.entries(productMappings)) {
    try {
      const stock = await cj.getProductStock(mapping.cjVid);
      const available = stock?.storageNum ?? 0;

      if (locationId) {
        await shopify.setInventoryLevel(mapping.inventoryItemId, locationId, available);
      }

      if (typeof stock?.sellPrice === "number") {
        const { price, meetsMinMargin } = computeSellingPrice(stock.sellPrice, {
          markupMultiplier,
          minMarginEur,
        });

        await shopify.updateVariant(variantId, {
          id: variantId,
          price: String(price),
        });

        results.push({ variantId, available, price, meetsMinMargin });
      } else {
        results.push({ variantId, available });
      }
    } catch (err) {
      results.push({ variantId, error: err.message });
    }
  }

  console.log("sync-inventory:", JSON.stringify(results));
  return new Response(JSON.stringify({ synced: results.length, results }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const config = {
  schedule: "0 */6 * * *",
};
