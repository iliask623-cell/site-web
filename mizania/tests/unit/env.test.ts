import { describe, expect, it } from "vitest";
import { parseEnv } from "@/server/env";

const base = { DATABASE_URL: "postgres://u:p@localhost:5432/db" };

describe("parseEnv", () => {
  it("accepte une configuration minimale et applique les défauts", () => {
    const env = parseEnv(base);
    expect(env.NODE_ENV).toBe("development");
    expect(env.APP_URL).toBe("http://localhost:3000");
    expect(env.AI_PROVIDER).toBeUndefined();
  });

  it("traite les chaînes vides comme absentes (IA désactivée)", () => {
    expect(parseEnv({ ...base, AI_PROVIDER: "", ANTHROPIC_API_KEY: "" }).AI_PROVIDER).toBeUndefined();
  });

  it("refuse une URL de base invalide sans divulguer sa valeur", () => {
    const secret = "mysql://root:SuperSecret@host/db";
    expect(() => parseEnv({ DATABASE_URL: secret })).toThrow(/DATABASE_URL/);
    try {
      parseEnv({ DATABASE_URL: secret });
    } catch (e) {
      expect(String(e)).not.toContain("SuperSecret");
    }
  });

  it("exige la clé API si le fournisseur IA est activé", () => {
    expect(() => parseEnv({ ...base, AI_PROVIDER: "anthropic" })).toThrow(/ANTHROPIC_API_KEY/);
    expect(parseEnv({ ...base, AI_PROVIDER: "anthropic", ANTHROPIC_API_KEY: "k" }).AI_PROVIDER).toBe("anthropic");
  });
});
