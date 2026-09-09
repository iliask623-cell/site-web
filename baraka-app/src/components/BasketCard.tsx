import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { BasketWithBusiness } from '../lib/types'
import { discountPercent, formatDzd } from '../lib/currency'
import { wilayaName } from '../lib/wilayas'

function formatTime(iso: string, lang: string) {
  return new Date(iso).toLocaleTimeString(lang === 'ar' ? 'ar-DZ' : 'fr-DZ', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function BasketCard({ basket }: { basket: BasketWithBusiness }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage ?? 'fr'
  const soldOut = basket.status === 'sold_out' || basket.quantityAvailable <= 0
  const percent = discountPercent(basket.priceOriginal, basket.priceDiscounted)

  return (
    <Link
      to={`/basket/${basket.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-center justify-between bg-brand-50 px-4 py-2">
        <span className="text-xs font-semibold text-brand-700">{basket.business.name}</span>
        <span className="text-xs text-brand-600">{wilayaName(basket.business.wilaya, lang)}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-brand-900">{basket.title}</h3>
          {basket.isIftar && (
            <span className="shrink-0 rounded-full bg-clay-400/15 px-2 py-0.5 text-xs font-semibold text-clay-600">
              {t('explore.iftar_badge')}
            </span>
          )}
        </div>
        <p className="line-clamp-2 text-sm text-brand-800/70">{basket.description}</p>

        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-brand-600">{formatDzd(basket.priceDiscounted, lang)}</span>
            <span className="text-sm text-brand-800/50 line-through">{formatDzd(basket.priceOriginal, lang)}</span>
          </div>
          {percent > 0 && (
            <span className="rounded-full bg-brand-500 px-2 py-0.5 text-xs font-bold text-white">-{percent}%</span>
          )}
        </div>

        <p className="text-xs text-brand-800/60">
          {t('explore.pickup_between', { start: formatTime(basket.pickupStart, lang), end: formatTime(basket.pickupEnd, lang) })}
        </p>

        <div>
          {soldOut ? (
            <span className="text-xs font-semibold text-clay-600">{t('explore.sold_out')}</span>
          ) : (
            <span className="text-xs font-semibold text-brand-500">
              {t(basket.quantityAvailable === 1 ? 'explore.left_one' : 'explore.left_other', {
                count: basket.quantityAvailable,
              })}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
