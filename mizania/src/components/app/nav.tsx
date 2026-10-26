"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui/cn";

export const NAV = [
  { href: "/app", label: "Tableau de bord", short: "Accueil", icon: "M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10" },
  { href: "/app/recettes", label: "Recettes", short: "Recettes", icon: "M12 19V5M5 12l7-7 7 7" },
  { href: "/app/depenses", label: "Dépenses", short: "Dépenses", icon: "M12 5v14M19 12l-7 7-7-7" },
  { href: "/app/parametres", label: "Paramètres", short: "Compte", icon: "M12 15a3 3 0 100-6 3 3 0 000 6zM4 12h2m12 0h2M12 4v2m0 12v2M6.3 6.3l1.4 1.4m8.6 8.6l1.4 1.4m0-11.4l-1.4 1.4m-8.6 8.6l-1.4 1.4" },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/app" ? pathname === "/app" : pathname.startsWith(href);
}

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export function SideNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigation principale" className="space-y-1">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium",
              active ? "bg-brand-50 text-brand-800" : "text-ink-700 hover:bg-canvas",
            )}
          >
            <Icon d={item.icon} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigation principale" className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
      <ul className="grid grid-cols-4">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn("flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium", active ? "text-brand-700" : "text-ink-500")}
              >
                <Icon d={item.icon} />
                {item.short}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
