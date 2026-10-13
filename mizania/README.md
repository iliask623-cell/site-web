# MIZANIA

**Le copilote financier et comptable des entrepreneurs algériens.**

MIZANIA aide les entrepreneurs, freelances, commerçants et petites entreprises en Algérie à suivre
leurs recettes, dépenses, factures et trésorerie, et à comprendre leur comptabilité selon le
**SCF (Système Comptable Financier algérien)**. MIZANIA est un outil d'assistance : il ne remplace
pas un expert-comptable, un commissaire aux comptes ni les sources officielles.

> ⚖️ Textes, règles à vérifier, données personnelles : [`docs/CONFORMITE.md`](docs/CONFORMITE.md)
> 📐 Architecture, modèle de données, plan de développement et tests : [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

## État d'avancement

| Phase | Contenu | Statut |
|---|---|---|
| 1 | Architecture, squelette, outillage, module monétaire, identité visuelle de base | ✅ testée |
| 2 | Base de données : identité, organisations, contacts, catégories, recettes/dépenses, isolation RLS | ✅ testée |
| 2 bis | Référentiel réglementaire versionné (sources, taxes, règles fiscales, mentions de facture), résolveur fiscal sans valeur par défaut | ✅ testée |
| 3 → 10 | Authentification, dashboard, CRUD, facturation, moteur SCF, IA, exports… | ⏳ à venir |

Rien de ce qui n'est pas marqué ✅ n'est disponible dans l'application.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript strict · Tailwind CSS 4 · PostgreSQL 16 ·
Drizzle ORM · Zod · Vitest. Justification des choix : `docs/ARCHITECTURE.md` §2.

## Prérequis

- Node.js ≥ 20.9 (22 recommandé)
- PostgreSQL ≥ 15

## Installation locale

```bash
cd mizania
npm install
cp .env.example .env.local   # puis adapter DATABASE_URL
```

### Base de données

L'application doit se connecter avec un rôle **sans `SUPERUSER` ni `BYPASSRLS`** : l'isolation
entre organisations repose aussi sur la Row-Level Security de PostgreSQL, que ces rôles contournent.

```bash
# En tant qu'administrateur PostgreSQL :
psql -U postgres -c "CREATE ROLE mizania LOGIN PASSWORD 'mizania';"
psql -U postgres -c "CREATE DATABASE mizania OWNER mizania;"
psql -U postgres -c "CREATE DATABASE mizania_test OWNER mizania;"

# Puis :
npm run db:migrate        # base de développement (.env.local)
npm run db:migrate:test   # base de test (.env.test)
npm run db:seed-reference # sources, taxes et mentions de facture — toutes « à vérifier »
```

> L'extension `btree_gist` est créée par les migrations (contrainte anti-chevauchement des règles
> fiscales). Elle est disponible sur PostgreSQL standard, Neon et Supabase.

### Migrations

- Le schéma est défini dans `src/server/db/schema/`.
- Après modification : `npm run db:generate -- --name <description>` puis relire le SQL généré dans `drizzle/`.
- Les politiques RLS sont générées depuis le schéma ; le `FORCE ROW LEVEL SECURITY` est dans une
  migration manuelle (`drizzle/0001_force_rls.sql`). **Toute nouvelle table portant
  `organization_id` doit y être ajoutée** — un test d'intégration échoue sinon.

### Lancer l'application

```bash
npm run dev     # http://localhost:3000
```

## Variables d'environnement

| Variable | Obligatoire | Rôle |
|---|---|---|
| `DATABASE_URL` | oui | Connexion PostgreSQL (rôle soumis à la RLS) |
| `APP_URL` | non (défaut `http://localhost:3000`) | URL publique (liens envoyés par email) |
| `AI_PROVIDER` | non | `anthropic` pour activer MIZANIA AI ; vide = assistant désactivé |
| `ANTHROPIC_API_KEY` | si `AI_PROVIDER=anthropic` | Clé API, **côté serveur uniquement** |
| `AI_MODEL` | non | Modèle IA utilisé |

Aucune variable n'a le préfixe `NEXT_PUBLIC_` : rien n'est exposé au navigateur.
Ne jamais committer `.env.local`. `.env.test` ne contient que l'adresse de la base de test locale.

## Tests

```bash
npm test             # unitaires + intégration (base mizania_test, vidée à chaque test)
npm run lint
npm run typecheck
npm run build
npm run check        # lint + typecheck + tests
```

Les tests d'intégration tournent contre un vrai PostgreSQL. Ils vérifient notamment qu'une
organisation ne peut jamais lire, créer, modifier ou supprimer les données d'une autre, même si une
requête oublie son filtre. La CI (`.github/workflows/mizania-ci.yml`) exécute tout cela à chaque push.

## Structure

```
mizania/
├─ docs/ARCHITECTURE.md     architecture et plan
├─ drizzle/                 migrations SQL
├─ scripts/migrate.ts       application des migrations
├─ src/app/                 pages (App Router)
├─ src/components/          composants UI et identité visuelle
├─ src/lib/                 code pur partagé (ex. money.ts : montants en centimes)
├─ src/server/              code serveur uniquement (env, db, auth, services, SCF, fiscalité, IA)
└─ tests/                   unitaires et intégration
```

## Montants

Tous les montants sont stockés et calculés en **centimes de dinar entiers** (`bigint` en base,
entiers sûrs en TypeScript). Voir `src/lib/money.ts` : saisie (« 120 000,50 »), formatage
(« 120 000,50 DA »), pourcentages en points de base, quantités en millièmes, arrondi documenté.

## Déploiement (MVP)

Documentation détaillée ajoutée lorsque l'authentification sera en place (Phase 3). Grandes lignes :

1. Créer une base PostgreSQL managée (ex. Neon, Supabase) et un rôle applicatif sans `BYPASSRLS`.
2. Créer le projet sur l'hébergeur (ex. Vercel, avec `mizania` comme dossier racine) ou un VPS.
3. Renseigner les variables d'environnement ci-dessus.
4. Lancer `npm run db:migrate` avec la `DATABASE_URL` de production.
5. Vérifier que la CI est verte, puis déployer.

⚠️ L'offre gratuite Vercel est réservée à un usage non commercial. ⚠️ Les obligations de la loi
algérienne n° 18-07 sur la protection des données personnelles sont à faire vérifier avant
l'ouverture au public.
