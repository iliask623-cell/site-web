import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { getSession } from "@/server/auth/request";
import { LoginForm } from "../auth-forms";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (await getSession()) redirect("/app");
  const sp = await searchParams;
  return (
    <>
      <h1 className="mb-1 text-xl font-semibold">Connexion</h1>
      <p className="mb-5 text-sm text-ink-500">Accédez à votre espace MIZANIA.</p>
      {sp.reinitialise && <Alert tone="success" className="mb-4">Mot de passe modifié. Connectez-vous avec le nouveau mot de passe.</Alert>}
      {sp.deconnecte && <Alert className="mb-4">Vous êtes déconnecté.</Alert>}
      <LoginForm />
      <p className="mt-5 text-center text-sm text-ink-700">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-medium text-brand-700 underline">
          Créer un compte
        </Link>
      </p>
    </>
  );
}
