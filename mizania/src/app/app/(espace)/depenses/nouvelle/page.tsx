import type { Metadata } from "next";
import { NewTransactionPage } from "@/components/app/transactions/edit-pages";

export const metadata: Metadata = { title: "Dépenses — nouvelle" };

export default function Page() {
  return <NewTransactionPage direction="expense" />;
}
