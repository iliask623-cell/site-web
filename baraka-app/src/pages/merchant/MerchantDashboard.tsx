import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  createBasket,
  createBusiness,
  deleteBasket,
  getMyBusiness,
  listBusinessBaskets,
  listBusinessReservations,
  setReservationStatus,
  type ReservationWithClient,
} from '../../lib/data'
import type { Basket, Business, BusinessCategory } from '../../lib/types'
import { formatDzd } from '../../lib/currency'
import { WILAYAS, wilayaCenter } from '../../lib/wilayas'
import { Field } from '../Login'
import LocationPicker from '../../components/LocationPicker'

const CATEGORIES: BusinessCategory[] = ['bakery', 'restaurant', 'grocery', 'hotel', 'other']

export default function MerchantDashboard() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const [business, setBusiness] = useState<Business | null | undefined>(undefined)

  useEffect(() => {
    if (!profile) return
    getMyBusiness(profile.id).then(setBusiness)
  }, [profile])

  if (!profile || business === undefined) return <p className="px-4 py-16 text-center text-brand-800/60">{t('common.loading')}</p>

  if (!business) {
    return <CreateBusinessForm ownerId={profile.id} onCreated={setBusiness} />
  }

  return <BusinessPanel business={business} />
}

function CreateBusinessForm({ ownerId, onCreated }: { ownerId: string; onCreated: (b: Business) => void }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage ?? 'fr'
  const [name, setName] = useState('')
  const [category, setCategory] = useState<BusinessCategory>('bakery')
  const [wilaya, setWilaya] = useState('16')
  const [commune, setCommune] = useState('')
  const [address, setAddress] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [location, setLocation] = useState<[number, number]>(wilayaCenter('16'))
  const [locationTouched, setLocationTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleWilayaChange(code: string) {
    setWilaya(code)
    if (!locationTouched) setLocation(wilayaCenter(code))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const business = await createBusiness({
        ownerId,
        name,
        category,
        wilaya,
        commune,
        address,
        whatsapp,
        latitude: location[0],
        longitude: location[1],
      })
      onCreated(business)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error_generic'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-14">
      <h1 className="mb-6 text-2xl font-bold text-brand-900">{t('merchant.create_business')}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label={t('merchant.business_name')}>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="input" />
        </Field>
        <Field label={t('merchant.category')}>
          <select value={category} onChange={(e) => setCategory(e.target.value as BusinessCategory)} className="input">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t(`merchant.categories.${c}`)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('auth.wilaya')}>
          <select value={wilaya} onChange={(e) => handleWilayaChange(e.target.value)} className="input">
            {WILAYAS.map((w) => (
              <option key={w.code} value={w.code}>
                {w.code} - {lang === 'ar' ? w.ar : w.fr}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('merchant.commune')}>
          <input required value={commune} onChange={(e) => setCommune(e.target.value)} className="input" />
        </Field>
        <Field label={t('merchant.address')}>
          <input required value={address} onChange={(e) => setAddress(e.target.value)} className="input" />
        </Field>
        <LocationPicker
          value={location}
          defaultCenter={wilayaCenter(wilaya)}
          onChange={(lat, lng) => {
            setLocationTouched(true)
            setLocation([lat, lng])
          }}
        />
        <Field label={t('merchant.whatsapp_number')}>
          <input
            required
            type="tel"
            placeholder="+213 5XX XX XX XX"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="input"
          />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-brand-500 px-6 py-3 font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {t('merchant.save')}
        </button>
      </form>
    </div>
  )
}

function BusinessPanel({ business }: { business: Business }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage ?? 'fr'
  const [baskets, setBaskets] = useState<Basket[]>([])
  const [reservations, setReservations] = useState<ReservationWithClient[]>([])
  const [showForm, setShowForm] = useState(false)

  async function refresh() {
    const [b, r] = await Promise.all([listBusinessBaskets(business.id), listBusinessReservations(business.id)])
    setBaskets(b)
    setReservations(r)
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business.id])

  async function handleDelete(id: string) {
    if (!confirm(t('merchant.delete_confirm') ?? '')) return
    await deleteBasket(id)
    refresh()
  }

  async function handleStatus(id: string, status: 'picked_up' | 'no_show') {
    await setReservationStatus(id, status)
    refresh()
  }

  const pendingReservations = reservations.filter((r) => r.status === 'pending')

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-bold text-brand-900">{t('merchant.dashboard_title')}</h1>
      <p className="mb-8 text-brand-800/70">{business.name}</p>

      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-brand-900">{t('merchant.my_baskets')}</h2>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            <Plus className="h-4 w-4" /> {t('merchant.new_basket')}
          </button>
        </div>

        {showForm && (
          <BasketForm
            businessId={business.id}
            onCreated={() => {
              setShowForm(false)
              refresh()
            }}
          />
        )}

        {baskets.length === 0 ? (
          <p className="rounded-xl border border-dashed border-brand-200 px-6 py-10 text-center text-brand-800/60">
            {t('merchant.no_baskets')}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {baskets.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-xl border border-brand-100 bg-white p-4">
                <div>
                  <p className="font-semibold text-brand-900">{b.title}</p>
                  <p className="text-sm text-brand-800/60">
                    {formatDzd(b.priceDiscounted, lang)} · {b.quantityAvailable}/{b.quantityTotal}
                    {b.status === 'sold_out' && ` · ${t('explore.sold_out')}`}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(b.id)}
                  className="rounded-full p-2 text-red-500 hover:bg-red-50"
                  aria-label={t('merchant.delete') ?? ''}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-brand-900">{t('merchant.incoming_reservations')}</h2>
        {pendingReservations.length === 0 ? (
          <p className="rounded-xl border border-dashed border-brand-200 px-6 py-10 text-center text-brand-800/60">
            {t('merchant.no_reservations')}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {pendingReservations.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-100 bg-white p-4">
                <div>
                  <p className="font-semibold text-brand-900">{r.basket.title}</p>
                  <p className="text-sm text-brand-800/60">
                    {r.client.fullName} · {t('basket.quantity')}: {r.quantity} ·{' '}
                    <span className="font-mono font-semibold">{t('merchant.code_label')}: {r.pickupCode}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatus(r.id, 'picked_up')}
                    className="rounded-full bg-brand-500 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-600"
                  >
                    {t('merchant.mark_picked_up')}
                  </button>
                  <button
                    onClick={() => handleStatus(r.id, 'no_show')}
                    className="rounded-full border border-red-200 px-3.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    {t('merchant.mark_no_show')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function BasketForm({ businessId, onCreated }: { businessId: string; onCreated: () => void }) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priceOriginal, setPriceOriginal] = useState(500)
  const [priceDiscounted, setPriceDiscounted] = useState(200)
  const [quantityTotal, setQuantityTotal] = useState(5)
  const [pickupStart, setPickupStart] = useState('')
  const [pickupEnd, setPickupEnd] = useState('')
  const [isIftar, setIsIftar] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await createBasket({
        businessId,
        title,
        description,
        priceOriginal,
        priceDiscounted,
        quantityTotal,
        pickupStart: new Date(pickupStart).toISOString(),
        pickupEnd: new Date(pickupEnd).toISOString(),
        isIftar,
      })
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error_generic'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 flex flex-col gap-4 rounded-2xl border border-brand-100 bg-white p-5">
      <Field label={t('merchant.basket_title')}>
        <input required value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
      </Field>
      <Field label={t('merchant.description')}>
        <textarea required value={description} onChange={(e) => setDescription(e.target.value)} className="input" rows={2} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label={t('merchant.price_original')}>
          <input
            required
            type="number"
            min={0}
            value={priceOriginal}
            onChange={(e) => setPriceOriginal(Number(e.target.value))}
            className="input"
          />
        </Field>
        <Field label={t('merchant.price_discounted')}>
          <input
            required
            type="number"
            min={0}
            value={priceDiscounted}
            onChange={(e) => setPriceDiscounted(Number(e.target.value))}
            className="input"
          />
        </Field>
      </div>
      <Field label={t('merchant.quantity_total')}>
        <input
          required
          type="number"
          min={1}
          value={quantityTotal}
          onChange={(e) => setQuantityTotal(Number(e.target.value))}
          className="input"
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label={t('merchant.pickup_start')}>
          <input
            required
            type="datetime-local"
            value={pickupStart}
            onChange={(e) => setPickupStart(e.target.value)}
            className="input"
          />
        </Field>
        <Field label={t('merchant.pickup_end')}>
          <input
            required
            type="datetime-local"
            value={pickupEnd}
            onChange={(e) => setPickupEnd(e.target.value)}
            className="input"
          />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm font-medium text-brand-800">
        <input type="checkbox" checked={isIftar} onChange={(e) => setIsIftar(e.target.checked)} />
        {t('merchant.is_iftar')}
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-brand-500 px-6 py-2.5 font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
      >
        {t('merchant.publish')}
      </button>
    </form>
  )
}
