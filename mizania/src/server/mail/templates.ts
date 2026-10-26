import "server-only";
import type { MailMessage } from "./mailer";

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function layout(title: string, paragraphs: string[], action: { label: string; url: string }) {
  const p = paragraphs.map((x) => `<p style="margin:0 0 16px">${escapeHtml(x)}</p>`).join("");
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f6f5f1;font-family:Arial,sans-serif;color:#15181c">
<div style="max-width:520px;margin:0 auto;padding:32px 20px">
<p style="font-weight:bold;letter-spacing:3px;color:#0b4f47">MIZANIA</p>
<h1 style="font-size:20px">${escapeHtml(title)}</h1>${p}
<p><a href="${escapeHtml(action.url)}" style="display:inline-block;background:#0b4f47;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">${escapeHtml(action.label)}</a></p>
<p style="font-size:12px;color:#6b6f76">Si le bouton ne fonctionne pas, copiez ce lien : ${escapeHtml(action.url)}</p>
</div></body></html>`;
}

export function verificationEmail(to: string, name: string, url: string): MailMessage {
  const lines = [`Bonjour ${name},`, "Confirmez votre adresse email pour sécuriser votre compte MIZANIA. Ce lien est valable 48 heures."];
  return {
    to,
    subject: "Confirmez votre adresse email — MIZANIA",
    text: `${lines.join("\n\n")}\n\n${url}`,
    html: layout("Confirmez votre adresse email", lines, { label: "Confirmer mon email", url }),
  };
}

export function passwordResetEmail(to: string, url: string): MailMessage {
  const lines = [
    "Vous avez demandé à réinitialiser votre mot de passe MIZANIA. Ce lien est valable 30 minutes et ne peut servir qu'une fois.",
    "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email : votre mot de passe reste inchangé.",
  ];
  return {
    to,
    subject: "Réinitialisation de votre mot de passe — MIZANIA",
    text: `${lines.join("\n\n")}\n\n${url}`,
    html: layout("Réinitialiser votre mot de passe", lines, { label: "Choisir un nouveau mot de passe", url }),
  };
}
