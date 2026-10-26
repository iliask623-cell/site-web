import type { Metadata } from "next";
import { EditTransactionPage } from "@/components/app/transactions/edit-pages";

export const metadata: Metadata = { title: "Recettes — modifier" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <EditTransactionPage direction="income" id={(await params).id} />;
}
