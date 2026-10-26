import { monthLabel } from "@/lib/dates";
import { formatDA } from "@/lib/money";

type Point = { month: string; income: number; expense: number };

/** Graduation « propre » au-dessus du maximum (1, 2, 2,5, 5 × 10ⁿ). */
function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  return ([1, 2, 2.5, 5, 10].find((m) => m * p >= v) ?? 10) * p;
}

function compactDA(cents: number) {
  const da = cents / 100;
  if (da >= 1_000_000) return `${(da / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M`;
  if (da >= 1_000) return `${(da / 1_000).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} k`;
  return da.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
}

/**
 * Colonnes groupées recettes / dépenses sur 6 mois. Rendu serveur, sans
 * dépendance. Survol / focus : infobulle ; tableau accessible en dessous.
 */
export function MonthlyChart({ data }: { data: Point[] }) {
  const max = niceMax(Math.max(...data.flatMap((d) => [d.income, d.expense])));
  const ticks = [max, max / 2, 0];
  return (
    <figure>
      <div className="mb-3 flex gap-4 text-xs text-ink-700" aria-hidden="true">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-series-income" /> Recettes
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-series-expense" /> Dépenses
        </span>
      </div>
      <div className="flex gap-2" aria-hidden="true">
        <div className="tabular flex h-40 flex-col justify-between pb-0 text-right text-[11px] text-ink-500">
          {ticks.map((t) => (
            <span key={t} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">
              {compactDA(t)}
            </span>
          ))}
        </div>
        <div className="relative flex-1">
          <div className="absolute inset-x-0 top-0 h-40 border-t border-line" />
          <div className="absolute inset-x-0 top-20 border-t border-line" />
          <div className="relative grid h-40 grid-cols-6 items-end border-b border-ink-500/40">
            {data.map((d) => (
              <div key={d.month} tabIndex={0} className="group relative flex h-full items-end justify-center gap-[2px] outline-none focus-visible:bg-brand-50">
                <div className="w-full max-w-6 rounded-t bg-series-income" style={{ height: `${(d.income / max) * 100}%` }} />
                <div className="w-full max-w-6 rounded-t bg-series-expense" style={{ height: `${(d.expense / max) * 100}%` }} />
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden w-max -translate-x-1/2 rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-md group-hover:block group-focus:block">
                  <p className="mb-1 font-medium text-ink-900">{monthLabel(d.month, true)}</p>
                  <p className="tabular text-ink-700">Recettes : {formatDA(d.income, { withDecimals: false })}</p>
                  <p className="tabular text-ink-700">Dépenses : {formatDA(d.expense, { withDecimals: false })}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-6 text-center text-[11px] text-ink-500">
            {data.map((d) => (
              <span key={d.month}>{monthLabel(d.month)}</span>
            ))}
          </div>
        </div>
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-ink-500">Voir les chiffres en tableau</summary>
        <table className="tabular mt-2 w-full text-left text-sm">
          <caption className="sr-only">Recettes et dépenses des 6 derniers mois</caption>
          <thead>
            <tr className="text-ink-500">
              <th className="py-1 font-medium">Mois</th>
              <th className="py-1 text-right font-medium">Recettes</th>
              <th className="py-1 text-right font-medium">Dépenses</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.month} className="border-t border-line">
                <td className="py-1">{monthLabel(d.month, true)}</td>
                <td className="py-1 text-right">{formatDA(d.income)}</td>
                <td className="py-1 text-right">{formatDA(d.expense)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
