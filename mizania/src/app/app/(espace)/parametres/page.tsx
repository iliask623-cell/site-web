import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireOrg } from "@/server/auth/request";
import { logoutAction } from "../../../(auth)/actions";
import { logoutEverywhereAction } from "./actions";
import { OrganizationForm, PasswordForm, ProfileForm, ResendVerification } from "./forms";

export const metadata: Metadata = { title: "Paramètres" };

export default async function SettingsPage() {
  const { session, organization: o, org } = await requireOrg();
  const s = (v: string | null | undefined) => v ?? "";
  return (
    <>
      <PageHeader title="Paramètres" description="Votre profil, votre activité et la sécurité de votre compte." />
      <div className="space-y-5">
        <Card>
          <h2 className="mb-4 font-medium">Votre activité</h2>
          <OrganizationForm
            canEdit={org.role === "owner"}
            defaults={{
              name: o.name,
              activityType: s(o.activityType),
              legalForm: s(o.legalForm),
              sector: s(o.sector),
              wilaya: s(o.wilaya),
              mainGoal: s(o.mainGoal),
              vatLiability: o.vatLiability,
              address: s(o.address),
              phone: s(o.phone),
              email: s(o.email),
              nif: s(o.nif),
              nis: s(o.nis),
              rc: s(o.rc),
              articleImposition: s(o.articleImposition),
            }}
          />
        </Card>
        <Card>
          <h2 className="mb-4 font-medium">Profil</h2>
          <ProfileForm fullName={session.user.fullName} />
        </Card>
        <Card>
          <h2 id="email" className="mb-2 font-medium">Adresse email</h2>
          <p className="mb-3 flex flex-wrap items-center gap-2 text-sm">
            {session.user.email}
            {session.user.emailVerifiedAt ? <Badge tone="positive">Confirmée</Badge> : <Badge tone="warning">Non confirmée</Badge>}
          </p>
          {!session.user.emailVerifiedAt && <ResendVerification />}
        </Card>
        <Card>
          <h2 className="mb-4 font-medium">Mot de passe</h2>
          <PasswordForm />
        </Card>
        <Card>
          <h2 className="mb-3 font-medium">Sessions</h2>
          <div className="flex flex-wrap gap-2">
            <form action={logoutAction}>
              <Button variant="secondary">Se déconnecter</Button>
            </form>
            <form action={logoutEverywhereAction}>
              <Button variant="ghost">Se déconnecter de tous les appareils</Button>
            </form>
          </div>
        </Card>
        <p className="text-center text-xs text-ink-500">
          <Link href="/avertissement" className="underline">Avertissement</Link> · <Link href="/confidentialite" className="underline">Confidentialité</Link>
        </p>
      </div>
    </>
  );
}
