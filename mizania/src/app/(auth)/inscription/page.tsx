import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/server/auth/request";
import { RegisterForm } from "../auth-forms";

export const metadata: Metadata = { title: "Créer un compte" };

export default async function RegisterPage() {
  if (await getSession()) redirect("/app");
  return (
    <>
      <h1 className="mb-1 text-xl font-semibold">Créer votre compte</h1>
      <p className="mb-5 text-sm text-ink-500">Gratuit pendant la phase de lancement. Moins d’une minute.</p>
      <RegisterForm />
      <p className="mt-5 text-center text-sm text-ink-700">
        Déjà inscrit ?{" "}
        <Link href="/connexion" className="font-medium text-brand-700 underline">
          Se connecter
        </Link>
      </p>
    </>
  );
}
