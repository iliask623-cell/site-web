import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { buttonClass } from "@/components/ui/button";
import { getSession } from "@/server/auth/request";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" aria-label="Accueil MIZANIA">
            <Logo />
          </Link>
          <nav className="flex items-center gap-2">
            {session ? (
              <Link href="/app" className={buttonClass("primary", "sm")}>
                Mon espace
              </Link>
            ) : (
              <>
                <Link href="/connexion" className={buttonClass("ghost", "sm")}>
                  Connexion
                </Link>
                <Link href="/inscription" className={buttonClass("primary", "sm")}>
                  Créer un compte
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <Logo className="opacity-80" />
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/avertissement" className="hover:underline">Avertissement</Link>
            <Link href="/confidentialite" className="hover:underline">Confidentialité</Link>
            <Link href="/connexion" className="hover:underline">Connexion</Link>
          </nav>
          <p>© {new Date().getFullYear()} MIZANIA</p>
        </div>
      </footer>
    </div>
  );
}
