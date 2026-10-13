import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MIZANIA — Copilote financier des entrepreneurs algériens",
    template: "%s · MIZANIA",
  },
  description:
    "MIZANIA vous aide à mieux comprendre et gérer votre activité : recettes, dépenses, factures, trésorerie et comptabilité selon le SCF algérien.",
  applicationName: "MIZANIA",
};

export const viewport: Viewport = {
  themeColor: "#0b4f47",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" dir="ltr">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
