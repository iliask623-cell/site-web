import type { Metadata } from "next";
import { TransactionsListPage } from "@/components/app/transactions/list-page";

export const metadata: Metadata = { title: "Recettes" };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <TransactionsListPage direction="income" searchParams={await searchParams} />;
}
