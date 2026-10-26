import type { Metadata } from "next";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { verifyEmail } from "@/server/auth/service";

export const metadata: Metadata = { title: "Vérification de l’email", referrer: "no-referrer" };

export default async function VerifyEmailPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const ok = token.length <= 100 && (await verifyEmail(token));
  return (
    <>
      <h1 className="mb-4 text-xl font-semibold">Vérification de l’adresse email</h1>
      {ok ? (
        <Alert tone="success">Merci, votre adresse email est confirmée.</Alert>
      ) : (
        <Alert tone="error">Ce lien n’est plus valable (déjà utilisé ou expiré). Vous pouvez demander un nouvel email depuis vos paramètres.</Alert>
      )}
      <ButtonLink href="/app" className="mt-5 w-full">
        Aller à mon espace
      </ButtonLink>
    </>
  );
}
