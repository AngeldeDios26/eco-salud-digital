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
      <body className="min-h-full flex flex-col">
        <div className="bg-amber-100 px-3 py-2 text-center text-xs font-semibold tracking-wide text-amber-950 sm:text-sm">
          DEMOSTRACIÓN — NO UTILIZAR CON PACIENTES REALES. No es un producto oficial del IMSS ni de la Secretaría de Salud.
        </div>
        {children}
      </body>
    </html>
  );
}
