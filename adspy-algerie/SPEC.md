# AdSpy Algérie — Spécification produit

## Le problème

Un e-commerçant algérien cherche en permanence "le produit qui marche" en
scrollant TikTok et Facebook, en devinant. Il met de l'argent en pub sur un
produit et, souvent, ça ne vend pas.

## La réponse qu'on apporte

Une seule question, une seule réponse : **qu'est-ce qui se vend en ce moment
en Algérie ?**

L'utilisateur se connecte et voit une liste de produits, chacun avec :
- la photo du produit,
- le prix en DA (quand il est visible dans la pub),
- la pub vidéo qui tourne,
- depuis combien de jours cette pub tourne sans interruption,
- un lien vers la page de vente du concurrent.

## Pourquoi "nombre de jours" est l'indicateur clé

Personne ne paie de la publicité pendant des semaines à perte. Une pub qui
tourne depuis 25 jours est très probablement une pub rentable pour son
annonceur. Ce chiffre est donc le tri principal de tout l'outil.

Cette donnée est publique : Meta (Facebook/Instagram) oblige toute publicité
active à apparaître dans sa bibliothèque publicitaire, consultable par pays.
On récupère cette donnée chaque jour, on la trie, on la présente proprement.
Personne ne le fait pour le marché algérien parce qu'il est trop petit pour
les outils internationaux.

## Les écrans, un par un

### Écran 0 — Recherche manuelle (validation, sans site)

Pas un écran du produit final : une vérification faite à la main dans la
bibliothèque publicitaire de Meta, filtrée sur l'Algérie, pour confirmer
qu'on trouve au moins 20 produits dont la pub tourne depuis plus de 15 jours
en deux heures de recherche. Si oui, on continue. Si non, on s'arrête avant
d'avoir perdu du temps.

### Écran 1 — Liste des produits (le cœur du produit)

Une page unique. Une liste de cartes produits, triée par défaut du plus
grand nombre de jours de diffusion au plus petit. Chaque carte affiche :
- la photo ou la vidéo de la pub,
- le nom de la page / de l'annonceur,
- le nombre de jours depuis le début de la diffusion,
- un badge catégorie (mode, maison, beauté, électronique, enfants, etc.),
- un bouton "voir la pub" qui ouvre la pub originale dans la bibliothèque
  Meta,
- un bouton "voir la page de vente" quand un lien de destination est connu.

Un filtre en haut de page permet de choisir une catégorie. Pas de compte,
pas de connexion, pas de décoration inutile à ce stade.

### Écran 2 — Liste d'attente (validation de la demande)

Avant de construire plus loin : une page très simple avec un champ email et
un bouton "être prévenu au lancement". Utilisée pour mesurer si des gens
sont réellement intéressés, via des publications sur TikTok qui montrent le
produit qui cartonne de la semaine.

### Écran 3 — Compte et abonnement (seulement si l'écran 2 confirme l'intérêt)

- Création de compte (email / mot de passe).
- Page d'abonnement : 2 500 DA / mois, paiement via Chargily.
- Sans abonnement actif, la liste de produits est visible en version limitée
  (par exemple les 5 premiers produits, le reste flouté) ; avec abonnement,
  accès complet et illimité.

## Ce que le produit n'est pas (pour l'instant)

- Pas de tableau de bord d'analytics avancé.
- Pas de recherche par mot-clé libre au lancement.
- Pas d'application mobile — un site web responsive suffit.
- Pas de support multi-pays — uniquement l'Algérie.

## Ordre de construction

1. Vérification manuelle (Écran 0) — fait à la main, hors code.
2. Le collecteur : un script qui récupère chaque jour les pubs algériennes
   et les range dans une base de données. Aucune interface.
3. La base de données (Supabase / Postgres) : pub, annonceur, date de
   première diffusion, produit, lien.
4. L'écran 1 (liste des produits, triée, filtrable).
5. L'écran 2 (liste d'attente) et la promotion sur TikTok.
6. Si et seulement si l'écran 2 confirme l'intérêt : écran 3 (comptes,
   paiement Chargily).

Chaque étape est validée avant de passer à la suivante.
