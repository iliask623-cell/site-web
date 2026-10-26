import type { Metadata } from "next";
import { EditTransactionPage } from "@/components/app/transactions/edit-pages";

export const metadata: Metadata = { title: "Dépenses — modifier" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <EditTransactionPage direction="expense" id={(await params).id} />;
}
