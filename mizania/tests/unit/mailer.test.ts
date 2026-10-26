import { describe, expect, it, vi } from "vitest";
import { BrevoMailer, createMailer, parseFrom, ResendMailer } from "@/server/mail/mailer";
import { parseEnv } from "@/server/env";

const msg = { to: "a@example.test", subject: "Objet", text: "Texte", html: "<p>Texte</p>" };
const ok = () => vi.fn(async () => new Response("{}", { status: 200 })) as unknown as typeof fetch;

describe("mailers", () => {
  it("Resend : appel API attendu", async () => {
    const f = ok();
    await new ResendMailer("re_key", "MIZANIA <no-reply@ex.dz>", f).send(msg);
    const [url, init] = (f as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.authorization).toBe("Bearer re_key");
    expect(JSON.parse(init.body)).toMatchObject({ from: "MIZANIA <no-reply@ex.dz>", to: ["a@example.test"] });
  });

  it("Brevo : appel API attendu", async () => {
    const f = ok();
    await new BrevoMailer("xkeysib", "MIZANIA <no-reply@ex.dz>", f).send(msg);
    const [url, init] = (f as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("https://api.brevo.com/v3/smtp/email");
    expect(init.headers["api-key"]).toBe("xkeysib");
    expect(JSON.parse(init.body)).toMatchObject({ sender: { name: "MIZANIA", email: "no-reply@ex.dz" }, to: [{ email: "a@example.test" }] });
  });

  it("une erreur HTTP lève une exception sans contenu de réponse", async () => {
    const f = vi.fn(async () => new Response("secret body", { status: 401 })) as unknown as typeof fetch;
    await expect(new ResendMailer("k", "a@b.c", f).send(msg)).rejects.toThrow("HTTP 401");
  });

  it("parseFrom", () => {
    expect(parseFrom("MIZANIA <x@y.dz>")).toEqual({ name: "MIZANIA", email: "x@y.dz" });
    expect(parseFrom("x@y.dz")).toEqual({ email: "x@y.dz" });
  });

  it("en production sans fournisseur, aucun email n'est « envoyé » en silence", () => {
    const base = { DATABASE_URL: "postgres://u:p@h/db" };
    expect(createMailer(parseEnv({ ...base, NODE_ENV: "production" }))).toBeNull();
    expect(createMailer(parseEnv({ ...base, NODE_ENV: "development" }))?.name).toBe("console");
    expect(() => parseEnv({ ...base, MAIL_PROVIDER: "resend" })).toThrow(/RESEND_API_KEY/);
  });
});
