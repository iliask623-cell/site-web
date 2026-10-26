"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { DIRECTION_UI } from "@/lib/directions";
import { fieldErrorsOf, formValues, type FormState } from "@/lib/form-state";
import { transactionSchema, type Direction } from "@/lib/validation/transaction";
import { requireOrg } from "@/server/auth/request";
import { ForbiddenError } from "@/server/services/permissions";
import { createTransaction, deleteTransaction, updateTransaction } from "@/server/services/transactions";

const directionSchema = z.enum(["income", "expense"]);
const idSchema = z.uuid().nullable();

export async function saveTransactionAction(
  direction: Direction,
  id: string | null,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const dir = directionSchema.parse(direction);
  const txId = idSchema.parse(id);
  const { org } = await requireOrg();
  const values = formValues(formData);
  const parsed = transactionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { values, fieldErrors: fieldErrorsOf(parsed.error) };

  try {
    if (txId) {
      const updated = await updateTransaction(org, txId, dir, parsed.data);
      if (!updated) return { values, error: "Cette opération n’existe plus ou ne vous appartient pas." };
    } else {
      await createTransaction(org, dir, parsed.data);
    }
  } catch (e) {
    if (e instanceof ForbiddenError) return { values, error: e.message };
    console.error("saveTransaction failed", e instanceof Error ? e.name : "unknown");
    return { values, error: "L’enregistrement a échoué. Réessayez dans un instant." };
  }
  revalidatePath("/app", "layout");
  redirect(`${DIRECTION_UI[dir].path}?ok=${txId ? "modifie" : "cree"}`);
}

export async function deleteTransactionAction(direction: Direction, id: string): Promise<void> {
  const dir = directionSchema.parse(direction);
  const txId = z.uuid().parse(id);
  const { org } = await requireOrg();
  await deleteTransaction(org, txId, dir);
  revalidatePath("/app", "layout");
  redirect(`${DIRECTION_UI[dir].path}?ok=supprime`);
}
