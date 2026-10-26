"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { fieldErrorsOf, formValues, type FormState } from "@/lib/form-state";
import { fullNameSchema, passwordSchema } from "@/lib/validation/auth";
import { organizationProfileSchema } from "@/lib/validation/organization";
import { clearSessionCookie, requireOrg } from "@/server/auth/request";
import { changePassword, updateProfile } from "@/server/auth/service";
import { invalidateUserSessions } from "@/server/auth/session";
import { updateOrganizationProfile } from "@/server/services/organizations";

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { session } = await requireOrg();
  const parsed = z.object({ fullName: fullNameSchema }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { values: formValues(formData), fieldErrors: fieldErrorsOf(parsed.error) };
  await updateProfile(session.userId, parsed.data.fullName);
  revalidatePath("/app", "layout");
  return { ok: true, message: "Profil mis à jour." };
}

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { session } = await requireOrg();
  const parsed = z
    .object({ currentPassword: z.string().min(1, "Mot de passe actuel requis.").max(128), newPassword: passwordSchema, confirm: z.string() })
    .refine((d) => d.newPassword === d.confirm, { path: ["confirm"], message: "Les deux mots de passe ne correspondent pas." })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };
  const ok = await changePassword(session.userId, session.id, parsed.data.currentPassword, parsed.data.newPassword);
  if (!ok) return { fieldErrors: { currentPassword: "Mot de passe actuel incorrect." } };
  return { ok: true, message: "Mot de passe modifié. Vos autres appareils ont été déconnectés." };
}

export async function updateOrganizationAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { org } = await requireOrg();
  const values = formValues(formData);
  if (org.role !== "owner") return { values, error: "Seul le propriétaire peut modifier ces informations." };
  const parsed = organizationProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { values, fieldErrors: fieldErrorsOf(parsed.error) };
  await updateOrganizationProfile(org, parsed.data);
  revalidatePath("/app", "layout");
  return { ok: true, message: "Informations de l’activité enregistrées.", values };
}

export async function logoutEverywhereAction(): Promise<void> {
  const { session } = await requireOrg();
  await invalidateUserSessions(session.userId);
  await clearSessionCookie();
  redirect("/connexion?deconnecte=1");
}
