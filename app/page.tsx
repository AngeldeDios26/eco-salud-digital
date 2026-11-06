
const solutions = [
  {
    number: "01",
    icon: "⚕",
    title: "Profesionales de la salud",
    description:
      "Herramientas, recursos y soluciones digitales para médicos y otros profesionales sanitarios.",
  },
  {
    number: "02",
    icon: "♡",
    title: "Cartillas digitales",
    description:
      "Registros personales de salud, vacunación, consultas y seguimiento de pacientes.",
  },
  {
    number: "03",
    icon: "▤",
    title: "Recetario médico",
    description:
      "Creación, personalización e impresión de recetas para profesionales.",
  },
  {
    number: "04",
    icon: "▥",
    title: "Biblioteca científica",
    description:
      "Recursos, documentos y referencias para consulta y actualización.",
  },
  {
    number: "05",
    icon: "✧",
    title: "Educación continua",
    description:
      "Capacitación y contenidos educativos para profesionales de la salud.",
  },
  {
    number: "06",
    icon: "⌂",
    title: "Instituciones",
    description:
      "Soluciones tecnológicas para consultorios, clínicas y organizaciones.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F4F8F7] text-[#123C50]">
      <header className="sticky top-0 z-10 border-b border-[#DCE9E6] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#18A69A] text-3xl font-bold text-white">
              +
            </div>
            <div>
              <p className="text-lg font-extrabold tracking-wide">
                SALUD DIGITAL
              </p>
              <p className="text-xs text-slate-500">
                Tecnología que conecta con tu salud
              </p>
            </div>
          </div>

          <span className="hidden rounded-full bg-[#E9F4F2] px-4 py-2 text-xs font-semibold text-[#16877F] sm:block">
            Próximamente
          </span>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="max-w-3xl">
          <p className="mb-5 text-sm font-bold uppercase tracking-[0.2em] text-[#18A69A]">
            Ecosistema digital de salud
          </p>

          <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">
            La tecnología al servicio de quienes cuidan la salud.
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-slate-600">
            Conectamos a profesionales, pacientes e instituciones
            mediante herramientas digitales accesibles, prácticas
            y confiables.
          </p>

          <a
            href="#soluciones"
            className="mt-9 inline-block rounded-xl bg-[#123C50] px-7 py-4 font-semibold text-white transition hover:bg-[#20566A]"
          >
            Conoce nuestras soluciones →
          </a>
        </div>
      </section>

      <section
        id="soluciones"
        className="mx-auto max-w-7xl px-6 pb-24"
      >
        <div className="mb-10">
          <p className="text-sm font-bold uppercase tracking-widest text-[#18A69A]">
            Nuestro ecosistema
          </p>

          <h2 className="mt-3 text-3xl font-bold">
            Soluciones para cada necesidad
          </h2>

          <p className="mt-3 text-slate-500">
            Una plataforma modular que crecerá contigo.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {solutions.map((item) => (
            <article
              key={item.number}
              className="rounded-2xl border border-[#DCE9E6] bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-4xl text-[#18A69A]">
                  {item.icon}
                </span>

                <span className="text-sm font-bold text-slate-300">
                  {item.number}
                </span>
              </div>

              <h3 className="mt-6 text-xl font-bold">
                {item.title}
              </h3>

              <p className="mt-3 min-h-20 leading-relaxed text-slate-500">
                {item.description}
              </p>

              <p className="mt-6 text-sm font-bold text-[#18A69A]">
                En desarrollo
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="rounded-3xl bg-[#123C50] px-8 py-12 text-white md:px-14 md:py-16">
          <p className="font-bold uppercase tracking-widest text-[#8BD8CB]">
            Nuestra visión
          </p>

          <h2 className="mt-5 max-w-3xl text-3xl font-bold md:text-4xl">
            Innovación, conocimiento y tecnología para mejorar
            la experiencia de salud.
          </h2>

          <p className="mt-6 max-w-2xl leading-relaxed text-slate-200">
            Estamos construyendo un ecosistema que acompañe
            tanto a quienes brindan atención sanitaria como
            a quienes buscan cuidar su bienestar.
          </p>
        </div>
      </section>

      <footer className="border-t border-[#DCE9E6] bg-white px-6 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} SALUD DIGITAL.
        Proyecto tecnológico en desarrollo.
      </footer>
    </main>
  );
}
