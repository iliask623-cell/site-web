import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Ban, CheckCircle2 } from 'lucide-react'
import {
  listAllBusinesses,
  listAllReservations,
  setBusinessBlocked,
  type ReservationWithBasketAndBusiness,
} from '../../lib/data'
import type { Business } from '../../lib/types'
import { formatDzd } from '../../lib/currency'
import { wilayaName } from '../../lib/wilayas'

const RESERVATION_STATUS_KEY: Record<string, string> = {
  pending: 'reservations.status_pending',
  picked_up: 'reservations.status_picked_up',
  cancelled: 'reservations.status_cancelled',
  no_show: 'reservations.status_no_show',
}

export default function AdminDashboard() {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage ?? 'fr'
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [reservations, setReservations] = useState<ReservationWithBasketAndBusiness[]>([])
  const [loading, setLoading] = useState(true)

  async function refresh() {
    setLoading(true)
    const [b, r] = await Promise.all([listAllBusinesses(), listAllReservations()])
    setBusinesses(b)
    setReservations(r)
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleToggleBlock(business: Business) {
    await setBusinessBlocked(business.id, !business.blocked)
    refresh()
  }

  if (loading) return <p className="px-4 py-16 text-center text-brand-800/60">{t('common.loading')}</p>

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-8 text-2xl font-bold text-brand-900">{t('admin.dashboard_title')}</h1>

      <section className="mb-12">
        <h2 className="mb-4 text-lg font-semibold text-brand-900">{t('admin.businesses')}</h2>
        {businesses.length === 0 ? (
          <p className="rounded-xl border border-dashed border-brand-200 px-6 py-10 text-center text-brand-800/60">
            {t('admin.no_businesses')}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {businesses.map((b) => (
              <div
                key={b.id}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${
                  b.blocked ? 'border-red-200 bg-red-50' : 'border-brand-100 bg-white'
                }`}
              >
                <div>
                  <p className="font-semibold text-brand-900">
                    {b.name}
                    {b.blocked && (
                      <span className="ms-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                        {t('admin.blocked_badge')}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-brand-800/60">
                    {t(`merchant.categories.${b.category}`)} · {b.commune}, {wilayaName(b.wilaya, lang)}
                  </p>
                </div>
                <button
                  onClick={() => handleToggleBlock(b)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold ${
                    b.blocked
                      ? 'bg-brand-500 text-white hover:bg-brand-600'
                      : 'border border-red-200 text-red-600 hover:bg-red-50'
                  }`}
                >
                  {b.blocked ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                  {t(b.blocked ? 'admin.unblock' : 'admin.block')}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-brand-900">{t('admin.reservations')}</h2>
        {reservations.length === 0 ? (
          <p className="rounded-xl border border-dashed border-brand-200 px-6 py-10 text-center text-brand-800/60">
            {t('admin.no_reservations')}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-brand-100 bg-white">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-brand-100 text-start text-xs uppercase text-brand-800/50">
                  <th className="px-4 py-3 text-start">{t('admin.col_basket')}</th>
                  <th className="px-4 py-3 text-start">{t('admin.col_business')}</th>
                  <th className="px-4 py-3 text-start">{t('admin.col_client')}</th>
                  <th className="px-4 py-3 text-start">{t('basket.quantity')}</th>
                  <th className="px-4 py-3 text-start">{t('merchant.code_label')}</th>
                  <th className="px-4 py-3 text-start">{t('admin.col_status')}</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr key={r.id} className="border-b border-brand-50 last:border-0">
                    <td className="px-4 py-3">{r.basket.title}</td>
                    <td className="px-4 py-3">{r.basket.business.name}</td>
                    <td className="px-4 py-3">{r.client.fullName}</td>
                    <td className="px-4 py-3">
                      {r.quantity} · {formatDzd(r.basket.priceDiscounted * r.quantity, lang)}
                    </td>
                    <td className="px-4 py-3 font-mono">{r.pickupCode}</td>
                    <td className="px-4 py-3">{t(RESERVATION_STATUS_KEY[r.status])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
