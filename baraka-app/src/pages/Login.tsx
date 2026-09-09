import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { signIn } from '../lib/data'
import { useAuth } from '../context/AuthContext'
import { isSupabaseConfigured } from '../lib/data'

export default function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { setProfile } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const profile = await signIn(email, password)
      setProfile(profile)
      const redirectTo = (location.state as { from?: string } | null)?.from
      navigate(redirectTo ?? (profile.role === 'merchant' ? '/merchant' : '/explore'))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error_generic'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-bold text-brand-900">{t('auth.login_title')}</h1>
      {!isSupabaseConfigured && (
        <p className="rounded-xl bg-clay-400/10 px-4 py-3 text-sm text-clay-600">{t('auth.demo_notice')}</p>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label={t('auth.email')}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
        </Field>
        <Field label={t('auth.password')}>
          <input
            type="password"
            required
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
          {t('auth.submit_login')}
        </button>
      </form>
      <p className="text-sm text-brand-800/70">
        {t('auth.no_account')}{' '}
        <Link to="/signup" className="font-semibold text-brand-600 hover:underline">
          {t('auth.signup_link')}
        </Link>
      </p>
    </div>
  )
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-brand-800">{label}</span>
      {children}
    </label>
  )
}
