import Link from "next/link";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-medium text-brand-700">Page introuvable</p>
      <h1 className="mt-2 text-2xl font-semibold">Cette page n’existe pas ou plus.</h1>
      <p className="mt-2 text-ink-500">Le lien est peut-être incorrect, ou l’élément a été supprimé.</p>
      <Link href="/app" className={buttonClass("primary", "md", "mt-6")}>
        Retour à mon espace
      </Link>
    </main>
  );
}
