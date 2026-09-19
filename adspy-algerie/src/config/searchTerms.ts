/**
 * Mots-cles de depart pour trouver des pubs e-commerce grand public visant
 * l'Algerie. L'API Meta Ad Library exige un terme de recherche non vide ;
 * il n'existe pas de "tout voir" universel, donc on balaie une liste de
 * mots frequents dans les pubs produit (livraison, commande, promo, etc.)
 * plutot que des noms de produits precis.
 *
 * A ajuster au fil de l'eau selon ce qui remonte le plus de resultats
 * pertinents pour l'Algerie.
 */
export const DEFAULT_SEARCH_TERMS = [
  "livraison",
  "commande",
  "promo",
  "prix",
  "offre",
  "nouveau produit",
];
