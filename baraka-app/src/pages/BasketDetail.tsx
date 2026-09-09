import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MessageCircle, Phone, MapPin, Clock } from 'lucide-react'
import { createReservation, getBasketWithBusiness } from '../lib/data'
import type { BasketWithBusiness } from '../lib/types'
import { discountPercent, formatDzd } from '../lib/currency'
import { wilayaName } from '../lib/wilayas'
import { useAuth } from '../context/AuthContext'

function formatDateTime(iso: string, lang: string) {
  return new Date(iso).toLocaleString(lang === 'ar' ? 'ar-DZ' : 'fr-DZ', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function whatsappLink(phone: string, text: string) {
  const digits = phone.replace(/[^\d]/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

export default function BasketDetail() {
  const { id } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage ?? 'fr'
  const navigate = useNavigate()
  const { profile } = useAuth()

  const [basket, setBasket] = useState<BasketWithBusiness | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [reservedCode, setReservedCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    getBasketWithBusiness(id)
      .then(setBasket)
      .finally(() => setLoading(false))
  }, [id])

  async function handleReserve() {
    if (!basket) return
    if (!profile) {
      navigate('/login', { state: { from: `/basket/${basket.id}` } })
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const reservation = await createReservation(basket.id, profile.id, quantity)
      setReservedCode(reservation.pickupCode)
      const refreshed = await getBasketWithBusiness(basket.id)
      setBasket(refreshed)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error_generic'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <p className="px-4 py-16 text-center text-brand-800/60">{t('common.loading')}</p>
  if (!basket) return <p className="px-4 py-16 text-center text-brand-800/60">{t('explore.empty')}</p>

  const percent = discountPercent(basket.priceOriginal, basket.priceDiscounted)
  const soldOut = basket.status === 'sold_out' || basket.quantityAvailable <= 0

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-sm font-semibold text-brand-700">{basket.business.name}</span>
          {basket.isIftar && (
            <span className="rounded-full bg-clay-400/15 px-2 py-0.5 text-xs font-semibold text-clay-600">
              {t('explore.iftar_badge')}
            </span>
          )}
        </div>
        <h1 className="mb-2 text-2xl font-bold text-brand-900">{basket.title}</h1>
        <p className="mb-4 text-brand-800/70">{basket.description}</p>

        <div className="mb-4 flex items-baseline gap-3">
          <span className="text-2xl font-extrabold text-brand-600">{formatDzd(basket.priceDiscounted, lang)}</span>
          <span className="text-brand-800/50 line-through">{formatDzd(basket.priceOriginal, lang)}</span>
          {percent > 0 && (
            <span className="rounded-full bg-brand-500 px-2 py-0.5 text-xs font-bold text-white">-{percent}%</span>
          )}
        </div>

        <div className="mb-4 flex flex-col gap-2 text-sm text-brand-800/80">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-brand-500" />
            <span>
              {t('basket.pickup_window')} : {formatDateTime(basket.pickupStart, lang)} — {formatDateTime(basket.pickupEnd, lang)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-brand-500" />
            <span>
              {basket.business.address}, {basket.business.commune}, {wilayaName(basket.business.wilaya, lang)}
            </span>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          {basket.business.whatsapp && (
            <a
              href={whatsappLink(basket.business.whatsapp, `Bonjour, je vous contacte au sujet du panier "${basket.title}" sur Baraka.`)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-full border border-brand-300 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100"
            >
              <MessageCircle className="h-4 w-4" /> {t('basket.contact_whatsapp')}
            </a>
          )}
          {basket.business.whatsapp && (
            <a
              href={`tel:${basket.business.whatsapp}`}
              className="flex items-center gap-2 rounded-full border border-brand-300 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100"
            >
              <Phone className="h-4 w-4" /> {t('basket.call')}
            </a>
          )}
        </div>

        <p className="mb-4 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800/80">{t('basket.payment_notice')}</p>

        {reservedCode ? (
          <div className="rounded-2xl border-2 border-brand-500 bg-brand-50 p-5 text-center">
            <p className="mb-1 font-semibold text-brand-700">{t('basket.reserved_success')}</p>
            <p className="mb-1 text-sm text-brand-800/70">{t('basket.your_code')}</p>
            <p className="mb-2 text-3xl font-extrabold tracking-widest text-brand-700">{reservedCode}</p>
            <p className="text-xs text-brand-800/60">{t('basket.show_code_notice')}</p>
          </div>
        ) : soldOut ? (
          <p className="text-center font-semibold text-clay-600">{t('explore.sold_out')}</p>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 text-sm font-medium text-brand-800">
              {t('basket.quantity')}
              <select
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="input w-20"
              >
                {Array.from({ length: Math.min(basket.quantityAvailable, 5) }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={handleReserve}
              disabled={submitting}
              className="flex-1 rounded-full bg-brand-500 px-6 py-3 font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {t('basket.reserve')}
            </button>
          </div>
        )}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  )
}
