type LogoProps = { className?: string; withWordmark?: boolean };

/** Logo MIZANIA : une balance (« mizan ») stylisée — équilibre débit / crédit. */
export function Logo({ className, withWordmark = true }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <svg viewBox="0 0 64 64" aria-hidden="true" className="h-8 w-8 shrink-0">
        <rect width="64" height="64" rx="14" fill="var(--color-brand-700)" />
        <path d="M32 14v34M18 48h28M14 22h36" stroke="#F4F1E8" strokeWidth="4" strokeLinecap="round" />
        <path
          d="M14 22l-6 12h12zM50 22l-6 12h12z"
          fill="none"
          stroke="var(--color-accent-500)"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <circle cx="32" cy="14" r="3.5" fill="var(--color-accent-500)" />
      </svg>
      {withWordmark && (
        <span className="text-lg font-semibold tracking-[0.18em] text-ink-900">MIZANIA</span>
      )}
    </span>
  );
}
