import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { listActiveBaskets } from '../lib/data'
import type { BasketWithBusiness } from '../lib/types'
import { WILAYAS } from '../lib/wilayas'
import BasketCard from '../components/BasketCard'

export default function Explore() {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage ?? 'fr'
  const [baskets, setBaskets] = useState<BasketWithBusiness[]>([])
  const [loading, setLoading] = useState(true)
  const [wilaya, setWilaya] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    listActiveBaskets({ wilaya: wilaya || undefined, search: search || undefined })
      .then((result) => {
        if (!cancelled) setBaskets(result)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [wilaya, search])

  const hasIftar = useMemo(() => baskets.some((b) => b.isIftar), [baskets])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-brand-900">{t('explore.title')}</h1>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-800/40 rtl:left-auto rtl:right-3" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('explore.search_placeholder') ?? ''}
            className="input pl-9 rtl:pl-3.5 rtl:pr-9"
          />
        </div>
        <select value={wilaya} onChange={(e) => setWilaya(e.target.value)} className="input sm:w-64">
          <option value="">{t('explore.all_wilayas')}</option>
          {WILAYAS.map((w) => (
            <option key={w.code} value={w.code}>
              {w.code} - {lang === 'ar' ? w.ar : w.fr}
            </option>
          ))}
        </select>
      </div>

      {hasIftar && (
        <p className="mb-6 rounded-xl bg-clay-400/10 px-4 py-3 text-sm font-medium text-clay-600">
          {t('landing.ramadan_banner')}
        </p>
      )}

      {loading ? (
        <p className="text-brand-800/60">{t('common.loading')}</p>
      ) : baskets.length === 0 ? (
        <p className="rounded-xl border border-dashed border-brand-200 px-6 py-12 text-center text-brand-800/60">
          {t('explore.empty')}
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {baskets.map((basket) => (
            <BasketCard key={basket.id} basket={basket} />
          ))}
        </div>
      )}
    </div>
  )
}
