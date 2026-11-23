
import { BrandLogo } from "../components/BrandLogo";

export default function Home() {
  return (
    <main className="min-h-screen text-[#0F2D3D]">
      <header className="sticky top-0 z-10 border-b border-[#D6E6E1] bg-white">
  <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">

    <a href="#inicio" className="flex items-center gap-3">
      <BrandLogo size="lg" />
      <div>
        <p className="text-lg font-extrabold tracking-wide">
          ECO <span className="text-[#0D9488]">SALUD DIGITAL</span>
        </p>
        <p className="text-xs text-slate-500">
          Consulta Ágil · Medicina Familiar
        </p>
      </div>
    </a>

    <nav className="flex flex-wrap items-center gap-5 text-sm font-semibold">
      <a href="#inicio" className="hover:text-[#0D9488]">Inicio</a>
      <a href="#soluciones" className="hover:text-[#0D9488]">Soluciones</a>
      <a href="#vision" className="hover:text-[#0D9488]">Nuestra visión</a>
    </nav>

    <a href="#acceso" className="rounded-xl bg-[#EAF4F1] px-5 py-3 text-sm font-bold text-[#0F766E] transition hover:bg-[#D8EEEA]">
      Probar el prototipo
    </a>

  </div>
</header>
      <section id="inicio" className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="max-w-3xl">
          <p className="mb-5 text-sm font-bold uppercase tracking-[0.2em] text-[#0D9488]">
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
            href="/profesionales/consulta/hoja-clinica"
            className="mt-9 inline-block rounded-xl bg-[#0F2D3D] px-7 py-4 font-semibold text-white transition hover:bg-[#20566A]"
          >
            Iniciar consulta →
          </a>
        </div>
      </section>
      <section id="acceso" className="mx-auto max-w-7xl px-6 py-12">
        <div id="soluciones" className="mb-8">
          <p className="text-sm font-bold uppercase tracking-widest text-[#0D9488]">
            Acceso rápido
          </p>
          <h2 className="mt-2 text-2xl font-extrabold">¿Qué deseas hacer?</h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <a href="/profesionales/consulta/hoja-clinica" className="rounded-2xl border border-[#B9DED8] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <span className="text-3xl text-[#0D9488]">⚕</span>
            <h3 className="mt-4 text-xl font-bold">Iniciar consulta</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">Abre la hoja clínica y captura una consulta en modo demostración.</p>
            <span className="mt-5 inline-block text-sm font-bold text-[#0F766E]">Iniciar →</span>
          </a>

          <a href="/profesionales" className="rounded-2xl border border-[#D6E6E1] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <span className="text-3xl text-[#0D9488]">▦</span>
            <h3 className="mt-4 text-xl font-bold">Herramientas</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">Consulta los módulos disponibles y los que siguen en desarrollo.</p>
            <span className="mt-5 inline-block text-sm font-bold text-[#0F766E]">Ver herramientas →</span>
          </a>

          <a href="/profesionales/consulta/receta" className="rounded-2xl border border-[#D6E6E1] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <span className="text-3xl text-[#0D9488]">▤</span>
            <h3 className="mt-4 text-xl font-bold">Receta médica</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">Genera recetas genéricas con el buscador exclusivo del Cuadro Básico IMSS.</p>
            <span className="mt-5 inline-block text-sm font-bold text-[#0F766E]">Abrir receta →</span>
          </a>

          <a href="/profesionales/perfil" className="rounded-2xl border border-[#D6E6E1] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <span className="text-3xl text-[#0D9488]">♙</span>
            <h3 className="mt-4 text-xl font-bold">Mi perfil</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">Configura tus datos y tu formato propio de exploración física.</p>
            <span className="mt-5 inline-block text-sm font-bold text-[#0F766E]">Editar perfil →</span>
          </a>

          <a href="/profesionales/biblioteca" className="rounded-2xl border border-[#D6E6E1] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <span className="text-3xl text-[#0D9488]">▥</span>
            <h3 className="mt-4 text-xl font-bold">Mi Biblioteca</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">Encuentra enlaces a guías de práctica clínica y normas oficiales.</p>
            <span className="mt-5 inline-block text-sm font-bold text-[#0F766E]">Abrir biblioteca →</span>
          </a>

          <a href="/pacientes" className="rounded-2xl border border-[#D6E6E1] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <span className="text-3xl text-[#0284C7]">⌖</span>
            <h3 className="mt-4 text-xl font-bold">Portal de pacientes</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">Genera un código QR temporal para compartir datos previos a la consulta.</p>
            <span className="mt-5 inline-block text-sm font-bold text-[#0284C7]">Abrir portal →</span>
          </a>
        </div>
      </section>

      <section id="vision" className="mx-auto max-w-7xl px-6 pb-12">
        <p className="text-sm text-slate-500">Prototipo tecnológico en desarrollo.</p>
      </section>

      <footer className="border-t border-[#D6E6E1] bg-white px-6 py-8 text-center text-sm text-slate-500">
        © 2026 ECO SALUD DIGITAL.
        Consulta Ágil · Medicina Familiar.
      </footer>
    </main>
  );
}
