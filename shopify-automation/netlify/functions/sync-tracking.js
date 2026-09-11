import { cj } from "../../src/lib/cjClient.js";
import { shopify } from "../../src/lib/shopifyClient.js";
import { store } from "../../src/lib/blobsStore.js";

const ORDER_MAP_STORE = "order-map";

/**
 * Tourne toutes les heures : pour chaque commande transmise à CJ mais pas encore
 * expédiée côté Shopify, on vérifie le statut chez CJ. Si un numéro de suivi est
 * disponible, on crée le "fulfillment" Shopify correspondant -> le client reçoit
 * automatiquement l'email de suivi Shopify, sans aucune action manuelle.
 */
export default async () => {
  const blobStore = store(ORDER_MAP_STORE);
  const { blobs } = await blobStore.list();

  const results = [];

  for (const { key } of blobs) {
    const record = await blobStore.get(key, { type: "json" });
    if (!record || record.status !== "submitted") continue;

    try {
      const detail = await cj.getOrderDetail(record.cjOrderId);
      if (!detail?.trackNumber) {
        results.push({ shopifyOrderId: record.shopifyOrderId, status: "pending" });
        continue;
      }

      await shopify.createFulfillment(record.shopifyOrderId, {
        notify_customer: true,
        tracking_info: {
          number: detail.trackNumber,
          company: detail.logisticName || "Standard Shipping",
        },
      });

      await blobStore.setJSON(key, { ...record, status: "shipped", trackingNumber: detail.trackNumber });
      results.push({ shopifyOrderId: record.shopifyOrderId, status: "shipped" });
    } catch (err) {
      results.push({ shopifyOrderId: record.shopifyOrderId, error: err.message });
    }
  }

  console.log("sync-tracking:", JSON.stringify(results));
  return new Response(JSON.stringify({ checked: results.length, results }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const config = {
  schedule: "0 * * * *",
};
