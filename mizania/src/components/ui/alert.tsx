import type { ReactNode } from "react";
import { cn } from "./cn";

type Tone = "info" | "success" | "warning" | "error";

const tones: Record<Tone, string> = {
  info: "border-brand-200 bg-brand-50 text-brand-800",
  success: "border-positive/30 bg-positive/10 text-positive",
  warning: "border-accent-500/40 bg-accent-100 text-accent-700",
  error: "border-negative/30 bg-negative/10 text-negative",
};

export function Alert({ tone = "info", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("rounded-lg border px-4 py-3 text-sm", tones[tone], className)}>
      {children}
    </div>
  );
}
