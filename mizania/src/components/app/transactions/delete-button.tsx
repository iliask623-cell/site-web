"use client";

import { deleteTransactionAction } from "@/app/app/(espace)/transactions-actions";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Direction } from "@/lib/validation/transaction";

export function DeleteTransactionButton({ direction, id, label }: { direction: Direction; id: string; label: string }) {
  return (
    <form
      action={deleteTransactionAction.bind(null, direction, id)}
      onSubmit={(e) => {
        if (!window.confirm(`Supprimer définitivement « ${label} » ? Cette action est irréversible.`)) e.preventDefault();
      }}
    >
      <SubmitButton variant="danger" pendingLabel="Suppression…">
        Supprimer
      </SubmitButton>
    </form>
  );
}
