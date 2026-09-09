import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Leaf, Percent, Store, Search, PackageCheck, HandCoins } from 'lucide-react'

export default function Landing() {
  const { t } = useTranslation()

  return (
    <div>
      <section className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 py-16 text-center md:py-24">
        <span className="rounded-full bg-brand-100 px-4 py-1.5 text-sm font-semibold text-brand-700">
          🇩🇿 Anti-gaspillage · Algérie
        </span>
        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-brand-900 md:text-6xl">
          {t('landing.hero_title')}
        </h1>
        <p className="max-w-2xl text-lg text-brand-800/80">{t('landing.hero_subtitle')}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/explore"
            className="rounded-full bg-brand-500 px-6 py-3 font-semibold text-white shadow-sm hover:bg-brand-600"
          >
            {t('landing.cta_explore')}
          </Link>
          <Link
            to="/merchant"
            className="rounded-full border border-brand-300 px-6 py-3 font-semibold text-brand-700 hover:bg-brand-100"
          >
            {t('landing.cta_merchant')}
          </Link>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-10 text-center text-2xl font-bold text-brand-900">{t('landing.how_it_works')}</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <Step icon={<Search className="h-7 w-7" />} title={t('landing.step1_title')} text={t('landing.step1_text')} />
            <Step icon={<HandCoins className="h-7 w-7" />} title={t('landing.step2_title')} text={t('landing.step2_text')} />
            <Step icon={<PackageCheck className="h-7 w-7" />} title={t('landing.step3_title')} text={t('landing.step3_text')} />
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-10 text-center text-2xl font-bold text-brand-900">{t('landing.why_title')}</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Feature icon={<Leaf className="h-6 w-6" />} title={t('landing.why_waste_title')} text={t('landing.why_waste_text')} />
            <Feature icon={<Percent className="h-6 w-6" />} title={t('landing.why_price_title')} text={t('landing.why_price_text')} />
            <Feature icon={<Store className="h-6 w-6" />} title={t('landing.why_local_title')} text={t('landing.why_local_text')} />
          </div>
        </div>
      </section>

      <section className="bg-brand-700 py-16 text-white">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 text-center">
          <h2 className="text-2xl font-bold">{t('landing.merchant_cta_title')}</h2>
          <p className="max-w-xl text-brand-50/90">{t('landing.merchant_cta_text')}</p>
          <Link
            to="/merchant"
            className="mt-2 rounded-full bg-white px-6 py-3 font-semibold text-brand-700 hover:bg-brand-50"
          >
            {t('landing.merchant_cta_button')}
          </Link>
        </div>
      </section>
    </div>
  )
}

function Step({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">{icon}</div>
      <h3 className="font-semibold text-brand-900">{title}</h3>
      <p className="text-sm text-brand-800/70">{text}</p>
    </div>
  )
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-6">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-clay-400/15 text-clay-600">
        {icon}
      </div>
      <h3 className="mb-1 font-semibold text-brand-900">{title}</h3>
      <p className="text-sm text-brand-800/70">{text}</p>
    </div>
  )
}
