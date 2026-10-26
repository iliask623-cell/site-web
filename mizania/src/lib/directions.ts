import type { Direction } from "@/lib/validation/transaction";

export const DIRECTION_UI: Record<
  Direction,
  { path: string; title: string; singular: string; newLabel: string; partyHint: string; empty: string }
> = {
  income: {
    path: "/app/recettes",
    title: "Recettes",
    singular: "recette",
    newLabel: "Nouvelle recette",
    partyHint: "Ex. : Prestation logo — client Sarl Atlas",
    empty: "Enregistrez l’argent que vous recevez : ventes, prestations, acomptes…",
  },
  expense: {
    path: "/app/depenses",
    title: "Dépenses",
    singular: "dépense",
    newLabel: "Nouvelle dépense",
    partyHint: "Ex. : Loyer du local — mars",
    empty: "Enregistrez ce que vous payez : achats, loyer, factures, transport…",
  },
};
