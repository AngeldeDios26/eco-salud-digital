import Link from "next/link";

const cartillas = [
  {
    edad: "0 a 9 años",
    nombre: "Niñas y niños",
    descripcion: "Seguimiento del crecimiento, desarrollo, vacunación y salud infantil.",
    icono: "🧒",
  },
  {
    edad: "10 a 19 años",
    nombre: "Adolescentes",
    descripcion: "Registro de salud, prevención, vacunación y desarrollo adolescente.",
    icono: "🎒",
  },
  {
    edad: "20 a 59 años",
    nombre: "Mujeres",
    descripcion: "Control de salud, prevención, vacunación y seguimiento personal.",
    icono: "👩",
  },
  {
    edad: "20 a 59 años",
    nombre: "Hombres",
    descripcion: "Seguimiento preventivo, consultas, vacunación y bienestar.",
    icono: "👨",
  },
  {
    edad: "60 años o más",
    nombre: "Adultos mayores",
    descripcion: "Control de salud, medicamentos, consultas y seguimiento.",
    icono: "👵",
  },
];

export default function Pacientes() {
  return (
    <main className="min-h-screen bg-[#F6FAF8] text-[#0F2D3D]">

      <header className="border-b border-[#D6E6E1] bg-white px-6 py-5">
        <div className="mx-auto max-w-6xl">
          <Link href="/" className="font-bold text-[#0D9488]">
            ← Volver al inicio
          </Link>

          <h1 className="mt-5 text-3xl font-extrabold">
            Portal de Pacientes
          </h1>

          <p className="mt-2 text-slate-500">
            Genera un QR temporal para compartir los datos que elijas con tu médico.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12">

        <div className="mb-10">
          <h2 className="text-2xl font-bold">
            Cartillas digitales en desarrollo
          </h2>

          <p className="mt-3 text-slate-500">
            Estamos preparando estos espacios de seguimiento por etapa de vida.
          </p>
        </div>

        <div className="mb-8 rounded-2xl border border-[#B9DED8] bg-[#EAF4F1] p-6">
          <h2 className="text-xl font-extrabold">Comparte tus datos con tu médico</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
            Prepara un QR temporal con los datos que elijas. El código vence en cinco minutos y solo puede leerse una vez.
          </p>
          <Link href="/pacientes/qr" className="mt-4 inline-flex rounded-xl bg-[#0D9488] px-5 py-3 font-bold text-white transition hover:bg-[#138C82]">
            Preparar datos y generar QR temporal
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {cartillas.map((cartilla) => (
            <article
              key={cartilla.nombre}
              className="rounded-2xl border border-[#D6E6E1] bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="text-4xl">
                {cartilla.icono}
              </div>

              <p className="mt-5 text-sm font-bold text-[#0D9488]">
                {cartilla.edad}
              </p>

              <h3 className="mt-2 text-xl font-extrabold">
                {cartilla.nombre}
              </h3>

              <p className="mt-3 min-h-20 leading-relaxed text-slate-500">
                {cartilla.descripcion}
              </p>

              <div className="mt-6 rounded-xl bg-[#EAF4F1] px-4 py-3 text-center font-bold text-[#0F766E]">
                Próximamente
              </div>
            </article>
          ))}

        </div>

        <div className="mt-12 rounded-2xl bg-[#0F2D3D] p-8 text-white">
          <h2 className="text-2xl font-bold">
            Tu salud, tu información
          </h2>

          <p className="mt-3 leading-relaxed text-slate-200">
            Estamos desarrollando herramientas para registrar consultas,
            vacunas, medicamentos, citas y documentos personales de salud.
          </p>
        </div>

      </section>

      <footer className="border-t border-[#D6E6E1] bg-white px-6 py-8 text-center text-sm text-slate-500">
        © 2026 SALUD DIGITAL. Proyecto tecnológico en desarrollo.
      </footer>

    </main>
  );
}
