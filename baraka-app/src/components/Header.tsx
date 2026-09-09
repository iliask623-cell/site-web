import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Logo from './Logo'
import LanguageSwitcher from './LanguageSwitcher'
import { useAuth } from '../context/AuthContext'
import { signOut } from '../lib/data'

export default function Header() {
  const { t } = useTranslation()
  const { profile } = useAuth()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors ${isActive ? 'text-brand-600' : 'text-brand-800/70 hover:text-brand-600'}`

  return (
    <header className="sticky top-0 z-40 border-b border-brand-100 bg-sand-50/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <Logo size={36} />
          <span className="text-lg font-bold text-brand-700">{t('app.name')}</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <NavLink to="/explore" className={linkClass}>
            {t('nav.explore')}
          </NavLink>
          {profile?.role === 'client' && (
            <NavLink to="/reservations" className={linkClass}>
              {t('nav.reservations')}
            </NavLink>
          )}
          {profile?.role === 'merchant' && (
            <NavLink to="/merchant" className={linkClass}>
              {t('nav.merchant')}
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {profile ? (
            <button
              onClick={() => signOut()}
              className="rounded-full border border-brand-300 px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-100"
            >
              {t('nav.logout')}
            </button>
          ) : (
            <Link
              to="/login"
              className="rounded-full bg-brand-500 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-brand-600"
            >
              {t('nav.login')}
            </Link>
          )}
        </div>
      </div>

      <nav className="flex items-center justify-around border-t border-brand-100 py-2 md:hidden">
        <NavLink to="/explore" className={linkClass}>
          {t('nav.explore')}
        </NavLink>
        {profile?.role === 'client' && (
          <NavLink to="/reservations" className={linkClass}>
            {t('nav.reservations')}
          </NavLink>
        )}
        {profile?.role === 'merchant' && (
          <NavLink to="/merchant" className={linkClass}>
            {t('nav.merchant')}
          </NavLink>
        )}
      </nav>
    </header>
  )
}
