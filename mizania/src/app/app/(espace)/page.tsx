import type { Metadata } from "next";
import Link from "next/link";
import { MonthlyChart } from "@/components/app/monthly-chart";
import { Alert } from "@/components/ui/alert";
import { Badge, Card, PageHeader } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { formatDate, monthLabel, todayInAlgeria } from "@/lib/dates";
import { formatDA } from "@/lib/money";
import { requireOrg } from "@/server/auth/request";
import { getDashboard } from "@/server/services/dashboard";

export const metadata: Metadata = { title: "Tableau de bord" };

function Kpi({ label, value, hint, tone }: { label: string; value: number; hint: string; tone?: "net" }) {
  const color = tone === "net" ? (value < 0 ? "text-negative" : "text-ink-900") : "text-ink-900";
  return (
    <Card className="p-4">
      <p className="text-sm text-ink-500">{label}</p>
      <p className={`tabular mt-1 text-xl font-semibold sm:text-2xl ${color}`}>{formatDA(value, { withDecimals: false })}</p>
      <p className="mt-1 text-xs text-ink-500">{hint}</p>
    </Card>
  );
}

const UPCOMING = ["Clients et fournisseurs", "Factures (PDF)", "Trésorerie détaillée", "Comptabilité SCF", "Assistant MIZANIA AI", "Exports pour le comptable"];

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { org, organization, session } = await requireOrg();
  const today = todayInAlgeria();
  const d = await getDashboard(org, today, organization.fiscalYearStartMonth);
  const sp = await searchParams;
  const month = monthLabel(d.period.monthStart, true);

  return (
    <>
      <PageHeader
        title={`Bonjour ${session.user.fullName.split(" ")[0]}`}
        description={`${organization.name} · situation au ${formatDate(today)}`}
        actions={
          <>
            <ButtonLink href="/app/recettes/nouvelle">+ Recette</ButtonLink>
            <ButtonLink href="/app/depenses/nouvelle" variant="secondary">
              + Dépense
            </ButtonLink>
          </>
        }
      />
      {sp.bienvenue && <Alert tone="success" className="mb-4">Votre espace est prêt. Commencez par enregistrer une recette ou une dépense.</Alert>}
      {!session.user.emailVerifiedAt && (
        <Alert tone="warning" className="mb-4">
          Votre adresse email n’est pas encore confirmée. <Link href="/app/parametres#email" className="underline">Renvoyer l’email</Link>
        </Alert>
      )}

      {!d.hasData ? (
        <Card className="py-10 text-center">
          <p className="text-lg font-medium">Votre tableau de bord se remplira avec vos opérations.</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
            Tous les chiffres affichés ici sont calculés uniquement à partir de ce que vous enregistrez. Aucune estimation n’est inventée.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <ButtonLink href="/app/recettes/nouvelle">Enregistrer une recette</ButtonLink>
            <ButtonLink href="/app/depenses/nouvelle" variant="secondary">
              Enregistrer une dépense
            </ButtonLink>
          </div>
        </Card>
      ) : (
        <div className="space-y-5">
          <section aria-labelledby="month-title">
            <h2 id="month-title" className="mb-2 text-sm font-medium text-ink-700">
              Ce mois-ci ({month})
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Kpi label="Recettes" value={d.month.income} hint="Encaissées et à encaisser" />
              <Kpi label="Dépenses" value={d.month.expense} hint="Payées et à payer" />
              <Kpi label="Écart du mois" value={d.month.net} hint="Recettes − dépenses" tone="net" />
              <Kpi label="Depuis le début de l’exercice" value={d.year.net} hint={`Recettes − dépenses depuis le ${formatDate(d.period.fyStart)}`} tone="net" />
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <h2 className="mb-3 font-medium">Évolution sur 6 mois</h2>
              <MonthlyChart data={d.series} />
            </Card>
            <Card>
              <h2 className="mb-3 font-medium">Trésorerie</h2>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-ink-500">Encaissé − payé à ce jour</dt>
                  <dd className={`tabular text-lg font-semibold ${d.settledNet < 0 ? "text-negative" : ""}`}>{formatDA(d.settledNet, { withDecimals: false })}</dd>
                </div>
                <div className="flex justify-between gap-2 border-t border-line pt-3">
                  <dt className="text-ink-500">À encaisser</dt>
                  <dd className="tabular font-medium">{formatDA(d.pending.income, { withDecimals: false })}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-500">À payer</dt>
                  <dd className="tabular font-medium">{formatDA(d.pending.expense, { withDecimals: false })}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-ink-500">
                Calcul basé uniquement sur vos opérations enregistrées. Votre solde bancaire ou de caisse de départ n’est pas encore pris en compte.
              </p>
            </Card>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-medium">Dernières opérations</h2>
              </div>
              <ul className="divide-y divide-line">
                {d.recent.map((r) => (
                  <li key={r.id}>
                    <Link href={`/app/${r.direction === "income" ? "recettes" : "depenses"}/${r.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-canvas">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{r.label}</span>
                        <span className="text-xs text-ink-500">
                          {formatDate(r.occurredOn)}
                          {r.categoryName ? ` · ${r.categoryName}` : ""}
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end">
                        <span className={`tabular text-sm font-semibold ${r.status === "cancelled" ? "text-ink-500 line-through" : ""}`}>
                          {r.direction === "income" ? "+" : "−"}
                          {formatDA(r.amountCents, { withDecimals: false })}
                        </span>
                        {r.status === "pending" && <Badge tone="warning">{r.direction === "income" ? "À encaisser" : "À payer"}</Badge>}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <h2 className="mb-3 font-medium">Principales dépenses de l’exercice</h2>
              {d.topExpenseCategories.length === 0 ? (
                <p className="text-sm text-ink-500">Aucune dépense sur l’exercice en cours.</p>
              ) : (
                <ul className="space-y-2.5">
                  {d.topExpenseCategories.map((c) => (
                    <li key={c.name}>
                      <div className="flex justify-between gap-2 text-sm">
                        <span className="truncate">{c.name}</span>
                        <span className="tabular font-medium">{formatDA(c.total, { withDecimals: false })}</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-canvas">
                        <div className="h-1.5 rounded-full bg-series-expense" style={{ width: `${Math.max(2, (c.total / d.topExpenseCategories[0].total) * 100)}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}

      <Card className="mt-5 bg-canvas">
        <h2 className="text-sm font-medium">Bientôt dans MIZANIA</h2>
        <p className="mt-1 text-sm text-ink-500">Ces modules sont en préparation et ne sont pas encore disponibles :</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {UPCOMING.map((u) => (
            <li key={u}>
              <Badge>{u}</Badge>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
