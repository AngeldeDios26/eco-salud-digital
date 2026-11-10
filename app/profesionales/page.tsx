import Link from "next/link";

export default function Profesionales() {
  return (
    <main className="min-h-screen bg-[#F4F8F7] text-[#123C50]">

      <header className="border-b border-[#DCE9E6] bg-white px-6 py-5">
        <div className="mx-auto max-w-6xl">
          <Link href="/" className="font-bold text-[#18A69A]">
            ← Volver al inicio
          </Link>
          <h1 className="mt-5 text-3xl font-extrabold">
            Portal de Profesionales de la Salud
          </h1>
          <p className="mt-2 text-slate-500">
            Herramientas digitales para el ejercicio profesional.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          <Link
            href="/profesionales/consulta"
            className="rounded-2xl border border-[#DCE9E6] bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <h2 className="text-xl font-bold">Consulta Médica</h2>
            <p className="mt-3 text-sm text-slate-500">
              Accede a las herramientas para iniciar una consulta médica.
            </p>
            <span className="mt-5 inline-block text-sm font-bold text-[#18A69A]">
              Abrir módulo
            </span>
          </Link>

          {[
            "Mi perfil profesional",
            "Recetario médico",
            "Biblioteca científica",
            "Educación continua",
            "Herramientas clínicas",
            "Servicios y suscripciones",
          ].map((item) => (
            <article
              key={item}
              className="rounded-2xl border border-[#DCE9E6] bg-white p-7 shadow-sm"
            >
              <h2 className="text-xl font-bold">{item}</h2>
              <p className="mt-3 text-sm text-slate-500">
                Módulo en desarrollo. Próximamente podrás utilizar
                esta herramienta.
              </p>
              <span className="mt-5 inline-block text-sm font-bold text-[#18A69A]">
                Próximamente
              </span>
            </article>
          ))}

        </div>
      </section>

    </main>
  );
}
