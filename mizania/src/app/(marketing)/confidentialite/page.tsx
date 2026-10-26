import type { Metadata } from "next";

export const metadata: Metadata = { title: "Confidentialité" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Confidentialité</h1>
      <p className="mt-3 rounded-lg border border-accent-500/40 bg-accent-100 px-4 py-3 text-sm text-accent-700">
        Document provisoire, en cours de mise en conformité avec la loi n° 18-07 modifiée et complétée par la loi n° 25-11. Il sera complété avant l’ouverture commerciale.
      </p>
      <div className="mt-6 space-y-4 text-ink-700">
        <h2 className="text-xl font-semibold text-ink-900">Données collectées</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Compte : nom, adresse email, mot de passe (stocké uniquement sous forme chiffrée irréversible, Argon2id).</li>
          <li>Activité : nom, type d’activité et informations facultatives que vous choisissez de renseigner.</li>
          <li>Opérations : recettes et dépenses que vous enregistrez.</li>
          <li>Sécurité : sessions de connexion et compteurs anti-abus (adresse IP utilisée de façon temporaire pour limiter les tentatives).</li>
        </ul>
        <h2 className="text-xl font-semibold text-ink-900">Utilisation</h2>
        <p>Vos données servent uniquement à faire fonctionner votre espace MIZANIA. Elles ne sont ni vendues, ni utilisées à des fins publicitaires. L’assistant IA n’est pas encore activé ; il le sera uniquement avec votre accord explicite.</p>
        <h2 className="text-xl font-semibold text-ink-900">Sécurité et isolation</h2>
        <p>Les données de chaque activité sont isolées : l’application contrôle vos droits à chaque requête et la base de données refuse elle-même l’accès aux données d’une autre activité.</p>
        <h2 className="text-xl font-semibold text-ink-900">Vos droits</h2>
        <p>Vous pouvez consulter et modifier vos informations depuis vos paramètres. Les modalités complètes (accès, rectification, suppression, contact du responsable du traitement, hébergement) seront précisées dans la version définitive de ce document.</p>
      </div>
    </main>
  );
}
