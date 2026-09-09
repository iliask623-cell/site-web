import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { List, Map as MapIcon, Search } from 'lucide-react'
import { listActiveBaskets } from '../lib/data'
import type { BasketWithBusiness } from '../lib/types'
import { WILAYAS, wilayaCenter } from '../lib/wilayas'
import BasketCard from '../components/BasketCard'
import MapView, { type MapMarker } from '../components/MapView'

export default function Explore() {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage ?? 'fr'
  const navigate = useNavigate()
  const [baskets, setBaskets] = useState<BasketWithBusiness[]>([])
  const [loading, setLoading] = useState(true)
  const [wilaya, setWilaya] = useState('')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'list' | 'map'>('list')

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

  const markers: MapMarker[] = useMemo(() => {
    const byBusiness = new Map<string, { basketId: string; business: BasketWithBusiness['business']; count: number }>()
    for (const b of baskets) {
      const existing = byBusiness.get(b.business.id)
      if (existing) existing.count += 1
      else byBusiness.set(b.business.id, { basketId: b.id, business: b.business, count: 1 })
    }
    return Array.from(byBusiness.values()).map(({ basketId, business, count }) => ({
      id: basketId,
      lat: business.latitude,
      lng: business.longitude,
      label: business.name,
      sublabel: t(count === 1 ? 'explore.left_one' : 'explore.left_other', { count }) as string,
    }))
  }, [baskets, t])

  const mapCenter: [number, number] = wilaya ? wilayaCenter(wilaya) : [36.6, 3.5]
  const mapZoom = wilaya ? 12 : 6

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
        <div className="flex shrink-0 items-center gap-1 rounded-full bg-brand-50 p-1">
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
              view === 'list' ? 'bg-brand-500 text-white' : 'text-brand-700'
            }`}
          >
            <List className="h-4 w-4" /> {t('explore.view_list')}
          </button>
          <button
            onClick={() => setView('map')}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
              view === 'map' ? 'bg-brand-500 text-white' : 'text-brand-700'
            }`}
          >
            <MapIcon className="h-4 w-4" /> {t('explore.view_map')}
          </button>
        </div>
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
      ) : view === 'map' ? (
        <MapView markers={markers} center={mapCenter} zoom={mapZoom} onMarkerClick={(id) => navigate(`/basket/${id}`)} />
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
