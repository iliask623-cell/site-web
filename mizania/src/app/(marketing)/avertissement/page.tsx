import type { Metadata } from "next";

export const metadata: Metadata = { title: "Avertissement" };

export default function DisclaimerPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Avertissement</h1>
      <div className="mt-6 space-y-4 text-ink-700">
        <p><strong>MIZANIA est un outil d’assistance.</strong> Il vous aide à enregistrer, organiser et comprendre les informations financières de votre activité.</p>
        <p>Les informations fournies par MIZANIA — y compris les explications, calculs, indicateurs et, à l’avenir, les réponses de l’assistant IA — <strong>ne constituent pas automatiquement un avis professionnel personnalisé</strong>.</p>
        <p>MIZANIA ne remplace pas un expert-comptable, un commissaire aux comptes, un avocat ou l’administration fiscale. Pour les situations complexes ou importantes, vérifiez auprès d’un professionnel compétent ou auprès des sources officielles (Direction Générale des Impôts, ministère des Finances, Journal officiel…).</p>
        <h2 className="pt-4 text-xl font-semibold text-ink-900">Nos engagements</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Les chiffres affichés proviennent uniquement des données que vous avez enregistrées.</li>
          <li>Aucun compte SCF, taux, seuil ou mention obligatoire n’est inventé. En cas d’incertitude, MIZANIA l’indique.</li>
          <li>Les règles fiscales et comptables sont associées à leur source, à une date d’effet et à une date de vérification. Une règle non vérifiée n’est pas appliquée automatiquement.</li>
          <li>Les fonctionnalités non terminées sont présentées comme « en préparation ».</li>
        </ul>
        <p className="pt-4">Vous restez responsable de l’exactitude des données que vous saisissez et des décisions que vous prenez.</p>
      </div>
    </main>
  );
}
