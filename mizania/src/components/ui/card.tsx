import type { ReactNode } from "react";
import { cn } from "./cn";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-xl border border-line bg-surface p-4 sm:p-5", className)}>{children}</section>;
}

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-surface px-5 py-10 text-center">
      <p className="font-medium text-ink-900">{title}</p>
      {children && <div className="mx-auto mt-1 max-w-md text-sm text-ink-500">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "positive" | "negative" | "warning" | "brand" }) {
  const tones = {
    neutral: "bg-canvas text-ink-700 border-line",
    positive: "bg-positive/10 text-positive border-positive/20",
    negative: "bg-negative/10 text-negative border-negative/20",
    warning: "bg-accent-100 text-accent-700 border-accent-500/30",
    brand: "bg-brand-50 text-brand-700 border-brand-200",
  };
  return <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", tones[tone])}>{children}</span>;
}
