import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, PageHeader } from "@/components/ui/card";
import { todayInAlgeria } from "@/lib/dates";
import { DIRECTION_UI } from "@/lib/directions";
import { formatDA } from "@/lib/money";
import type { Direction } from "@/lib/validation/transaction";
import { requireOrg } from "@/server/auth/request";
import { getTransaction, listCategories } from "@/server/services/transactions";
import { DeleteTransactionButton } from "./delete-button";
import { TransactionForm } from "./transaction-form";

function Back({ direction }: { direction: Direction }) {
  const ui = DIRECTION_UI[direction];
  return (
    <Link href={ui.path} className="mb-3 inline-block text-sm text-brand-700 underline">
      ← {ui.title}
    </Link>
  );
}

export async function NewTransactionPage({ direction }: { direction: Direction }) {
  const { org } = await requireOrg();
  const categories = await listCategories(org, direction);
  const ui = DIRECTION_UI[direction];
  return (
    <>
      <Back direction={direction} />
      <PageHeader title={ui.newLabel} />
      <Card>
        <TransactionForm
          direction={direction}
          id={null}
          categories={categories.map((c) => c.name)}
          defaults={{ amount: "", occurredOn: todayInAlgeria(), label: "", categoryName: "", paymentMethod: "", status: "settled", description: "" }}
        />
      </Card>
    </>
  );
}

/** Montant en saisie : « 120000,50 » (sans espaces, relu par parseAmount). */
function amountForInput(cents: number) {
  const units = Math.floor(cents / 100);
  const rest = cents % 100;
  return rest ? `${units},${String(rest).padStart(2, "0")}` : String(units);
}

export async function EditTransactionPage({ direction, id }: { direction: Direction; id: string }) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { org } = await requireOrg();
  const [row, categories] = await Promise.all([getTransaction(org, id, direction), listCategories(org, direction)]);
  if (!row) notFound();
  const t = row.transaction;
  return (
    <>
      <Back direction={direction} />
      <PageHeader
        title={t.label}
        description={`${direction === "income" ? "Recette" : "Dépense"} de ${formatDA(t.amountCents)}`}
        actions={<DeleteTransactionButton direction={direction} id={t.id} label={t.label} />}
      />
      <Card>
        <TransactionForm
          direction={direction}
          id={t.id}
          categories={categories.map((c) => c.name)}
          defaults={{
            amount: amountForInput(t.amountCents),
            occurredOn: t.occurredOn,
            label: t.label,
            categoryName: row.categoryName ?? "",
            paymentMethod: t.paymentMethod ?? "",
            status: t.status,
            description: t.description ?? "",
          }}
        />
      </Card>
    </>
  );
}
