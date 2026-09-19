# CLAUDE.md — AdSpy Algérie

Ce fichier donne le contexte technique du projet. Le fichier `SPEC.md`
décrit le produit ; ce fichier décrit comment on le construit.

## Stack

- **TypeScript** partout (scripts et application).
- **Next.js** pour l'application web (écrans 1, 2, 3), introduit seulement
  à partir de l'étape "écran 1" — pas avant.
- **Supabase** (Postgres managé) pour le stockage des pubs, annonceurs et
  utilisateurs.
- **Chargily** pour le paiement en ligne (DZD), uniquement à l'étape compte
  / abonnement.

## Règle n°1 : jamais coder avant d'avoir proposé un plan

Avant toute implémentation, décrire en quelques lignes ce qui va être fait,
quels fichiers vont être créés ou modifiés, et attendre la validation
(implicite ou explicite) avant d'écrire du code.

## Règle n°2 : une seule étape à la fois

Ne jamais construire plusieurs étapes de `SPEC.md` dans la même session.
Implémenter l'étape demandée, s'assurer qu'elle fonctionne seule, puis
s'arrêter.

## Règle n°3 : pas de contournement des protections de Meta

La donnée de la bibliothèque publicitaire est récupérée uniquement via
l'API officielle Meta Ad Library (`ads_archive`), avec un token d'accès
obtenu légitimement. Jamais de scraping qui imite un navigateur pour
contourner un blocage anti-bot : c'est le point le plus fragile du projet
(risque de blocage du compte, de l'IP, ou juridique) et il doit rester
propre.

## Règle n°4 : les données publiques d'abord, l'interface après

Le collecteur (étape 2 de `SPEC.md`) doit fonctionner et produire des
résultats corrects avant qu'une seule ligne d'interface ne soit écrite.

## Organisation du dossier

```
adspy-algerie/
  SPEC.md              # ce que fait le produit
  CLAUDE.md            # ce fichier
  README.md            # comment lancer le collecteur en local
  scripts/
    collect-ads.ts     # point d'entrée du collecteur (étape 2)
  src/
    lib/
      metaAdLibrary.ts  # client de l'API Meta Ad Library
      adAnalysis.ts     # calcul du nombre de jours, tri, formatage
      adAnalysis.test.ts
    config/
      searchTerms.ts    # mots-clés par défaut pour la recherche
```

Le dossier `app/` (Next.js) sera ajouté seulement à l'étape "écran 1" de
`SPEC.md`.
