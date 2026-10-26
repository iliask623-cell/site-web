"use client";

import { useActionState } from "react";
import { saveTransactionAction } from "@/app/app/(espace)/transactions-actions";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { DIRECTION_UI } from "@/lib/directions";
import type { FormState } from "@/lib/form-state";
import { PAYMENT_METHODS, TRANSACTION_STATUSES, type Direction } from "@/lib/validation/transaction";

export type TransactionFormDefaults = {
  amount: string;
  occurredOn: string;
  label: string;
  categoryName: string;
  paymentMethod: string;
  status: string;
  description: string;
};

export function TransactionForm({
  direction,
  id,
  defaults,
  categories,
}: {
  direction: Direction;
  id: string | null;
  defaults: TransactionFormDefaults;
  categories: string[];
}) {
  const [state, action] = useActionState(saveTransactionAction.bind(null, direction, id), {} as FormState);
  const v = { ...defaults, ...state.values };
  const e = state.fieldErrors ?? {};
  const ui = DIRECTION_UI[direction];

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Montant (DA)" name="amount" error={e.amount} hint="Ex. : 120 000 ou 1 500,50">
          <Input name="amount" inputMode="decimal" autoComplete="off" required defaultValue={v.amount} error={e.amount} className="tabular text-lg font-medium" />
        </Field>
        <Field label="Date" name="occurredOn" error={e.occurredOn}>
          <Input name="occurredOn" type="date" required defaultValue={v.occurredOn} error={e.occurredOn} />
        </Field>
      </div>
      <Field label="Libellé" name="label" error={e.label}>
        <Input name="label" required maxLength={200} defaultValue={v.label} placeholder={ui.partyHint} error={e.label} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Catégorie" name="categoryName" optional error={e.categoryName} hint="Choisissez dans la liste ou saisissez une nouvelle catégorie.">
          <Input name="categoryName" list="categories" maxLength={60} defaultValue={v.categoryName} autoComplete="off" error={e.categoryName} />
          <datalist id="categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Moyen de paiement" name="paymentMethod" optional error={e.paymentMethod}>
          <Select name="paymentMethod" defaultValue={v.paymentMethod}>
            <option value="">—</option>
            {Object.entries(PAYMENT_METHODS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Statut" name="status" error={e.status}>
        <Select name="status" defaultValue={v.status}>
          {Object.entries(TRANSACTION_STATUSES[direction]).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Note" name="description" optional error={e.description}>
        <Textarea name="description" maxLength={1000} defaultValue={v.description} error={e.description} />
      </Field>
      <p className="text-xs text-ink-500">
        Client / fournisseur et justificatifs : bientôt disponibles (modules en préparation).
      </p>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <ButtonLink href={ui.path} variant="secondary">
          Annuler
        </ButtonLink>
        <SubmitButton>{id ? "Enregistrer les modifications" : `Enregistrer la ${ui.singular}`}</SubmitButton>
      </div>
    </form>
  );
}
