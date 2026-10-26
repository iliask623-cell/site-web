"use client";

import { useActionState } from "react";
import { resendVerificationAction } from "@/app/(auth)/actions";
import { Alert } from "@/components/ui/alert";
import { Field, Input, Select } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { FormState } from "@/lib/form-state";
import { PASSWORD_MIN } from "@/lib/validation/auth";
import { ACTIVITY_TYPES, LEGAL_FORMS, MAIN_GOALS, VAT_LIABILITY } from "@/lib/validation/organization";
import { changePasswordAction, updateOrganizationAction, updateProfileAction } from "./actions";

const opts = (o: Record<string, string>) =>
  Object.entries(o).map(([k, v]) => (
    <option key={k} value={k}>
      {v}
    </option>
  ));

function Feedback({ state }: { state: FormState }) {
  if (state.error) return <Alert tone="error">{state.error}</Alert>;
  if (state.ok && state.message) return <Alert tone="success">{state.message}</Alert>;
  return null;
}

export function ProfileForm({ fullName }: { fullName: string }) {
  const [state, action] = useActionState(updateProfileAction, {} as FormState);
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4">
      <Feedback state={state} />
      <Field label="Votre nom" name="fullName" error={e.fullName}>
        <Input name="fullName" defaultValue={state.values?.fullName ?? fullName} required error={e.fullName} />
      </Field>
      <SubmitButton>Enregistrer</SubmitButton>
    </form>
  );
}

export function ResendVerification() {
  const [state, action] = useActionState(resendVerificationAction, {} as FormState);
  return (
    <form action={action} className="space-y-3">
      <Feedback state={state} />
      <SubmitButton variant="secondary" pendingLabel="Envoi…">
        Renvoyer l’email de confirmation
      </SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(changePasswordAction, {} as FormState);
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4" key={state.ok ? "done" : "form"}>
      <Feedback state={state} />
      <Field label="Mot de passe actuel" name="currentPassword" error={e.currentPassword}>
        <Input name="currentPassword" type="password" autoComplete="current-password" required error={e.currentPassword} />
      </Field>
      <Field label="Nouveau mot de passe" name="newPassword" error={e.newPassword} hint={`Au moins ${PASSWORD_MIN} caractères.`}>
        <Input name="newPassword" type="password" autoComplete="new-password" required error={e.newPassword} />
      </Field>
      <Field label="Confirmez le nouveau mot de passe" name="confirm" error={e.confirm}>
        <Input name="confirm" type="password" autoComplete="new-password" required error={e.confirm} />
      </Field>
      <SubmitButton>Changer le mot de passe</SubmitButton>
    </form>
  );
}

export type OrgDefaults = Record<
  "name" | "activityType" | "legalForm" | "sector" | "wilaya" | "mainGoal" | "vatLiability" | "address" | "phone" | "email" | "nif" | "nis" | "rc" | "articleImposition",
  string
>;

export function OrganizationForm({ defaults, canEdit }: { defaults: OrgDefaults; canEdit: boolean }) {
  const [state, action] = useActionState(updateOrganizationAction, {} as FormState);
  const v = { ...defaults, ...state.values };
  const e = state.fieldErrors ?? {};
  const text = (name: keyof OrgDefaults, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <Field label={label} name={name} optional={name !== "name"} error={e[name]}>
      <Input name={name} defaultValue={v[name]} error={e[name]} disabled={!canEdit} {...props} />
    </Field>
  );
  return (
    <form action={action} className="space-y-5">
      <Feedback state={state} />
      <fieldset className="grid gap-4 sm:grid-cols-2" disabled={!canEdit}>
        {text("name", "Nom de l’activité")}
        <Field label="Type d’activité" name="activityType" error={e.activityType}>
          <Select name="activityType" defaultValue={v.activityType}>{opts(ACTIVITY_TYPES)}</Select>
        </Field>
        <Field label="Forme juridique" name="legalForm" optional>
          <Select name="legalForm" defaultValue={v.legalForm}>
            <option value="">Non renseignée</option>
            {opts(LEGAL_FORMS)}
          </Select>
        </Field>
        {text("sector", "Secteur / métier")}
        {text("wilaya", "Wilaya")}
        <Field label="Objectif principal" name="mainGoal" optional>
          <Select name="mainGoal" defaultValue={v.mainGoal}>
            <option value="">Non renseigné</option>
            {opts(MAIN_GOALS)}
          </Select>
        </Field>
        {text("address", "Adresse")}
        {text("phone", "Téléphone", { type: "tel", inputMode: "tel" })}
        {text("email", "Email professionnel", { type: "email", inputMode: "email" })}
      </fieldset>
      <fieldset className="space-y-4 rounded-lg border border-line p-4" disabled={!canEdit}>
        <legend className="px-1 text-sm font-medium">Situation fiscale et identifiants</legend>
        <p className="text-xs text-ink-500">
          Informations déclaratives : MIZANIA ne les vérifie pas. Tant que l’assujettissement à la TVA est « Je ne sais pas », aucune règle fiscale n’est appliquée automatiquement.
        </p>
        <Field label="Assujetti à la TVA ?" name="vatLiability">
          <Select name="vatLiability" defaultValue={v.vatLiability}>{opts(VAT_LIABILITY)}</Select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          {text("nif", "NIF")}
          {text("nis", "NIS")}
          {text("rc", "Registre du commerce (RC)")}
          {text("articleImposition", "Article d’imposition")}
        </div>
      </fieldset>
      {canEdit ? <SubmitButton>Enregistrer</SubmitButton> : <p className="text-sm text-ink-500">Seul le propriétaire peut modifier ces informations.</p>}
    </form>
  );
}
