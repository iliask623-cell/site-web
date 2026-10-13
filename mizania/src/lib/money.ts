/**
 * Montants en dinars algériens (DZD), représentés en **centimes entiers**.
 *
 * 1 DA = 100 centimes. Aucun calcul financier ne doit utiliser de nombres
 * flottants : on manipule des entiers et on n'arrondit qu'à des étapes
 * explicites (pourcentage, quantité), avec une règle unique documentée.
 *
 * Règle d'arrondi : au centime le plus proche, demi-unité arrondie en
 * s'éloignant de zéro (arrondi commercial). Si une règle fiscale impose un
 * autre arrondi, elle devra être appliquée dans la couche fiscale.
 */

export type Cents = number;

/** Plus grand montant accepté : 1 000 milliards de DA (bien en deçà de 2^53). */
export const MAX_CENTS = 100_000_000_000_000;

export class MoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MoneyError";
  }
}

export function assertCents(value: number, label = "montant"): Cents {
  if (!Number.isSafeInteger(value)) {
    throw new MoneyError(`${label} invalide : doit être un nombre entier de centimes.`);
  }
  if (Math.abs(value) > MAX_CENTS) {
    throw new MoneyError(`${label} hors limites.`);
  }
  return value;
}

export function isValidCents(value: unknown): value is Cents {
  return typeof value === "number" && Number.isSafeInteger(value) && Math.abs(value) <= MAX_CENTS;
}

/**
 * Convertit une saisie utilisateur en centimes. Renvoie `null` si la saisie
 * est ambiguë ou invalide (on préfère refuser plutôt que deviner).
 *
 * Formats acceptés : « 120000 », « 120 000 », « 120 000,50 », « 120.000,50 »,
 * « 120000.50 », « 1 200 DA », « -500 ».
 * - La virgule est toujours le séparateur décimal.
 * - Sans virgule, un point suivi de 1 ou 2 chiffres finaux est décimal ;
 *   sinon les points sont des séparateurs de milliers (groupes de 3 chiffres).
 */
export function parseAmount(input: string): Cents | null {
  let s = input
    .trim()
    .replace(/\s*(DA|DZD|دج)\s*$/i, "")
    .replace(/[\s  ]/g, "");
  if (s === "") return null;

  let negative = false;
  if (s.startsWith("-")) {
    negative = true;
    s = s.slice(1);
  }

  let intPart: string;
  let decPart = "";

  if (s.includes(",")) {
    const parts = s.split(",");
    if (parts.length !== 2) return null;
    [intPart, decPart] = parts;
    if (!isGroupedOrPlain(intPart, ".")) return null;
    intPart = intPart.replace(/\./g, "");
  } else {
    const dots = s.split(".");
    if (dots.length === 2 && /^\d{1,2}$/.test(dots[1])) {
      [intPart, decPart] = dots;
    } else {
      if (!isGroupedOrPlain(s, ".")) return null;
      intPart = s.replace(/\./g, "");
    }
  }

  if (!/^\d+$/.test(intPart) || !/^\d{0,2}$/.test(decPart)) return null;

  const cents = Number(intPart) * 100 + Number(decPart.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents > MAX_CENTS) return null;
  return negative ? -cents : cents;
}

function isGroupedOrPlain(value: string, sep: string): boolean {
  if (!value.includes(sep)) return /^\d+$/.test(value);
  const groups = value.split(sep);
  // Un premier groupe commençant par 0 (« 0.001 ») est ambigu : refusé.
  return /^[1-9]\d{0,2}$/.test(groups[0]) && groups.slice(1).every((g) => /^\d{3}$/.test(g));
}

/** Formate en « 120 000,50 DA » (espaces fines insécables comme séparateurs). */
export function formatDA(cents: Cents, options: { withDecimals?: boolean; withUnit?: boolean } = {}): string {
  assertCents(cents);
  const { withDecimals = true, withUnit = true } = options;
  const negative = cents < 0;
  const abs = Math.abs(cents);
  let units = Math.floor(abs / 100);
  let rest = abs % 100;
  if (!withDecimals && rest >= 50) {
    units += 1;
    rest = 0;
  }
  const grouped = String(units).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const decimals = withDecimals ? `,${String(rest).padStart(2, "0")}` : "";
  return `${negative ? "−" : ""}${grouped}${decimals}${withUnit ? " DA" : ""}`;
}

/** Valeur décimale en chaîne (« 120000.50 ») pour les exports CSV/Excel. */
export function toDecimalString(cents: Cents): string {
  assertCents(cents);
  const negative = cents < 0;
  const abs = Math.abs(cents);
  return `${negative ? "-" : ""}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

export function sumCents(values: readonly Cents[]): Cents {
  let total = 0;
  for (const v of values) total += assertCents(v);
  return assertCents(total, "total");
}

/** Division entière arrondie au plus proche, demi-unité loin de zéro (BigInt). */
function roundDiv(numerator: bigint, denominator: bigint): bigint {
  const negative = numerator < BigInt(0) !== denominator < BigInt(0);
  const n = numerator < BigInt(0) ? -numerator : numerator;
  const d = denominator < BigInt(0) ? -denominator : denominator;
  const q = (n * BigInt(2) + d) / (d * BigInt(2));
  return negative ? -q : q;
}

/**
 * Applique un taux exprimé en points de base (1 % = 100 pb, 19 % = 1900 pb).
 * Le taux lui-même ne doit jamais être codé en dur : il vient de la couche fiscale.
 */
export function applyBasisPoints(cents: Cents, basisPoints: number): Cents {
  assertCents(cents);
  if (!Number.isSafeInteger(basisPoints) || basisPoints < 0 || basisPoints > 100_000) {
    throw new MoneyError("Taux invalide.");
  }
  return assertCents(Number(roundDiv(BigInt(cents) * BigInt(basisPoints), BigInt(10_000))));
}

/**
 * Prix unitaire × quantité. La quantité est exprimée en millièmes
 * (1 unité = 1000) pour permettre 2,5 h ou 0,750 kg sans flottant.
 */
export function multiplyQuantity(unitCents: Cents, quantityMilli: number): Cents {
  assertCents(unitCents);
  if (!Number.isSafeInteger(quantityMilli) || quantityMilli < 0) {
    throw new MoneyError("Quantité invalide.");
  }
  return assertCents(Number(roundDiv(BigInt(unitCents) * BigInt(quantityMilli), BigInt(1000))));
}
