import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Badge, EmptyState, PageHeader } from "@/components/ui/card";
import { buttonClass, ButtonLink } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { formatDate } from "@/lib/dates";
import { DIRECTION_UI } from "@/lib/directions";
import { formatDA } from "@/lib/money";
import { listFiltersSchema, PAYMENT_METHODS, SORTS, TRANSACTION_STATUSES, type Direction } from "@/lib/validation/transaction";
import { requireOrg } from "@/server/auth/request";
import { listCategories, listTransactions } from "@/server/services/transactions";

type SearchParams = Record<string, string | string[] | undefined>;

const FLASH = { cree: "Opération enregistrée.", modifie: "Modifications enregistrées.", supprime: "Opération supprimée." } as const;

export async function TransactionsListPage({ direction, searchParams }: { direction: Direction; searchParams: SearchParams }) {
  const { org } = await requireOrg();
  const ui = DIRECTION_UI[direction];
  const single = Object.fromEntries(Object.entries(searchParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const filters = listFiltersSchema.parse(single);
  const [result, categories] = await Promise.all([listTransactions(org, direction, filters), listCategories(org, direction)]);
  const filtered = Boolean(filters.q || filters.status || filters.category || filters.from || filters.to);
  const statuses = TRANSACTION_STATUSES[direction];
  const flash = FLASH[single.ok as keyof typeof FLASH];

  const pageHref = (page: number) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) if (v && k !== "page" && !(k === "sort" && v === "date_desc")) p.set(k, String(v));
    if (page > 1) p.set("page", String(page));
    const s = p.toString();
    return s ? `${ui.path}?${s}` : ui.path;
  };

  return (
    <>
      <PageHeader
        title={ui.title}
        description={`${result.total} opération${result.total > 1 ? "s" : ""}${filtered ? " (filtrées)" : ""} · total ${formatDA(result.sumCents)} (hors annulées)`}
        actions={<ButtonLink href={`${ui.path}/nouvelle`}>+ {ui.newLabel}</ButtonLink>}
      />
      {flash && <Alert tone="success" className="mb-4">{flash}</Alert>}

      <form method="get" className="mb-5 grid gap-3 rounded-xl border border-line bg-surface p-3 sm:grid-cols-2 lg:grid-cols-6" role="search">
        <Input name="q" type="search" placeholder="Rechercher un libellé…" defaultValue={filters.q} aria-label="Rechercher" className="lg:col-span-2" />
        <Select name="status" defaultValue={filters.status ?? ""} aria-label="Statut">
          <option value="">Tous les statuts</option>
          {Object.entries(statuses).map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </Select>
        <Select name="category" defaultValue={filters.category ?? ""} aria-label="Catégorie">
          <option value="">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Input name="from" type="date" defaultValue={filters.from} aria-label="Du" title="Du" />
        <Input name="to" type="date" defaultValue={filters.to} aria-label="Au" title="Au" />
        <Select name="sort" defaultValue={filters.sort} aria-label="Trier" className="lg:col-span-2">
          {Object.entries(SORTS).map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </Select>
        <div className="flex gap-2 lg:col-span-4 lg:justify-end">
          {filtered && (
            <Link href={ui.path} className={buttonClass("ghost")}>
              Effacer les filtres
            </Link>
          )}
          <button className={buttonClass("secondary", "md", "flex-1 lg:flex-none")}>Appliquer</button>
        </div>
      </form>

      {result.rows.length === 0 ? (
        filtered ? (
          <EmptyState title="Aucune opération ne correspond à ces filtres." action={<ButtonLink href={ui.path} variant="secondary">Effacer les filtres</ButtonLink>} />
        ) : (
          <EmptyState title={`Aucune ${ui.singular} pour le moment`} action={<ButtonLink href={`${ui.path}/nouvelle`}>+ {ui.newLabel}</ButtonLink>}>
            {ui.empty}
          </EmptyState>
        )
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {result.rows.map((r) => (
            <li key={r.id}>
              <Link href={`${ui.path}/${r.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-canvas">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink-900">{r.label}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-500">
                    <span>{formatDate(r.occurredOn)}</span>
                    {r.categoryName && <span>· {r.categoryName}</span>}
                    {r.paymentMethod && <span>· {PAYMENT_METHODS[r.paymentMethod]}</span>}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`tabular font-semibold ${r.status === "cancelled" ? "text-ink-500 line-through" : "text-ink-900"}`}>
                    {direction === "expense" ? "−" : "+"}
                    {formatDA(r.amountCents)}
                  </span>
                  {r.status !== "settled" && <Badge tone={r.status === "pending" ? "warning" : "neutral"}>{statuses[r.status]}</Badge>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {result.pageCount > 1 && (
        <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm">
          {result.page > 1 ? <Link className={buttonClass("secondary", "sm")} href={pageHref(result.page - 1)}>← Précédent</Link> : <span />}
          <span className="text-ink-500">
            Page {result.page} / {result.pageCount}
          </span>
          {result.page < result.pageCount ? <Link className={buttonClass("secondary", "sm")} href={pageHref(result.page + 1)}>Suivant →</Link> : <span />}
        </nav>
      )}
    </>
  );
}
