import { z } from "zod";
import { isIsoDate } from "@/lib/dates";
import { parseAmount } from "@/lib/money";

export const PAYMENT_METHODS = {
  cash: "Espèces",
  bank_transfer: "Virement bancaire",
  cheque: "Chèque",
  card: "Carte (CIB / Edahabia)",
  ccp: "CCP",
  baridimob: "BaridiMob",
  other: "Autre",
} as const;

export const TRANSACTION_STATUSES = {
  income: { settled: "Encaissée", pending: "À encaisser", cancelled: "Annulée" },
  expense: { settled: "Payée", pending: "À payer", cancelled: "Annulée" },
} as const;

export type Direction = "income" | "expense";

const paymentKeys = Object.keys(PAYMENT_METHODS) as [keyof typeof PAYMENT_METHODS, ...(keyof typeof PAYMENT_METHODS)[]];

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `${max} caractères maximum.`)
    .optional()
    .transform((v) => (v ? v : null));

export const transactionSchema = z.object({
  amount: z
    .string({ error: "Montant requis." })
    .transform((v, ctx) => {
      const cents = parseAmount(v);
      if (cents === null) {
        ctx.addIssue({ code: "custom", message: "Montant invalide. Exemple : 120 000 ou 1 500,50" });
        return z.NEVER;
      }
      if (cents <= 0) {
        ctx.addIssue({ code: "custom", message: "Le montant doit être supérieur à zéro." });
        return z.NEVER;
      }
      return cents;
    }),
  occurredOn: z
    .string({ error: "Date requise." })
    .refine(isIsoDate, "Date invalide.")
    .refine((d) => d >= "2000-01-01" && d <= "2099-12-31", "Date hors de la période acceptée."),
  label: z.string({ error: "Libellé requis." }).trim().min(1, "Indiquez un libellé.").max(200, "200 caractères maximum."),
  categoryName: optional(60),
  paymentMethod: z.preprocess((v) => (v === "" ? undefined : v), z.enum(paymentKeys).optional()).transform((v) => v ?? null),
  status: z.enum(["settled", "pending", "cancelled"], { error: "Statut invalide." }),
  description: optional(1000),
});

export type TransactionInput = z.infer<typeof transactionSchema>;

export const SORTS = {
  date_desc: "Plus récentes",
  date_asc: "Plus anciennes",
  amount_desc: "Montant décroissant",
  amount_asc: "Montant croissant",
} as const;

export const listFiltersSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  status: z.enum(["settled", "pending", "cancelled"]).optional().catch(undefined),
  category: z.uuid().optional().catch(undefined),
  from: z.string().refine(isIsoDate).optional().catch(undefined),
  to: z.string().refine(isIsoDate).optional().catch(undefined),
  sort: z.enum(Object.keys(SORTS) as [keyof typeof SORTS, ...(keyof typeof SORTS)[]]).default("date_desc").catch("date_desc"),
  page: z.coerce.number().int().min(1).max(10_000).default(1).catch(1),
});

export type ListFilters = z.infer<typeof listFiltersSchema>;
