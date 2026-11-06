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
    <main className="min-h-screen bg-[#F4F8F7] text-[#123C50]">

      <header className="border-b border-[#DCE9E6] bg-white px-6 py-5">
        <div className="mx-auto max-w-6xl">
          <a href="/" className="font-bold text-[#18A69A]">
            ← Volver al inicio
          </a>

          <h1 className="mt-5 text-3xl font-extrabold">
            Portal de Pacientes
          </h1>

          <p className="mt-2 text-slate-500">
            Tu información de salud organizada en un solo lugar.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12">

        <div className="mb-10">
          <h2 className="text-2xl font-bold">
            Selecciona tu cartilla digital
          </h2>

          <p className="mt-3 text-slate-500">
            Espacios digitales organizados por grupos de edad.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {cartillas.map((cartilla) => (
            <article
              key={cartilla.nombre}
              className="rounded-2xl border border-[#DCE9E6] bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="text-4xl">
                {cartilla.icono}
              </div>

              <p className="mt-5 text-sm font-bold text-[#18A69A]">
                {cartilla.edad}
              </p>

              <h3 className="mt-2 text-xl font-extrabold">
                {cartilla.nombre}
              </h3>

              <p className="mt-3 min-h-20 leading-relaxed text-slate-500">
                {cartilla.descripcion}
              </p>

              <div className="mt-6 rounded-xl bg-[#E9F4F2] px-4 py-3 text-center font-bold text-[#16877F]">
                Próximamente
              </div>
            </article>
          ))}

        </div>

        <div className="mt-12 rounded-2xl bg-[#123C50] p-8 text-white">
          <h2 className="text-2xl font-bold">
            Tu salud, tu información
          </h2>

          <p className="mt-3 leading-relaxed text-slate-200">
            Estamos desarrollando herramientas para registrar consultas,
            vacunas, medicamentos, citas y documentos personales de salud.
          </p>
        </div>

      </section>

      <footer className="border-t border-[#DCE9E6] bg-white px-6 py-8 text-center text-sm text-slate-500">
        © 2026 SALUD DIGITAL. Proyecto tecnológico en desarrollo.
      </footer>

    </main>
  );
}