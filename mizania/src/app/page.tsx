import { Logo } from "@/components/brand/logo";

/**
 * Page d'accueil provisoire (Phase 1–2). La landing page complète est prévue
 * en Phase 4 ; aucune fonctionnalité n'est annoncée ici comme disponible.
 */
export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-8 px-5 py-16">
      <Logo />
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold leading-tight text-ink-900 sm:text-4xl">
          Le copilote financier et comptable des entrepreneurs algériens.
        </h1>
        <p className="text-lg text-ink-700">
          MIZANIA vous aidera à mieux comprendre et gérer votre activité : recettes, dépenses, factures,
          trésorerie, et comptabilité selon le Système Comptable Financier (SCF) algérien.
        </p>
      </div>
      <p className="rounded-xl border border-accent-500/40 bg-accent-100 px-4 py-3 text-sm text-accent-700">
        Application en cours de développement — les inscriptions ne sont pas encore ouvertes.
      </p>
      <p className="text-xs text-ink-500">
        MIZANIA est un outil d’assistance. Il ne remplace pas un expert-comptable ni les sources officielles.
      </p>
    </main>
  );
}
