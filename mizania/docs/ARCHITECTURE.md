# MIZANIA — Architecture

> Document de référence technique. Il décrit ce qui est **construit** et ce qui est **prévu**.
> Chaque section indique son statut : ✅ fait · 🟡 en cours · ⏳ prévu.

---

## 1. Architecture proposée

MIZANIA est une **application web monolithique modulaire** (un seul déploiement, des modules bien séparés), rendue côté serveur.

```
Navigateur (mobile-first)
   │  HTML rendu serveur + petites îles React interactives
   ▼
Next.js (App Router)  ─────────────────────────────────────────────
   │  Pages / Server Components  →  lecture des données
   │  Server Actions             →  mutations (formulaires)
   │  Route Handlers /api/*      →  exports, IA (streaming), webhooks
   ▼
Couche "server/" (jamais importable côté client : `import "server-only"`)
   ├─ auth/        sessions, mots de passe, reset, rate limit
   ├─ services/    logique métier (recettes, factures, écritures, …)
   ├─ accounting/  moteur SCF (comptes, journaux, grand livre, balance)
   ├─ tax/         couche fiscale versionnée (séparée du SCF)
   ├─ ai/          abstraction AIProvider + outils de lecture de données
   └─ db/          Drizzle ORM + schéma + accès scoping par organisation
   ▼
PostgreSQL 16  (Row-Level Security par organisation, en défense en profondeur)
```

Principes :

1. **Le serveur est la seule source de vérité.** Tous les montants, totaux, soldes, balances sont calculés côté serveur, en entiers (centimes), à partir des données en base. Les valeurs envoyées par le navigateur sont revalidées.
2. **Isolation des données à deux niveaux** : (a) chaque requête métier passe par un contexte `{ userId, organizationId }` vérifié ; (b) PostgreSQL applique des politiques RLS forcées sur toutes les tables métier — même une requête qui oublierait son filtre ne voit rien d'une autre organisation.
3. **Deux couches réglementaires distinctes** : *Comptabilité (SCF)* et *Fiscalité*. Une règle fiscale n'est jamais stockée ni affichée comme une règle SCF.
4. **Anti-hallucination by design** : aucun compte SCF, taux, seuil ou mention légale n'est codé en dur dans la logique. Ils vivent dans des tables versionnées, avec source et statut de vérification. Une donnée non vérifiée est affichée comme telle.
5. **Pas de fausse fonctionnalité** : un écran non terminé n'apparaît pas dans la navigation, ou apparaît explicitement marqué « bientôt disponible ».

---

## 2. Stack choisie et justification

| Besoin | Choix | Pourquoi |
|---|---|---|
| Framework | **Next.js 15.5 (App Router) + React 19** | Rendu serveur (rapide sur mobile/réseau lent), Server Actions = moins d'API à sécuriser à la main, un seul déploiement. Version 15.5 retenue plutôt que 16 : plus mature, écosystème stable. |
| Langage | **TypeScript strict** | Typage de bout en bout (schéma DB → services → UI). |
| Style | **Tailwind CSS 4** + composants maison | Pas de librairie UI lourde ; design system léger et cohérent. |
| Base de données | **PostgreSQL 16** | Relationnel, transactions ACID (indispensable en comptabilité), RLS, `bigint` pour les montants. Hébergeable partout (Neon, Supabase, VPS…). |
| ORM / migrations | **Drizzle ORM + drizzle-kit** | SQL explicite et typé, migrations SQL lisibles et versionnées, aucun moteur binaire, léger. |
| Auth | **Maison, minimale et auditée** : sessions en base, Argon2id (`@node-rs/argon2`) | Pas de dépendance à un fournisseur d'identité, données en Postgres avec le reste, contrôle total (rate limit, reset). Les sessions en base sont révocables immédiatement (≠ JWT). |
| Validation | **Zod 4** | Validation serveur de chaque entrée (formulaires, API, réponses IA structurées). |
| IA | **Interface `AIProvider`** ; premier adaptateur : Claude (API Anthropic) | Remplaçable sans toucher au reste ; clé uniquement côté serveur. |
| Tests | **Vitest** (unitaires + intégration sur vraie base Postgres de test) ; Playwright pour l'E2E plus tard | Rapide, compatible TS/ESM. Les tests d'intégration tournent contre PostgreSQL réel (pas de mock de la base pour la logique financière). |
| PDF | Génération serveur (`@react-pdf/renderer` ou `pdf-lib`) — décidé en Phase 7 | Le PDF doit être produit côté serveur, identique à l'aperçu. |

**Pourquoi pas Supabase (Auth + client direct) ?** Supabase reste possible *comme hébergeur Postgres*. Mais utiliser son client directement depuis le navigateur ferait reposer toute la sécurité financière sur les seules politiques RLS et lierait l'application à un fournisseur. Ici, le navigateur ne parle jamais à la base ; il parle au serveur Next.js, qui valide, puis la base applique en plus la RLS.

**Déploiement MVP recommandé** (détails dans le README) :
- Option A (la plus simple) : Vercel (app) + Neon ou Supabase (Postgres managé, offre gratuite pour démarrer). ⚠️ L'offre gratuite Vercel « Hobby » est réservée à un usage non commercial : passer en Pro dès l'ouverture commerciale.
- Option B (coût maîtrisé, contrôle total) : un VPS (Docker : app Next.js `standalone` + Postgres + sauvegardes).
- ⚠️ **À vérifier avec un juriste** : les exigences de la loi algérienne n° 18-07 relative à la protection des données personnelles (déclaration/autorisation, localisation éventuelle des données) avant l'ouverture au public. Ce point peut orienter le choix d'hébergement.

---

## 3. Arborescence du projet

```
mizania/
├─ docs/
│  └─ ARCHITECTURE.md          ← ce document
├─ drizzle/                    ← migrations SQL générées + migrations SQL manuelles (RLS)
├─ public/                     ← logo, favicon, manifest
├─ scripts/                    ← migrate.ts, seed-demo.ts, …
├─ src/
│  ├─ app/
│  │  ├─ (marketing)/          ← landing, FAQ, avertissement, confidentialité
│  │  ├─ (auth)/               ← connexion, inscription, mot de passe oublié/reset
│  │  ├─ (app)/app/            ← espace connecté (layout avec navigation)
│  │  │   ├─ page.tsx          ← tableau de bord
│  │  │   ├─ recettes/ depenses/ clients/ fournisseurs/
│  │  │   ├─ factures/ tresorerie/ ia/ comptabilite/ documents/ exports/
│  │  │   └─ parametres/
│  │  ├─ admin/                ← administration (rôle admin)
│  │  └─ api/                  ← route handlers (IA streaming, exports, PDF)
│  ├─ components/
│  │  ├─ ui/                   ← boutons, champs, cartes, tableaux, badges…
│  │  └─ brand/                ← logo
│  ├─ lib/                     ← code pur, partagé et testable (money, dates, formats)
│  └─ server/                  ← "server-only"
│     ├─ db/                   ← client, schéma (par domaine), contexte org
│     ├─ auth/
│     ├─ services/
│     ├─ accounting/
│     ├─ tax/
│     └─ ai/
└─ tests/
   ├─ unit/
   └─ integration/             ← contre une vraie base `mizania_test`
```

---

## 4. Schéma de base de données

Conventions : clés `uuid` ; horodatages `timestamptz` ; **montants en `bigint` exprimés en centimes de dinar** (1 DA = 100 centimes) — aucun `float` ; toutes les tables métier portent `organization_id` (RLS).

### Identité & accès
| Table | Rôle | Colonnes clés |
|---|---|---|
| `users` | Comptes utilisateurs | email (unique, normalisé), password_hash (Argon2id), full_name, locale (fr/ar), is_platform_admin |
| `sessions` | Sessions serveur | token_hash (SHA-256, jamais le token brut), user_id, active_organization_id, expires_at, last_seen_at |
| `password_reset_tokens` | Réinitialisation | token_hash, user_id, expires_at, used_at |
| `auth_rate_limits` | Limitation des tentatives | key (ex. `login:email`, `login:ip`), window_start, count |
| `organizations` | L'« activité » de l'entrepreneur | name, legal_form, activity_type, sector, wilaya, NIF/NIS/RC/AI (facultatifs), fiscal_year_start_month, **is_demo**, onboarding_completed_at |
| `memberships` | Lien utilisateur ↔ organisation | role (`owner`, `member`, `accountant` — prêt pour le comptable invité) |

### Gestion courante
| Table | Rôle |
|---|---|
| `contacts` | Clients et fournisseurs (`kind` = client / supplier), coordonnées, identifiants fiscaux facultatifs |
| `categories` | Catégories de recettes/dépenses (par organisation) |
| `transactions` | Recettes et dépenses (`direction` = income / expense), montant, date, contact, catégorie, moyen de paiement, statut, facture liée, description |
| `invoices` / `invoice_lines` | Factures (numéro unique par organisation, statut, dates, totaux calculés serveur) et lignes (quantité en millièmes, prix unitaire en centimes, remise, taux de taxe référencé) |
| `documents` | Justificatifs (métadonnées ; fichier dans un stockage objet privé) liés à transaction/facture |

### Référentiels versionnés (globaux, lecture seule pour les utilisateurs)
| Table | Rôle |
|---|---|
| `official_sources` | Sources : émetteur (DGI, MF, JORADP…), titre, référence, date, URL, date de dernière vérification |
| `scf_accounts` | Nomenclature SCF : numéro, intitulé, classe, parent, nature, description, exemples, **version du référentiel**, source, **statut de vérification**, date de vérification |
| `tax_rules` | Règles fiscales : code, libellé, valeur (taux en points de base, seuil en centimes…), **valid_from / valid_to**, année, source, version, statut (`draft`, `to_verify`, `verified`, `retired`) |

### Comptabilité (couche SCF)
| Table | Rôle |
|---|---|
| `journals` | Journaux par organisation : achats, ventes, banque, caisse, opérations diverses |
| `journal_entries` | Écritures : date, journal, libellé, statut (`draft` / `posted`), origine (`manual`, `ai_suggestion`, `invoice`, `transaction`), validée par / à |
| `journal_entry_lines` | Lignes : compte SCF, débit **ou** crédit (centimes, ≥ 0, jamais les deux), libellé |

Le **grand livre** et la **balance** ne sont pas des tables : ce sont des requêtes d'agrégation sur les lignes d'écritures *validées*. Elles ne peuvent donc pas diverger des écritures.

### IA & audit
| Table | Rôle |
|---|---|
| `ai_conversations` / `ai_messages` | Historique par organisation ; chaque réponse conserve les outils appelés et les sources citées |
| `audit_log` | Qui a fait quoi, quand (sans données sensibles en clair) |

Les tables marquées « prévu » sont ajoutées dans la phase qui les utilise, pour ne jamais avoir de schéma non testé.

---

## 5. Principales routes

**Pages publiques** : `/` (landing) · `/avertissement` · `/confidentialite` · `/connexion` · `/inscription` · `/mot-de-passe-oublie` · `/reinitialiser/[token]`

**Espace connecté** (`/app/...`, protégé) :
`/app` (dashboard) · `/app/onboarding` · `/app/recettes` · `/app/depenses` · `/app/clients` · `/app/fournisseurs` · `/app/factures` (+ `/nouvelle`, `/[id]`, `/[id]/apercu`) · `/app/tresorerie` · `/app/ia` · `/app/comptabilite/{ecritures,journaux,grand-livre,balance,comptes}` · `/app/simulateurs` · `/app/documents` · `/app/exports` · `/app/apprendre` · `/app/parametres`

**Administration** : `/admin` (utilisateurs, sources, référentiel SCF, règles fiscales, contenus, erreurs).

**API (route handlers)** — uniquement là où un formulaire ne suffit pas :
- `POST /api/ai/chat` — conversation IA (streaming), authentifiée, limitée en débit
- `POST /api/ai/journal-suggestion` — proposition d'écriture (jamais enregistrée automatiquement)
- `GET /api/invoices/[id]/pdf` — PDF de facture
- `GET /api/exports/[type]?format=csv|xlsx|pdf` — exports « dossier comptable »

Toutes les mutations métier passent par des **Server Actions** qui : (1) vérifient la session, (2) résolvent l'organisation active et le rôle, (3) valident avec Zod, (4) exécutent dans une transaction avec le contexte RLS.

---

## 6. Authentification

- **Inscription** : email + mot de passe (≥ 10 caractères), hash **Argon2id**. Email normalisé (minuscules, trim).
- **Session** : token aléatoire 256 bits envoyé en cookie `HttpOnly`, `Secure` (prod), `SameSite=Lax`, chemin `/`. En base, seul le **SHA-256 du token** est stocké → une fuite de la base ne donne pas de sessions valides. Expiration glissante 30 jours, renouvelée au plus une fois par jour.
- **Déconnexion** : suppression de la ligne de session (révocation immédiate). « Se déconnecter partout » = suppression de toutes les sessions de l'utilisateur.
- **Mot de passe oublié** : token à usage unique, haché en base, valable 30 minutes ; réponse identique que l'email existe ou non (pas d'énumération de comptes). Envoi via une interface `Mailer` (console en dev, fournisseur SMTP/API en prod).
- **Rate limiting** : stocké en base (fonctionne en serverless), par email et par IP, sur connexion, inscription et reset.
- **CSRF** : Server Actions protégées par la vérification d'origine de Next.js ; les route handlers mutants vérifient l'en-tête `Origin`.
- **Autorisation** : `requireUser()` puis `requireOrg()` dans chaque page/action ; le rôle de `memberships` détermine les droits.

---

## 7. Architecture du moteur SCF

```
             ┌───────────────────────┐
 Opération ─►│  Proposition (IA ou   │──► Écriture BROUILLON ──► Revue utilisateur ──► VALIDATION
             │  règle déterministe)  │       (modifiable)          (modifie/valide)        │
             └───────────────────────┘                                                   ▼
                                                          Contrôles serveur : Σdébit = Σcrédit,
                                                          comptes existants & actifs dans la
                                                          version SCF, montants > 0, période ouverte
                                                                                         ▼
                                                    Écriture VALIDÉE (immuable ; correction = contre-passation)
                                                                                         ▼
                                                    Grand livre / Balance / États = agrégations SQL
```

- **Référentiel** : `scf_accounts` versionné (`framework_version`), chaque compte avec source et statut de vérification. Recherche par numéro, intitulé, mot-clé et exemples d'opérations (index `pg_trgm`).
- **Jamais de compte inventé** : une proposition (IA comprise) ne peut référencer qu'un compte **présent** dans la table. Si aucun compte fiable n'est trouvé, la réponse est : *« Information insuffisante pour confirmer le compte SCF approprié. Vérification recommandée. »*
- **Le contenu du référentiel** n'est importé qu'à partir du texte officiel (Arrêté du 26 juillet 2008 fixant notamment la nomenclature et les règles de fonctionnement des comptes, publié au Journal officiel). Tant qu'un compte n'a pas été vérifié contre ce texte par un humain, il porte le statut `to_verify` et l'interface l'affiche. **Action requise de votre part** : fournir (ou valider) une copie fiable de la nomenclature ; l'outil d'import est prévu en Phase 8.
- **Validation = action humaine explicite.** Une écriture proposée par l'IA est enregistrée en brouillon uniquement si l'utilisateur la sauvegarde, et validée uniquement s'il clique « Valider ».
- **Couche fiscale séparée** (`server/tax`) : taux et seuils lus dans `tax_rules` à la **date de l'opération** (`valid_from ≤ date < valid_to`). Si aucune règle vérifiée n'existe, le calcul fiscal est marqué « non déterminé — à vérifier » au lieu d'utiliser une valeur par défaut.

---

## 8. Architecture de l'IA

```
UI (chat) ─► /api/ai/chat ─► AiService ─► AIProvider (interface)
                                │              ├─ AnthropicProvider (Claude)
                                │              └─ autres adaptateurs futurs
                                ▼
                     Outils en lecture seule, scoppés à l'organisation :
                     get_financial_summary(période) · list_unpaid_invoices()
                     list_transactions(filtres) · search_scf_accounts(q)
                     get_tax_rule(code, date) · search_sources(q)
```

- **Clés API uniquement côté serveur** (variables d'environnement, jamais `NEXT_PUBLIC_`).
- **Les chiffres viennent des outils, pas du modèle.** Le prompt système impose : n'utiliser que les valeurs renvoyées par les outils ; si une donnée manque, le dire. Les montants retournés par les outils sont déjà formatés en DA par le serveur.
- **Sources** : les outils réglementaires renvoient la source (titre, référence, date, lien, date de vérification) ; l'interface les affiche sous la réponse. Pas de source → mention « à vérifier ».
- **Structure des analyses** : FAIT / OBSERVATION / INTERPRÉTATION / RECOMMANDATION (sortie structurée validée par Zod).
- **Langues** : français par défaut, arabe sur demande ou selon la préférence du profil.
- **Coût & abus** : limitation par utilisateur/jour, taille de contexte bornée, journalisation sans contenu financier en clair.
- **Si aucune clé n'est configurée**, l'assistant affiche « Assistant IA non configuré » — jamais une fausse conversation.

---

## 9. Plan de développement par étapes

| Phase | Contenu | Statut |
|---|---|---|
| 1 | Analyse, architecture, squelette du projet, outils (lint, typecheck, tests), module monétaire, configuration validée, identité visuelle de base | ✅ |
| 2 | Base de données : schéma identité + organisations + contacts + transactions + catégories, migrations, RLS forcée, contexte d'organisation | ✅ |
| 3 | Authentification : inscription, connexion, déconnexion, mot de passe oublié/reset, profil, rate limit ; onboarding de l'activité | ⏳ |
| 4 | Landing page, avertissement, layout de l'espace connecté, dashboard (données réelles + états vides) | ⏳ |
| 5 | Recettes / dépenses (CRUD, recherche, filtres, tri, pagination) | ⏳ |
| 6 | Clients / fournisseurs (fiche, historique, solde) | ⏳ |
| 7 | Facturation (numérotation, calculs serveur, statuts, aperçu, PDF) + trésorerie | ⏳ |
| 8 | Moteur SCF : référentiel + import sourcé, journaux, écritures, grand livre, balance ; sources officielles ; couche fiscale versionnée | ⏳ |
| 9 | MIZANIA AI : provider, outils, chat, proposition d'écriture, analyse d'activité | ⏳ |
| 10 | Exports (CSV/Excel/PDF), alertes, simulateurs, documents, données de démo, admin | ⏳ |

---

## 10. Tests prévus par étape

| Phase | Tests automatisés | Vérifications manuelles |
|---|---|---|
| 1 | Module monétaire (parsing « 120 000,50 », arrondis, sommes, pourcentages en points de base, formatage DA) ; validation de configuration | `lint`, `typecheck`, `build` réussis |
| 2 | Migrations appliquées sur base vierge ; contraintes (montants ≥ 0, enum) ; **RLS : une organisation ne lit/modifie jamais les données d'une autre**, même sans filtre ; sans contexte → aucune ligne | Inspection du schéma en base |
| 3 | Hash/vérif mot de passe ; création/expiration/révocation de session ; token de session stocké haché ; reset à usage unique et expirant ; rate limit ; non-énumération des comptes | Parcours complet mobile/desktop, déconnexion/reconnexion |
| 4 | Agrégats du dashboard sur jeux de données connus ; état vide | Responsive (360 px → écran large) |
| 5–6 | CRUD + validation serveur + permissions inter-organisations ; pagination ; recherche | Formulaires au doigt sur mobile |
| 7 | Calcul facture (quantités, remises, taxes, arrondis) ; numérotation unique concurrente ; transitions de statut ; PDF généré non vide | Aperçu = PDF |
| 8 | Écriture déséquilibrée refusée ; compte inexistant refusé ; écriture validée immuable ; grand livre & balance équilibrés ; règle fiscale choisie selon la date | Comparaison balance ↔ écritures |
| 9 | Provider mocké : outils scoppés, refus d'inventer un compte, chiffres = chiffres de la base ; IA non configurée → message clair | Questions réelles FR/AR |
| 10 | Exports : contenu = données en base ; démo isolée du réel | Ouverture des fichiers dans Excel/LibreOffice |

---

## Informations manquantes (à fournir — je ne les invente pas)

1. **Nomenclature SCF officielle** (texte de l'arrêté du 26 juillet 2008 / JO) à importer et à faire vérifier.
2. **Mentions obligatoires des factures** en Algérie (texte de référence à jour : Code des procédures fiscales / textes DGI applicables).
3. **Taux et seuils fiscaux** en vigueur (TVA, IFU, IBS/IRG, etc.) avec leurs textes sources et dates d'effet — à saisir dans `tax_rules` via l'administration.
4. **Hébergement & conformité** : exigences effectives de la loi 18-07 pour votre cas.
5. **Fournisseur d'email** transactionnel pour la réinitialisation de mot de passe en production.
6. **Clé API IA** (côté serveur) pour activer MIZANIA AI.
