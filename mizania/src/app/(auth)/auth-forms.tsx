"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { FormState } from "@/lib/form-state";
import { PASSWORD_MIN } from "@/lib/validation/auth";
import { forgotPasswordAction, loginAction, registerAction, resetPasswordAction } from "./actions";

const initial: FormState = {};

export function LoginForm() {
  const [state, action] = useActionState(loginAction, initial);
  const v = state.values ?? {};
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <Field label="Adresse email" name="email" error={e.email}>
        <Input name="email" type="email" autoComplete="email" inputMode="email" required defaultValue={v.email} error={e.email} />
      </Field>
      <Field label="Mot de passe" name="password" error={e.password}>
        <Input name="password" type="password" autoComplete="current-password" required error={e.password} />
      </Field>
      <div className="text-right text-sm">
        <Link href="/mot-de-passe-oublie" className="text-brand-700 underline">
          Mot de passe oublié ?
        </Link>
      </div>
      <SubmitButton className="w-full" pendingLabel="Connexion…">
        Se connecter
      </SubmitButton>
    </form>
  );
}

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, initial);
  const v = state.values ?? {};
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <Field label="Votre nom" name="fullName" error={e.fullName}>
        <Input name="fullName" autoComplete="name" required defaultValue={v.fullName} error={e.fullName} />
      </Field>
      <Field label="Adresse email" name="email" error={e.email}>
        <Input name="email" type="email" autoComplete="email" inputMode="email" required defaultValue={v.email} error={e.email} />
      </Field>
      <Field label="Mot de passe" name="password" error={e.password} hint={`Au moins ${PASSWORD_MIN} caractères. Une phrase facile à retenir est idéale.`}>
        <Input name="password" type="password" autoComplete="new-password" required minLength={PASSWORD_MIN} error={e.password} />
      </Field>
      <div className="space-y-1">
        <label className="flex items-start gap-3 text-sm text-ink-700">
          <input type="checkbox" name="accept" value="1" defaultChecked={v.accept === "1"} className="mt-1 h-5 w-5 shrink-0 accent-brand-700" />
          <span>
            J’ai compris que MIZANIA est un outil d’assistance qui ne remplace pas un expert-comptable ni les sources officielles (
            <Link href="/avertissement" className="underline" target="_blank">
              avertissement
            </Link>
            ).
          </span>
        </label>
        {e.accept && <p className="text-sm text-negative">{e.accept}</p>}
      </div>
      <SubmitButton className="w-full" pendingLabel="Création du compte…">
        Créer mon compte
      </SubmitButton>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState(forgotPasswordAction, initial);
  const e = state.fieldErrors ?? {};
  if (state.ok) return <Alert tone="success">{state.message}</Alert>;
  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <Field label="Adresse email du compte" name="email" error={e.email}>
        <Input name="email" type="email" autoComplete="email" inputMode="email" required defaultValue={state.values?.email} error={e.email} />
      </Field>
      <SubmitButton className="w-full" pendingLabel="Envoi…">
        Recevoir un lien de réinitialisation
      </SubmitButton>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordAction, initial);
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <input type="hidden" name="token" value={token} />
      <Field label="Nouveau mot de passe" name="password" error={e.password} hint={`Au moins ${PASSWORD_MIN} caractères.`}>
        <Input name="password" type="password" autoComplete="new-password" required minLength={PASSWORD_MIN} error={e.password} />
      </Field>
      <Field label="Confirmez le mot de passe" name="confirm" error={e.confirm}>
        <Input name="confirm" type="password" autoComplete="new-password" required error={e.confirm} />
      </Field>
      <SubmitButton className="w-full">Enregistrer le nouveau mot de passe</SubmitButton>
    </form>
  );
}
