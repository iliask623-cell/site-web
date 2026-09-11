/**
 * Calcule le prix de vente à partir du coût fournisseur.
 * Règle : coût * multiplicateur, arrondi en prix psychologique (,99),
 * avec un plancher de marge minimum (sinon le produit est mis en brouillon
 * plutôt que publié avec une marge trop faible).
 */
export function computeSellingPrice(costAmount, { markupMultiplier, minMarginEur }) {
  const rawPrice = costAmount * markupMultiplier;
  const price = Math.floor(rawPrice) + 0.99;
  const margin = price - costAmount;

  return {
    price: Number(price.toFixed(2)),
    margin: Number(margin.toFixed(2)),
    meetsMinMargin: margin >= minMarginEur,
  };
}

export function computeCompareAtPrice(price) {
  // Prix barré ~35% au-dessus, courant en dropshipping pour signaler une "promo" honnête
  // (ne jamais inventer un prix barré fantaisiste : ça doit rester défendable/légal).
  return Number((price * 1.35).toFixed(2));
}
