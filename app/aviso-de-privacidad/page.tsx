import Link from "next/link";
import { BrandLogo } from "../../components/BrandLogo";

export default function AvisoDePrivacidadPage() {
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
              Aviso de Privacidad · Eco Salud Digital
            </h1>
          </div>
        </div>

        <section className="space-y-3 text-xs leading-relaxed text-slate-700 sm:text-sm">
          <p>
            <strong>1. Responsable del tratamiento:</strong> Eco Salud Digital,
            plataforma tecnológica de apoyo a la consulta médica de primer nivel
            y gestión portátil de historial por parte del paciente.
          </p>
          <p>
            <strong>2. Datos personales y sensibles tratados:</strong> En la
            etapa actual de demostración tecnológica, los datos capturados por
            el médico (perfil profesional y plantillas) y por el paciente (datos
            de identificación, somatometría, antecedentes clínicos e historial
            de consultas) se almacenan exclusivamente en el almacenamiento local
            del dispositivo del usuario (<code>localStorage</code> /{" "}
            <code>sessionStorage</code>).
          </p>
          <p>
            <strong>3. Transferencia temporal mediante código QR:</strong>{" "}
            Cuando el paciente genera un código QR temporal (<code>ESD1</code>)
            previo consentimiento expreso, los datos seleccionados permanecen en
            memoria temporal únicamente por un máximo de 5 minutos o hasta ser
            leídos una sola vez por el médico durante la consulta, tras lo cual
            el token se destruye automáticamente.
          </p>
          <p>
            <strong>4. Finalidad y derechos ARCO:</strong> Conforme a la Ley
            Federal de Protección de Datos Personales en Posesión de los
            Particulares (LFPDPPP) en México, el usuario mantiene control total
            para acceder, rectificar, cancelar o eliminar su información
            directamente desde su dispositivo en cualquier momento.
          </p>
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-950">
            <strong>Aviso importante:</strong> Esta versión es un prototipo de
            validación tecnológica. No ingresar datos reales de pacientes hasta
            habilitar el entorno productivo cifrado correspondiente.
          </p>
        </section>
      </div>
    </main>
  );
}
