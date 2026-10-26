import "server-only";
import { env, type Env } from "@/server/env";

export type MailMessage = { to: string; subject: string; text: string; html: string };

export interface Mailer {
  readonly name: string;
  send(message: MailMessage): Promise<void>;
}

export class MailNotConfiguredError extends Error {
  constructor() {
    super("L'envoi d'emails n'est pas configuré.");
  }
}

/** Développement et tests : le message est écrit dans la console du serveur. */
export class ConsoleMailer implements Mailer {
  readonly name = "console";
  readonly sent: MailMessage[] = [];
  async send(message: MailMessage) {
    this.sent.push(message);
    if (process.env.NODE_ENV !== "test") {
      console.info(`\n[email:console] À : ${message.to}\nObjet : ${message.subject}\n\n${message.text}\n`);
    }
  }
}

/** « Nom <email@domaine> » → { name, email } */
export function parseFrom(from: string): { name?: string; email: string } {
  const m = from.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  return m ? { name: m[1] || undefined, email: m[2] } : { email: from.trim() };
}

async function postJson(url: string, headers: Record<string, string>, body: unknown, fetchImpl: typeof fetch) {
  const res = await fetchImpl(url, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    // Pas de corps de réponse dans l'erreur : il peut contenir des données personnelles.
    throw new Error(`Échec de l'envoi de l'email (HTTP ${res.status}).`);
  }
}

export class ResendMailer implements Mailer {
  readonly name = "resend";
  constructor(
    private apiKey: string,
    private from: string,
    private fetchImpl: typeof fetch = fetch,
  ) {}
  async send(m: MailMessage) {
    await postJson(
      "https://api.resend.com/emails",
      { authorization: `Bearer ${this.apiKey}` },
      { from: this.from, to: [m.to], subject: m.subject, text: m.text, html: m.html },
      this.fetchImpl,
    );
  }
}

export class BrevoMailer implements Mailer {
  readonly name = "brevo";
  constructor(
    private apiKey: string,
    private from: string,
    private fetchImpl: typeof fetch = fetch,
  ) {}
  async send(m: MailMessage) {
    await postJson(
      "https://api.brevo.com/v3/smtp/email",
      { "api-key": this.apiKey },
      { sender: parseFrom(this.from), to: [{ email: m.to }], subject: m.subject, textContent: m.text, htmlContent: m.html },
      this.fetchImpl,
    );
  }
}

/** Renvoie le mailer configuré, ou null si aucun envoi n'est possible. */
export function createMailer(e: Env): Mailer | null {
  switch (e.MAIL_PROVIDER) {
    case "resend":
      return new ResendMailer(e.RESEND_API_KEY!, e.MAIL_FROM!);
    case "brevo":
      return new BrevoMailer(e.BREVO_API_KEY!, e.MAIL_FROM!);
    case "console":
      return new ConsoleMailer();
    default:
      // Sans configuration, la console n'est utilisée qu'hors production.
      return e.NODE_ENV === "production" ? null : new ConsoleMailer();
  }
}

let current: Mailer | null | undefined;

export function getMailer(): Mailer | null {
  if (current === undefined) current = createMailer(env());
  return current;
}

/** Tests uniquement. */
export function setMailerForTests(m: Mailer | null) {
  current = m;
}
