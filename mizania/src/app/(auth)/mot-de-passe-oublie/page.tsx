import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "../auth-forms";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="mb-1 text-xl font-semibold">Mot de passe oublié</h1>
      <p className="mb-5 text-sm text-ink-500">Indiquez votre adresse : nous vous enverrons un lien pour choisir un nouveau mot de passe.</p>
      <ForgotPasswordForm />
      <p className="mt-5 text-center text-sm">
        <Link href="/connexion" className="text-brand-700 underline">
          Retour à la connexion
        </Link>
      </p>
    </>
  );
}
