"use client";

import { useActionState, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { FormState } from "@/lib/form-state";
import { ACTIVITY_TYPES, LEGAL_FORMS, MAIN_GOALS, VAT_LIABILITY } from "@/lib/validation/organization";
import { onboardingAction } from "./actions";

const options = (o: Record<string, string>) =>
  Object.entries(o).map(([k, v]) => (
    <option key={k} value={k}>
      {v}
    </option>
  ));

/** Deux étapes courtes ; l'étape 2 est entièrement facultative. */
export function OnboardingForm({ firstName }: { firstName: string }) {
  const [state, action] = useActionState(onboardingAction, {} as FormState);
  const [step, setStep] = useState(1);
  const v = state.values ?? {};
  const e = state.fieldErrors ?? {};
  const showStep2 = step === 2 && !e.name && !e.activityType;

  return (
    <form action={action} className="space-y-5" noValidate>
      <p className="text-sm font-medium text-brand-700">Étape {showStep2 ? 2 : 1} sur 2</p>
      {state.error && <Alert tone="error">{state.error}</Alert>}

      <div className={showStep2 ? "hidden" : "space-y-5"}>
        <div>
          <h1 className="text-xl font-semibold">Bienvenue {firstName} 👋</h1>
          <p className="mt-1 text-sm text-ink-500">Parlez-nous de votre activité. Vous pourrez tout modifier plus tard.</p>
        </div>
        <Field label="Nom de votre activité ou entreprise" name="name" error={e.name}>
          <Input name="name" required defaultValue={v.name} placeholder="Ex. : Studio Ilyes" error={e.name} />
        </Field>
        <Field label="Type d’activité" name="activityType" error={e.activityType}>
          <Select name="activityType" defaultValue={v.activityType ?? ""} error={e.activityType}>
            <option value="" disabled>
              Choisir…
            </option>
            {options(ACTIVITY_TYPES)}
          </Select>
        </Field>
        <Field label="Que faites-vous exactement ?" name="sector" optional error={e.sector}>
          <Input name="sector" defaultValue={v.sector} placeholder="Ex. : graphisme, épicerie, plomberie…" error={e.sector} />
        </Field>
        <Field label="Votre objectif principal avec MIZANIA" name="mainGoal" optional>
          <Select name="mainGoal" defaultValue={v.mainGoal ?? ""}>
            <option value="">Choisir…</option>
            {options(MAIN_GOALS)}
          </Select>
        </Field>
        <Button type="button" className="w-full" onClick={() => setStep(2)}>
          Continuer
        </Button>
      </div>

      <div className={showStep2 ? "space-y-5" : "hidden"}>
        <div>
          <h2 className="text-xl font-semibold">Votre situation</h2>
          <p className="mt-1 text-sm text-ink-500">Tout est facultatif. Répondez « Je ne sais pas » si vous n’êtes pas sûr : MIZANIA n’appliquera alors aucune règle fiscale automatiquement.</p>
        </div>
        <Field label="Forme juridique" name="legalForm" optional>
          <Select name="legalForm" defaultValue={v.legalForm ?? ""}>
            <option value="">Je ne sais pas / plus tard</option>
            {options(LEGAL_FORMS)}
          </Select>
        </Field>
        <Field label="Wilaya" name="wilaya" optional error={e.wilaya}>
          <Input name="wilaya" defaultValue={v.wilaya} placeholder="Ex. : Alger, Oran, Tizi Ouzou…" error={e.wilaya} />
        </Field>
        <Field label="Êtes-vous assujetti à la TVA ?" name="vatLiability" optional>
          <Select name="vatLiability" defaultValue={v.vatLiability ?? "unknown"}>
            {options(VAT_LIABILITY)}
          </Select>
        </Field>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={() => setStep(1)}>
            Retour
          </Button>
          <SubmitButton className="flex-1" pendingLabel="Création…">
            Créer mon espace
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}
