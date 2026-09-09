import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Header from './Header'
import { isSupabaseConfigured } from '../lib/data'

export default function Layout() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-brand-100 px-4 py-6 text-center text-xs text-brand-800/60">
        <p>{t('footer.made_in')}</p>
        {!isSupabaseConfigured && <p className="mt-1 font-semibold text-clay-600">{t('footer.demo_mode')}</p>}
      </footer>
    </div>
  )
}
