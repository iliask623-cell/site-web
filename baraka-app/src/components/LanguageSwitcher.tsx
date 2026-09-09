import { useTranslation } from 'react-i18next'

const LANGS = [
  { code: 'fr', label: 'FR' },
  { code: 'ar', label: 'AR' },
  { code: 'en', label: 'EN' },
]

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()

  return (
    <div className="flex items-center gap-1 rounded-full bg-brand-50 p-1 text-xs font-semibold">
      {LANGS.map((lang) => (
        <button
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          className={`rounded-full px-2.5 py-1 transition-colors ${
            i18n.resolvedLanguage === lang.code
              ? 'bg-brand-500 text-white'
              : 'text-brand-700 hover:bg-brand-100'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  )
}
