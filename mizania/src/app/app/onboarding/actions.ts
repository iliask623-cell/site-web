"use server";

import { redirect } from "next/navigation";
import { fieldErrorsOf, formValues, type FormState } from "@/lib/form-state";
import { onboardingSchema } from "@/lib/validation/organization";
import { requireUser } from "@/server/auth/request";
import { setActiveOrganization } from "@/server/auth/session";
import { createOrganizationForUser, listMemberships } from "@/server/services/organizations";

export async function onboardingAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireUser();
  const values = formValues(formData);
  const parsed = onboardingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { values, fieldErrors: fieldErrorsOf(parsed.error) };
  // Une seule activité pour le MVP : on évite les doublons (double clic, retour arrière).
  if ((await listMemberships(session.userId)).length > 0) redirect("/app");
  const org = await createOrganizationForUser(session.userId, parsed.data);
  await setActiveOrganization(session.id, org.id);
  redirect("/app?bienvenue=1");
}
