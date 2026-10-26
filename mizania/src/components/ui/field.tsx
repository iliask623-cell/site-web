import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";

export const inputClass =
  "block w-full min-h-11 rounded-lg border border-line bg-surface px-3 text-base text-ink-900 placeholder:text-ink-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 aria-[invalid=true]:border-negative";

export function Field({
  label,
  name,
  error,
  hint,
  optional,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-medium text-ink-900">
        {label}
        {optional && <span className="font-normal text-ink-500"> (facultatif)</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-ink-500">{hint}</p>}
      {error && (
        <p id={`${name}-error`} className="text-sm text-negative" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

type WithError = { error?: string };

export function Input({ error, className, ...props }: ComponentProps<"input"> & WithError) {
  return (
    <input
      id={props.name}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${props.name}-error` : undefined}
      className={cn(inputClass, className)}
      {...props}
    />
  );
}

export function Select({ error, className, ...props }: ComponentProps<"select"> & WithError) {
  return (
    <select
      id={props.name}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${props.name}-error` : undefined}
      className={cn(inputClass, "pr-8", className)}
      {...props}
    />
  );
}

export function Textarea({ error, className, ...props }: ComponentProps<"textarea"> & WithError) {
  return (
    <textarea
      id={props.name}
      aria-invalid={error ? true : undefined}
      className={cn(inputClass, "min-h-24 py-2", className)}
      {...props}
    />
  );
}
