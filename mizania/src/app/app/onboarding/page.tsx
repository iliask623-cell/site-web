import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { requireUser } from "@/server/auth/request";
import { listMemberships } from "@/server/services/organizations";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "Votre activité" };

export default async function OnboardingPage() {
  const session = await requireUser();
  if ((await listMemberships(session.userId)).length > 0) redirect("/app");
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-8">
      <div className="mb-8">
        <Logo />
      </div>
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-7">
        <OnboardingForm firstName={session.user.fullName.split(" ")[0]} />
      </div>
    </main>
  );
}
