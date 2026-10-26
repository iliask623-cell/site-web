/** Dates civiles au format ISO « AAAA-MM-JJ », fuseau de l'Algérie. */

export const ALGERIA_TZ = "Africa/Algiers";

export function todayInAlgeria(now: Date = new Date()): string {
  // en-CA produit le format AAAA-MM-JJ.
  return new Intl.DateTimeFormat("en-CA", { timeZone: ALGERIA_TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** Premier jour du mois de `iso`. */
export function startOfMonth(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

/** Ajoute `n` mois à une date « AAAA-MM-01 ». */
export function addMonths(isoMonthStart: string, n: number): string {
  const [y, m] = isoMonthStart.split("-").map(Number);
  const total = y * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}-01`;
}

/** Début de l'exercice contenant `iso`, selon le mois de début (1 = janvier). */
export function startOfFiscalYear(iso: string, startMonth: number): string {
  const [y, m] = iso.split("-").map(Number);
  const year = m >= startMonth ? y : y - 1;
  return `${year}-${String(startMonth).padStart(2, "0")}-01`;
}

const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const MONTHS_LONG = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

export function monthLabel(isoMonthStart: string, long = false): string {
  const [y, m] = isoMonthStart.split("-").map(Number);
  return long ? `${MONTHS_LONG[m - 1]} ${y}` : `${MONTHS[m - 1]} ${String(y).slice(2)}`;
}

/** « 15/03/2026 » */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
