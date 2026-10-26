import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { BottomNav, SideNav } from "@/components/app/nav";
import { Badge } from "@/components/ui/card";
import { requireOrg } from "@/server/auth/request";
import { logoutAction } from "../../(auth)/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { organization, session } = await requireOrg();
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden border-r border-line bg-surface px-4 py-5 lg:flex lg:flex-col lg:gap-6">
        <Link href="/app" aria-label="Tableau de bord">
          <Logo />
        </Link>
        <SideNav />
        <div className="mt-auto space-y-2 border-t border-line pt-4 text-sm">
          <p className="truncate font-medium text-ink-900">{organization.name}</p>
          <p className="truncate text-ink-500">{session.user.email}</p>
          <form action={logoutAction}>
            <button className="min-h-9 text-ink-700 underline hover:text-ink-900">Se déconnecter</button>
          </form>
        </div>
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-line bg-surface/95 px-4 backdrop-blur lg:hidden">
          <Link href="/app" aria-label="Tableau de bord">
            <Logo />
          </Link>
          <span className="max-w-[45%] truncate text-sm text-ink-700">{organization.name}</span>
        </header>
        {organization.isDemo && (
          <div className="bg-accent-100 px-4 py-2 text-center text-sm text-accent-700">
            <Badge tone="warning">Démonstration</Badge> Données fictives : ne pas utiliser pour une décision réelle.
          </div>
        )}
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-5 sm:px-6 lg:pb-10">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
