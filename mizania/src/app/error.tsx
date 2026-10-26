"use client";

import { buttonClass } from "@/components/ui/button";

/** Erreur inattendue : message simple, jamais de détail technique affiché. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-semibold">Un problème est survenu.</h1>
      <p className="mt-2 text-ink-500">Vos données n’ont pas été modifiées par cette erreur. Réessayez ; si le problème persiste, revenez dans quelques minutes.</p>
      <div className="mt-6 flex gap-3">
        <button onClick={reset} className={buttonClass("primary")}>
          Réessayer
        </button>
        <a href="/app" className={buttonClass("secondary")}>
          Mon espace
        </a>
      </div>
    </main>
  );
}
