import { describe, expect, it } from "vitest";
import { addMonths, formatDate, isIsoDate, monthLabel, startOfFiscalYear, startOfMonth, todayInAlgeria } from "@/lib/dates";

describe("dates", () => {
  it("todayInAlgeria utilise le fuseau d'Alger (UTC+1)", () => {
    expect(todayInAlgeria(new Date("2026-03-31T23:30:00Z"))).toBe("2026-04-01");
    expect(todayInAlgeria(new Date("2026-03-31T22:30:00Z"))).toBe("2026-03-31");
  });
  it("isIsoDate refuse les dates impossibles", () => {
    expect(isIsoDate("2026-02-28")).toBe(true);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("15/03/2026")).toBe(false);
  });
  it("calculs de mois et d'exercice", () => {
    expect(startOfMonth("2026-03-15")).toBe("2026-03-01");
    expect(addMonths("2026-01-01", -1)).toBe("2025-12-01");
    expect(addMonths("2026-11-01", 3)).toBe("2027-02-01");
    expect(startOfFiscalYear("2026-03-15", 1)).toBe("2026-01-01");
    expect(startOfFiscalYear("2026-03-15", 7)).toBe("2025-07-01");
    expect(startOfFiscalYear("2026-08-01", 7)).toBe("2026-07-01");
  });
  it("formats d'affichage", () => {
    expect(formatDate("2026-03-05")).toBe("05/03/2026");
    expect(monthLabel("2026-03-01")).toBe("mars 26");
    expect(monthLabel("2026-03-01", true)).toBe("mars 2026");
  });
});
