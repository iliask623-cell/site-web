import { cj } from "../lib/cjClient.js";
import { shopify } from "../lib/shopifyClient.js";
import { computeSellingPrice, computeCompareAtPrice } from "../lib/pricing.js";
import { getJSON, setJSON } from "../lib/blobsStore.js";

/**
 * Script à lancer UNE FOIS, à la main, après avoir rempli le .env :
 *   npm run import:product -- <CJ_PID>
 *
 * Le PID du produit choisi (correcteur de posture) est documenté dans
 * src/data/product-selection.md — cherche-le sur cjdropshipping.com et colle
 * son PID ici, ou passe-le en argument.
 *
 * Le script :
 * 1. récupère le produit + ses variantes chez CJ
 * 2. calcule le prix de vente (règle de marge dans .env)
 * 3. crée le produit dans Shopify (brouillon, à publier après relecture manuelle)
 * 4. enregistre le mapping variante Shopify <-> vid CJ, utilisé ensuite par les
 *    fonctions de synchro et le webhook de commande
 */
async function main() {
  const pid = process.argv[2];
  if (!pid) {
    console.error("Usage: npm run import:product -- <CJ_PID>");
    process.exit(1);
  }

  const markupMultiplier = Number(process.env.MARKUP_MULTIPLIER || "2.8");
  const minMarginEur = Number(process.env.MIN_MARGIN_EUR || "8");

  console.log(`Récupération du produit CJ ${pid}...`);
  const cjProduct = await cj.getProductDetail(pid);

  const variants = (cjProduct.variants || []).map((v) => {
    const { price, meetsMinMargin } = computeSellingPrice(v.variantSellPrice, {
      markupMultiplier,
      minMarginEur,
    });
    if (!meetsMinMargin) {
      console.warn(`⚠️  Marge insuffisante pour la variante ${v.vid} (prix calculé ${price}€)`);
    }
    return {
      cjVid: v.vid,
      option1: v.variantNameEn || "Default",
      sku: v.variantSku,
      price,
      compareAtPrice: computeCompareAtPrice(price),
      weightKg: (v.variantWeight || 0) / 1000,
    };
  });

  console.log(`Création du produit dans Shopify (statut: brouillon)...`);
  const created = await shopify.createProduct({
    title: cjProduct.productNameEn,
    body_html: cjProduct.description || "",
    vendor: "CJ Dropshipping",
    status: "draft",
    images: (cjProduct.productImageSet || []).map((src) => ({ src })),
    variants: variants.map((v) => ({
      option1: v.option1,
      price: String(v.price),
      compare_at_price: String(v.compareAtPrice),
      sku: v.sku,
      weight: v.weightKg,
      weight_unit: "kg",
      inventory_management: "shopify",
    })),
  });

  const mapping = (await getJSON("product-map", "cj-sku-by-variant")) || {};
  created.product.variants.forEach((shopifyVariant, i) => {
    mapping[String(shopifyVariant.id)] = {
      cjVid: variants[i].cjVid,
      inventoryItemId: shopifyVariant.inventory_item_id,
    };
  });
  await setJSON("product-map", "cj-sku-by-variant", mapping);

  console.log(`✅ Produit créé en brouillon : ${created.product.id} — ${created.product.title}`);
  console.log("   Relis la fiche produit, ajoute de vraies photos/description marketing, puis publie-la dans Shopify.");
}

main().catch((err) => {
  console.error("Échec de l'import:", err.message);
  process.exit(1);
});
