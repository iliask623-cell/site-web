# AdSpy Algérie — Collecteur (Étape 1)

Voir `SPEC.md` pour le produit complet et `CLAUDE.md` pour les règles de
développement. Ce README couvre uniquement l'étape actuelle : le
collecteur en ligne de commande.

## Ce que fait ce script

`scripts/collect-ads.ts` interroge l'API officielle **Meta Ad Library**
(`ads_archive`), filtre sur les publicités actives visant l'Algérie,
calcule depuis combien de jours chacune tourne, et affiche dans le
terminal celles qui tournent depuis au moins 15 jours — triées de la plus
ancienne à la plus récente.

Aucune base de données pour l'instant, aucune interface : uniquement la
preuve que la donnée est récupérable et exploitable.

## Obtenir un accès à l'API Meta Ad Library

1. Créez un compte développeur sur https://developers.facebook.com/ et
   créez une application (type "Business").
2. Dans l'outil **Graph API Explorer**
   (https://developers.facebook.com/tools/explorer/), sélectionnez votre
   application et générez un **access token** avec la permission
   `ads_read`.
3. Meta impose une vérification d'identité pour certaines catégories de
   pubs (politique, enjeux sociaux) — pas nécessairement pour les pubs
   e-commerce classiques, mais la politique de Meta évolue. Vérifiez le
   statut d'accès requis directement sur
   https://www.facebook.com/ads/library/api avant d'aller plus loin :
   **c'est le point le plus fragile du projet, à valider en premier.**
4. Copiez le token obtenu dans un fichier `.env` (voir `.env.example`).

## Installation et lancement

```bash
cd adspy-algerie
npm install
cp .env.example .env
# renseignez META_ACCESS_TOKEN dans .env

npm run collect
```

Options disponibles :

```bash
# Changer le seuil de jours (defaut: 15)
npm run collect -- --min-days 20

# Changer les mots-cles de recherche (defaut: voir src/config/searchTerms.ts)
npm run collect -- --terms "livraison,promo,soldes"

# Changer le pays (defaut: DZ)
npm run collect -- --country DZ
```

## Tests

La logique de calcul (jours de diffusion, tri, dédoublonnage) est testée
sans appel réseau :

```bash
npm test
```

## Limites connues de cette étape

- L'API Meta Ad Library exige un mot-clé de recherche non vide : il n'y a
  pas de "tout afficher" pour un pays. On balaie donc une liste de
  mots-clés génériques (`src/config/searchTerms.ts`), à affiner selon ce
  qui remonte le plus de résultats pertinents.
- Pas encore de catégorisation produit automatique — c'est prévu à
  l'étape suivante (base de données).
- Pas encore d'exécution planifiée (cron / tâche nocturne) — ce script se
  lance pour l'instant à la main.
