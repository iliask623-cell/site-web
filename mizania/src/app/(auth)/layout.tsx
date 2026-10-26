import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-8">
      <Link href="/" className="mb-8 self-start" aria-label="Accueil MIZANIA">
        <Logo />
      </Link>
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-7">{children}</div>
      <p className="mt-6 text-center text-xs text-ink-500">
        MIZANIA est un outil d’assistance et ne remplace pas un professionnel.{" "}
        <Link href="/avertissement" className="underline">
          En savoir plus
        </Link>
      </p>
    </main>
  );
}

