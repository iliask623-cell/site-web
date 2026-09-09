import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { cancelReservation, listMyReservations } from '../lib/data'
import type { ReservationWithBasket } from '../lib/types'
import { formatDzd } from '../lib/currency'
import { useAuth } from '../context/AuthContext'

const STATUS_KEY: Record<string, string> = {
  pending: 'reservations.status_pending',
  picked_up: 'reservations.status_picked_up',
  cancelled: 'reservations.status_cancelled',
  no_show: 'reservations.status_no_show',
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-brand-100 text-brand-700',
  picked_up: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-gray-100 text-gray-600',
  no_show: 'bg-red-100 text-red-600',
}

export default function MyReservations() {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage ?? 'fr'
  const { profile } = useAuth()
  const [reservations, setReservations] = useState<ReservationWithBasket[]>([])
  const [loading, setLoading] = useState(true)

  async function refresh() {
    if (!profile) return
    setLoading(true)
    const list = await listMyReservations(profile.id)
    setReservations(list)
    setLoading(false)
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id])

  async function handleCancel(id: string) {
    if (!confirm(t('reservations.cancel_confirm') ?? '')) return
    await cancelReservation(id)
    refresh()
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-brand-900">{t('reservations.title')}</h1>

      {loading ? (
        <p className="text-brand-800/60">{t('common.loading')}</p>
      ) : reservations.length === 0 ? (
        <p className="rounded-xl border border-dashed border-brand-200 px-6 py-12 text-center text-brand-800/60">
          {t('reservations.empty')}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {reservations.map((r) => (
            <div key={r.id} className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <Link to={`/basket/${r.basket.id}`} className="font-semibold text-brand-900 hover:underline">
                    {r.basket.title}
                  </Link>
                  <p className="text-sm text-brand-800/60">{r.basket.business.name}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLOR[r.status]}`}>
                  {t(STATUS_KEY[r.status])}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-brand-800/70">
                <span>
                  {t('basket.quantity')} : {r.quantity} · {formatDzd(r.basket.priceDiscounted * r.quantity, lang)}
                </span>
                <span className="font-mono font-semibold text-brand-700">
                  {t('merchant.code_label')}: {r.pickupCode}
                </span>
              </div>
              {r.status === 'pending' && (
                <button
                  onClick={() => handleCancel(r.id)}
                  className="mt-3 rounded-full border border-red-200 px-4 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  {t('reservations.cancel')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
