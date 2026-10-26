import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-60";
const variants: Record<Variant, string> = {
  primary: "bg-brand-700 text-white hover:bg-brand-800",
  secondary: "border border-line bg-surface text-ink-900 hover:bg-canvas",
  ghost: "text-ink-700 hover:bg-brand-50 hover:text-ink-900",
  danger: "bg-negative text-white hover:opacity-90",
};
// Hauteur minimale 44 px : utilisable au doigt.
const sizes: Record<Size, string> = { md: "min-h-11 px-4 text-sm", sm: "min-h-9 px-3 text-sm" };

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button({
  variant,
  size,
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
