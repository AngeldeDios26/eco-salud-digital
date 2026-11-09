import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const siteFont = localFont({
  src: "../node_modules/next/dist/next-devtools/server/font/geist-latin.woff2",
  variable: "--font-site",
});

export const metadata: Metadata = {
  title: "Eco Salud Digital",
  description:
    "Ecosistema digital de herramientas y servicios para profesionales y pacientes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${siteFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
