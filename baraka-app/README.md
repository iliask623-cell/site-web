# Baraka 🧺🇩🇿

**Sauve un panier, garde la Baraka.**

Baraka est une application anti-gaspillage alimentaire pensée pour l'Algérie, inspirée
de concepts comme Too Good To Go, mais adaptée aux usages locaux : découverte par
wilaya/commune, paiement au retrait (espèces ou CIB/Edahabia), contact direct via
WhatsApp, et paniers spéciaux Ramadan (f'tour).

C'est une **PWA (Progressive Web App)** : installable sur l'écran d'accueil (Android,
iOS, desktop) sans passer par le Google Play Store ou l'App Store, fonctionne
partiellement hors-ligne, et se met à jour automatiquement.

## Fonctionnalités

**Côté client**
- Parcourir les paniers surprise disponibles, filtrés par wilaya et recherche
- Voir le détail d'un panier (prix normal/réduit, créneau de retrait, adresse)
- Réserver un panier (sans paiement en ligne) et obtenir un code de retrait
- Contacter le commerçant sur WhatsApp ou par téléphone
- Gérer ses réservations (voir le code, annuler)

**Côté commerçant**
- Créer son commerce (nom, catégorie, wilaya/commune, adresse, WhatsApp)
- Publier des paniers surprise (prix, quantité, créneau de retrait, option "panier f'tour")
- Voir les réservations à honorer et les marquer comme récupérées / non présentées

**Transverse**
- 🇫🇷 Français / 🇩🇿 Arabe (avec mise en page RTL) / 🇬🇧 Anglais
- Devise DZD native (DA / دج)
- Installable comme une app (PWA), icônes et manifeste inclus

## Stack technique

- [Vite](https://vite.dev/) + [React](https://react.dev/) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/)
- [react-router-dom](https://reactrouter.com/) pour le routing
- [react-i18next](https://react.i18next.com/) pour les traductions FR/AR/EN
- [Supabase](https://supabase.com/) (Postgres + Auth) comme backend
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) pour le manifeste et le service worker

## Démarrage rapide (mode démo)

Sans aucune configuration, l'app tourne en **mode démo** : les données (commerces,
paniers, réservations) sont générées en mémoire et persistées dans le `localStorage`
du navigateur. Idéal pour tester l'UX immédiatement.

```bash
cd baraka-app
npm install
npm run dev
```

Ouvre <http://localhost:5173>. Un bandeau "Application de démonstration" s'affiche
tant qu'aucun backend réel n'est connecté.

## Passer en production avec un vrai backend (Supabase)

1. Crée un projet gratuit sur [app.supabase.com](https://app.supabase.com).
2. Dans l'éditeur SQL du projet, exécute le contenu de [`supabase/schema.sql`](./supabase/schema.sql).
   Cela crée les tables (`profiles`, `businesses`, `baskets`, `reservations`), les
   règles de sécurité (Row Level Security) et les triggers qui gèrent
   automatiquement les quantités disponibles.
3. Dans **Authentication > Providers**, l'authentification par e-mail/mot de passe
   est activée par défaut. Pour les tests, tu peux désactiver la confirmation par
   e-mail dans **Authentication > Settings** (sinon les comptes créés doivent
   confirmer leur e-mail avant de pouvoir se connecter).
4. Copie `.env.example` vers `.env.local` et renseigne `VITE_SUPABASE_URL` et
   `VITE_SUPABASE_ANON_KEY` (trouvables dans **Project Settings > API**).
5. Relance `npm run dev` — l'app bascule automatiquement sur Supabase, le bandeau
   "démo" disparaît.

## Build & déploiement

```bash
npm run build   # génère le dossier dist/, prêt à héberger (Netlify, Vercel, etc.)
npm run preview # prévisualiser le build en local
```

Le build inclut le manifeste PWA et le service worker. Une fois déployée en HTTPS,
l'app propose "Ajouter à l'écran d'accueil" sur mobile.

## Structure du projet

```
src/
  components/     UI réutilisable (Header, BasketCard, ProtectedRoute...)
  context/        AuthContext (session utilisateur)
  i18n/           Config i18next + traductions fr/ar/en
  lib/            Types, client Supabase, données mock, wilayas, devise
  pages/          Pages de l'app (Landing, Explore, BasketDetail...)
  pages/merchant/ Tableau de bord commerçant
supabase/
  schema.sql      Schéma Postgres + RLS + triggers
```

## Pistes d'amélioration (roadmap Algérie)

- **App mobile native** (React Native/Expo) pour Google Play & App Store, une fois
  le concept validé avec la PWA
- **Paiement en ligne CIB/Edahabia** via une passerelle SATIM agréée, en complément
  du paiement au retrait
- **OTP par SMS ou WhatsApp** pour l'inscription (plus adapté que l'e-mail pour une
  partie des utilisateurs)
- **Notifications push** (nouveaux paniers près de chez toi, rappel de retrait)
- **Mode Ramadan automatique** : mise en avant programmée des paniers f'tour selon
  le calendrier hégirien
- **Espace administrateur** pour valider les commerçants et modérer les annonces
- **Avis et notation** des commerces pour renforcer la confiance
