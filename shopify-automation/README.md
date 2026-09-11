# Automatisation dropshipping — Shopify × CJ Dropshipping

Ce dossier contient **tout le moteur d'automatisation** d'une boutique Shopify
en dropshipping : import du produit, synchro stock/prix, transmission des
commandes au fournisseur, et mise à jour automatique du suivi colis côté client.

Il ne remplace pas Shopify (la boutique visible par tes clients reste Shopify) :
c'est le "cerveau" qui tourne en arrière-plan, hébergé gratuitement sur Netlify
(Functions + Blobs), et qui connecte Shopify et CJ Dropshipping entre eux.

Produit choisi et pourquoi : voir [`src/data/product-selection.md`](src/data/product-selection.md).

## Architecture

```
Client achète sur Shopify
        │  (webhook orders/create, signé)
        ▼
netlify/functions/order-webhook.js  ──►  CJ Dropshipping (créé la commande fournisseur)
        │
        ▼ (mapping stocké dans Netlify Blobs)

netlify/functions/sync-tracking.js   (cron horaire)
   CJ a un n° de suivi ? ──► crée le "fulfillment" Shopify ──► email de suivi auto au client

netlify/functions/sync-inventory.js  (cron toutes les 6h)
   relit stock + coût chez CJ ──► met à jour stock Shopify + recalcule le prix si besoin
```

## Ce que tu dois créer toi-même (obligatoire, je ne peux pas le faire à ta place)

### 1. Boutique Shopify
1. Crée un compte sur [shopify.com](https://www.shopify.com) (essai gratuit, puis
   abonnement payant nécessaire pour vendre réellement).
2. Dans l'admin : **Paramètres > Apps et canaux de vente > Développer des apps**
   → crée une app personnalisée → onglet **Configuration API** → coche les scopes :
   `read_products, write_products, read_inventory, write_inventory, read_orders, write_orders, read_fulfillments, write_fulfillments`.
3. Installe l'app → récupère le **token d'accès Admin API** (`shpat_...`).
4. **Paramètres > Notifications > Webhooks** (ou via l'API) → crée un webhook
   `orders/creation`, format JSON, URL = `https://<ton-site-netlify>.netlify.app/order-webhook`.
   Note le **secret webhook** affiché.

### 2. Compte fournisseur CJ Dropshipping
1. Crée un compte sur [cjdropshipping.com](https://cjdropshipping.com).
2. **My CJ > Authorization > Stores** → ajoute une boutique de type "API" → génère
   la clé API.
3. Cherche le produit décrit dans `src/data/product-selection.md`, valide le
   fournisseur (délais de livraison vers ta zone, avis, prix), note son **PID**.

### 3. Hébergement des fonctions (Netlify — gratuit pour ce volume)
1. Crée un compte sur [netlify.com](https://netlify.com), connecte ce repo GitHub.
2. **Site settings** → note le **Site ID**, et crée un **Personal access token**
   (User settings > Applications).
3. Renseigne toutes les variables d'environnement du site Netlify (Settings >
   Environment variables) à partir de `.env.example` — jamais commitées en dur.
4. Déploie (`Base directory` = `shopify-automation`, `Publish directory` = `public`,
   `Functions directory` = `netlify/functions`).

### 4. Paiements
Active un moyen de paiement dans Shopify (**Paramètres > Paiements**) : Shopify
Payments si disponible dans ton pays, sinon Stripe/PayPal. C'est le seul endroit
où passent réellement l'argent et tes informations bancaires — je n'y ai jamais accès.

## Une fois tout branché

```bash
cd shopify-automation
npm install
cp .env.example .env   # puis remplis toutes les valeurs
npm run import:product -- <PID_CJ_DU_PRODUIT>
```

Le produit est créé **en brouillon** dans Shopify. Relis la fiche (photos,
description orientée bénéfices), puis publie-la manuellement — c'est la seule
étape qui reste volontairement manuelle, pour éviter de publier un produit mal
présenté.

Après ça, tout est automatique : un client commande → CJ reçoit la commande →
dès qu'un n° de suivi existe, ton client reçoit l'email de suivi Shopify → le
stock/prix se resynchronisent seuls toutes les 6h.

## Sécurité

- **Vérification HMAC obligatoire** sur le webhook Shopify (`verifyShopifyWebhook.js`) :
  toute requête sans signature valide est rejetée (401), avant même de lire son contenu.
- **Corps brut vérifié avant parsing JSON** : on ne fait jamais confiance à un
  body déjà parsé, ce qui est l'erreur la plus fréquente qui rend la vérif inutile.
- **Idempotence** : chaque commande Shopify n'est transmise qu'une seule fois à
  CJ, même si Shopify renvoie le webhook plusieurs fois (retries), via Netlify Blobs.
- **Aucun secret en dur dans le code** : tout passe par des variables d'environnement,
  `.env` est dans `.gitignore`, seul `.env.example` (sans vraies valeurs) est versionné.
- **Aucune donnée de paiement ne transite par ce code** : Shopify/Stripe gèrent
  ça nativement, ce projet ne touche jamais un numéro de carte.
- **Principe du moindre privilège** : le token Shopify n'a que les scopes listés
  ci-dessus (pas d'accès clients, pas d'accès aux paramètres de la boutique).
- **Retry avec respect du rate-limit Shopify** (`shopifyClient.js`) plutôt que
  de spammer l'API en cas de 429.
- **Aucune donnée client stockée en dehors de ce qui est nécessaire** au mapping
  commande Shopify ↔ commande CJ (pas de duplication de base clients).

### À faire côté toi, régulièrement
- Renouvelle/rotate le token Shopify et la clé API CJ si tu suspectes une fuite.
- Active la 2FA sur ton compte Shopify, Netlify et CJ Dropshipping.
- Surveille les logs des fonctions Netlify pour repérer une activité anormale.
