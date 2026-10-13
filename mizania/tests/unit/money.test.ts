import { describe, expect, it } from "vitest";
import {
  applyBasisPoints,
  assertCents,
  formatDA,
  MAX_CENTS,
  multiplyQuantity,
  parseAmount,
  sumCents,
  toDecimalString,
} from "@/lib/money";

describe("parseAmount", () => {
  it.each([
    ["120000", 12_000_000],
    ["120 000", 12_000_000],
    ["120 000", 12_000_000],
    ["120 000,50", 12_000_050],
    ["120 000,5", 12_000_050],
    ["120.000,50", 12_000_050],
    ["1.200.000", 120_000_000],
    ["120000.50", 12_000_050],
    ["0,01", 1],
    ["1 200 DA", 120_000],
    ["1 200 DZD", 120_000],
    ["-500", -50_000],
    ["0", 0],
  ])("%s → %d centimes", (input, expected) => {
    expect(parseAmount(input)).toBe(expected);
  });

  it.each(["", "abc", "12,345", "1,2,3", "12.34.56", "1.20.000", "12 000,5x", "--5", "1e5", "0.001"])(
    "refuse « %s »",
    (input) => {
      expect(parseAmount(input)).toBeNull();
    },
  );

  it("refuse les montants hors limites", () => {
    expect(parseAmount("99999999999999999")).toBeNull();
  });
});

describe("formatDA", () => {
  it("formate avec séparateurs et unité", () => {
    expect(formatDA(12_000_050)).toBe("120 000,50 DA");
    expect(formatDA(0)).toBe("0,00 DA");
    expect(formatDA(5)).toBe("0,05 DA");
    expect(formatDA(-150_000)).toBe("−1 500,00 DA");
  });

  it("peut masquer décimales et unité", () => {
    expect(formatDA(12_000_050, { withDecimals: false })).toBe("120 001 DA");
    expect(formatDA(12_000_049, { withDecimals: false, withUnit: false })).toBe("120 000");
  });

  it("aller-retour parse ∘ format", () => {
    for (const v of [0, 1, 99, 100, 123_456_789, 10_000_000_000]) {
      expect(parseAmount(formatDA(v))).toBe(v);
    }
  });
});

describe("calculs", () => {
  it("sumCents additionne sans erreur de flottant", () => {
    // 0,10 + 0,20 = 0,30 exactement
    expect(sumCents([10, 20])).toBe(30);
    expect(sumCents([])).toBe(0);
  });

  it("refuse les valeurs non entières", () => {
    expect(() => sumCents([10.5])).toThrow();
    expect(() => assertCents(Number.NaN)).toThrow();
    expect(() => assertCents(MAX_CENTS + 1)).toThrow();
  });

  it("applyBasisPoints arrondit au centime (demi loin de zéro)", () => {
    expect(applyBasisPoints(10_000, 1900)).toBe(1900); // 19 % de 100 DA
    expect(applyBasisPoints(5, 1000)).toBe(1); // 0,5 centime → 1
    expect(applyBasisPoints(4, 1000)).toBe(0); // 0,4 centime → 0
    expect(applyBasisPoints(-5, 1000)).toBe(-1);
    expect(applyBasisPoints(MAX_CENTS, 10_000)).toBe(MAX_CENTS);
    expect(() => applyBasisPoints(100, -1)).toThrow();
    expect(() => applyBasisPoints(100, 1.5)).toThrow();
  });

  it("multiplyQuantity gère les quantités décimales en millièmes", () => {
    expect(multiplyQuantity(150_000, 2500)).toBe(375_000); // 2,5 × 1 500 DA
    expect(multiplyQuantity(333, 1000)).toBe(333);
    expect(multiplyQuantity(1, 500)).toBe(1); // 0,5 centime → 1
    expect(() => multiplyQuantity(100, -1)).toThrow();
  });

  it("toDecimalString pour les exports", () => {
    expect(toDecimalString(12_000_050)).toBe("120000.50");
    expect(toDecimalString(-5)).toBe("-0.05");
  });
});
