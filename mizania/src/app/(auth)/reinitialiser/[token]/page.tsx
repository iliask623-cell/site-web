import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { isResetTokenValid } from "@/server/auth/service";
import { ResetPasswordForm } from "../../auth-forms";

export const metadata: Metadata = { title: "Nouveau mot de passe", referrer: "no-referrer" };

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const valid = token.length <= 100 && (await isResetTokenValid(token));
  return (
    <>
      <h1 className="mb-4 text-xl font-semibold">Choisir un nouveau mot de passe</h1>
      {valid ? (
        <ResetPasswordForm token={token} />
      ) : (
        <Alert tone="error">
          Ce lien n’est plus valable (déjà utilisé ou expiré).{" "}
          <Link href="/mot-de-passe-oublie" className="underline">
            Faire une nouvelle demande
          </Link>
        </Alert>
      )}
    </>
  );
}
