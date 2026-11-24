import Link from "next/link";
import { BrandLogo } from "../../components/BrandLogo";

export default function TerminosPage() {
  return (
    <main className="min-h-dvh px-4 py-8 text-[#0F2D3D] sm:px-6">
      <div className="mx-auto max-w-3xl space-y-5 rounded-2xl border border-[#D6E6E1] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3 border-b border-[#EAF4F1] pb-4">
          <BrandLogo size="md" />
          <div>
            <Link
              href="/"
              className="text-xs font-bold text-[#0D9488] hover:underline"
            >
              ← Volver al inicio
            </Link>
            <h1 className="mt-1 text-xl font-extrabold sm:text-2xl">
              Términos, Condiciones y Descargo Médico
            </h1>
          </div>
        </div>

        <section className="space-y-3 text-xs leading-relaxed text-slate-700 sm:text-sm">
          <p>
            <strong>1. Naturaleza de la herramienta:</strong> Eco Salud Digital
            es una herramienta de apoyo administrativo, documentación clínica,
            calculadoras y referencia farmacológica dirigida a profesionales de
            la salud, así como un organizador personal de historial para
            pacientes.
          </p>
          <p>
            <strong>2. Descargo de responsabilidad médica:</strong> La
            plataforma <strong>no sustituye el criterio clínico</strong>, el
            diagnóstico ni la prescripción del médico titulado. El profesional de
            la salud es el único responsable de verificar dosis,
            contraindicaciones, interacciones y diagnósticos antes de emitir una
            nota o receta.
          </p>
          <p>
            <strong>3. Uso institucional:</strong> Eco Salud Digital es un
            proyecto independiente; no es un producto oficial del IMSS, ISSSTE,
            IMSS-Bienestar ni de la Secretaría de Salud.
          </p>
          <p>
            <strong>4. Gratuidad para pacientes y publicidad:</strong> El uso de
            la aplicación de pacientes es gratuito y podrá incluir espacios
            publicitarios claramente identificados para sostener la operación de
            la plataforma.
          </p>
        </section>
      </div>
    </main>
  );
}
