import Link from "next/link";
import { Badge } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";

const FEATURES: { title: string; text: string; available: boolean }[] = [
  { title: "Recettes et dépenses", text: "Enregistrez chaque entrée et sortie d’argent en quelques secondes, avec catégories, statut et moyen de paiement (espèces, CCP, BaridiMob, CIB…).", available: true },
  { title: "Tableau de bord clair", text: "Vos recettes, dépenses, écarts du mois et de l’exercice, sommes à encaisser et à payer — calculés uniquement à partir de vos données.", available: true },
  { title: "Recherche et filtres", text: "Retrouvez une opération par libellé, période, catégorie ou statut.", available: true },
  { title: "Clients et fournisseurs", text: "Fiches, historique et soldes.", available: false },
  { title: "Factures PDF", text: "Numérotation, calculs automatiques, contrôles avant émission et conservation.", available: false },
  { title: "Comptabilité SCF", text: "Écritures, journaux, grand livre et balance selon le Système Comptable Financier algérien.", available: false },
  { title: "Assistant MIZANIA AI", text: "Des réponses en français ou en arabe, fondées sur vos chiffres réels et des sources citées.", available: false },
  { title: "Dossier pour votre comptable", text: "Exports PDF, Excel et CSV prêts à transmettre.", available: false },
];

const FAQ = [
  { q: "MIZANIA remplace-t-il mon comptable ?", a: "Non. MIZANIA vous aide à mieux comprendre et gérer votre activité, et à préparer des informations claires pour votre comptable. Pour les décisions comptables, fiscales ou juridiques importantes, consultez un professionnel." },
  { q: "Mes données sont-elles visibles par d’autres utilisateurs ?", a: "Non. Les données de chaque activité sont isolées : l’application vérifie vos droits à chaque requête, et la base de données refuse elle-même tout accès aux données d’une autre activité." },
  { q: "Les règles fiscales sont-elles appliquées automatiquement ?", a: "Uniquement quand elles ont été vérifiées dans les textes officiels et que votre situation est connue. Sinon, MIZANIA vous l’indique clairement au lieu de deviner." },
  { q: "Combien ça coûte ?", a: "L’accès est gratuit pendant la phase de lancement. Des offres payantes avec des fonctionnalités avancées pourront être proposées plus tard ; vous serez prévenu à l’avance." },
  { q: "Puis-je l’utiliser sur mon téléphone ?", a: "Oui, MIZANIA est conçu d’abord pour le mobile, et fonctionne aussi sur ordinateur." },
];

export default function LandingPage() {
  return (
    <main>
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:pt-20">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs text-ink-700">🇩🇿 Conçu pour l’Algérie · SCF · dinar algérien</p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-ink-900 sm:text-5xl">MIZANIA</h1>
        <p className="mt-3 max-w-3xl text-2xl font-medium leading-snug text-brand-700 sm:text-3xl">Le copilote financier et comptable des entrepreneurs algériens.</p>
        <p className="mt-5 max-w-2xl text-lg text-ink-700">
          MIZANIA vous aide à mieux comprendre et gérer votre activité : savoir combien vous gagnez, combien vous dépensez, et ce qui reste à encaisser — simplement, depuis votre téléphone.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/inscription" className={buttonClass("primary", "md", "px-6 text-base")}>
            Créer mon compte gratuitement
          </Link>
          <Link href="/connexion" className={buttonClass("secondary", "md", "px-6 text-base")}>
            J’ai déjà un compte
          </Link>
        </div>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold">Le problème</h2>
            <p className="mt-3 text-ink-700">
              Carnet, fichiers Excel, reçus dans une boîte… Beaucoup d’entrepreneurs ne savent pas, à un instant donné, si leur activité gagne réellement de l’argent. Les outils existants sont souvent pensés pour d’autres pays et d’autres règles comptables.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">La solution</h2>
            <p className="mt-3 text-ink-700">
              Un outil simple, en français (et bientôt en arabe), pensé pour le contexte algérien : le dinar, les moyens de paiement locaux, le Système Comptable Financier (SCF) et des règles fiscales sourcées et datées.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-semibold">Fonctionnalités</h2>
        <p className="mt-2 text-ink-500">Nous indiquons clairement ce qui est disponible aujourd’hui et ce qui arrive.</p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <li key={f.title} className="rounded-xl border border-line bg-surface p-5">
              <div className="mb-2">{f.available ? <Badge tone="positive">Disponible</Badge> : <Badge>En préparation</Badge>}</div>
              <h3 className="font-medium">{f.title}</h3>
              <p className="mt-1 text-sm text-ink-500">{f.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-brand-800 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-3">
          <div>
            <h2 className="text-xl font-semibold">Comptabilité algérienne (SCF)</h2>
            <p className="mt-2 text-sm text-brand-100">
              Le référentiel comptable utilisé est le Système Comptable Financier algérien (loi n° 07-11), pas le plan comptable français. Aucun numéro de compte n’est inventé : en cas de doute, MIZANIA le dit.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold">Règles sourcées et datées</h2>
            <p className="mt-2 text-sm text-brand-100">
              Chaque règle fiscale est associée à un texte officiel, une date d’effet et une date de vérification. Une règle non vérifiée n’est jamais appliquée automatiquement.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold">Sécurité</h2>
            <p className="mt-2 text-sm text-brand-100">
              Mots de passe chiffrés (Argon2id), sessions révocables, données isolées par activité jusque dans la base de données, aucune clé d’accès exposée dans le navigateur.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-2xl font-semibold">Questions fréquentes</h2>
        <div className="mt-6 divide-y divide-line rounded-xl border border-line bg-surface">
          {FAQ.map((f) => (
            <details key={f.q} className="group px-5 py-4">
              <summary className="cursor-pointer list-none font-medium marker:hidden">
                <span className="flex items-center justify-between gap-4">
                  {f.q}
                  <span className="text-ink-500 transition-transform group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-2 text-sm text-ink-700">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-2xl border border-accent-500/40 bg-accent-100 p-6 text-sm text-accent-700">
          <strong>Avertissement.</strong> MIZANIA est un outil d’assistance. Les informations fournies ne constituent pas automatiquement un avis professionnel personnalisé. Pour les situations complexes ou importantes, vérifiez auprès d’un professionnel compétent ou des sources officielles.{" "}
          <Link href="/avertissement" className="underline">
            Lire l’avertissement complet
          </Link>
        </div>
        <div className="mt-10 text-center">
          <h2 className="text-2xl font-semibold">Prêt à y voir plus clair ?</h2>
          <Link href="/inscription" className={buttonClass("primary", "md", "mt-5 px-6 text-base")}>
            Créer mon compte gratuitement
          </Link>
        </div>
      </section>
    </main>
  );
}
