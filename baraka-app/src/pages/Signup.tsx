import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { signUp, isSupabaseConfigured } from '../lib/data'
import { useAuth } from '../context/AuthContext'
import { WILAYAS } from '../lib/wilayas'
import { Field } from './Login'
import type { UserRole } from '../lib/types'

export default function Signup() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { setProfile } = useAuth()
  const lang = i18n.resolvedLanguage ?? 'fr'

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [wilaya, setWilaya] = useState('16')
  const [role, setRole] = useState<UserRole>('client')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const profile = await signUp({ email, password, fullName, phone, role, wilaya })
      setProfile(profile)
      navigate(role === 'merchant' ? '/merchant' : '/explore')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error_generic'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-bold text-brand-900">{t('auth.signup_title')}</h1>
      {!isSupabaseConfigured && (
        <p className="rounded-xl bg-clay-400/10 px-4 py-3 text-sm text-clay-600">{t('auth.demo_notice')}</p>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex gap-2 rounded-xl bg-brand-50 p-1">
          <button
            type="button"
            onClick={() => setRole('client')}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              role === 'client' ? 'bg-brand-500 text-white' : 'text-brand-700'
            }`}
          >
            {t('auth.role_client')}
          </button>
          <button
            type="button"
            onClick={() => setRole('merchant')}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              role === 'merchant' ? 'bg-brand-500 text-white' : 'text-brand-700'
            }`}
          >
            {t('auth.role_merchant')}
          </button>
        </div>

        <Field label={t('auth.full_name')}>
          <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" />
        </Field>
        <Field label={t('auth.phone')}>
          <input
            required
            type="tel"
            placeholder="+213 5XX XX XX XX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input"
          />
        </Field>
        <Field label={t('auth.wilaya')}>
          <select value={wilaya} onChange={(e) => setWilaya(e.target.value)} className="input">
            {WILAYAS.map((w) => (
              <option key={w.code} value={w.code}>
                {w.code} - {lang === 'ar' ? w.ar : w.fr}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('auth.email')}>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
        </Field>
        <Field label={t('auth.password')}>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-brand-500 px-6 py-3 font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {t('auth.submit_signup')}
        </button>
      </form>
      <p className="text-sm text-brand-800/70">
        {t('auth.has_account')}{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:underline">
          {t('auth.login_link')}
        </Link>
      </p>
    </div>
  )
}
