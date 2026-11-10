"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Modalidad = "qr" | "manual";
type TipoConsulta = "primera-vez" | "subsecuente";

export default function ConsultaMedica() {
  const router = useRouter();
  const [modalidad, setModalidad] = useState<Modalidad | null>(null);
  const [tipoConsulta, setTipoConsulta] = useState<TipoConsulta | null>(null);

  const seleccionarModalidad = (nuevaModalidad: Modalidad) => {
    if (modalidad !== nuevaModalidad) {
      setTipoConsulta(null);
    }
    setModalidad(nuevaModalidad);
  };

  const continuar = () => {
    if (!modalidad || !tipoConsulta) return;

    const parametros = new URLSearchParams({
      modalidad,
      tipo: tipoConsulta,
    });

    router.push(`/profesionales/consulta/hoja-clinica?${parametros.toString()}`);
  };

  return (
    <main className="min-h-screen bg-[#F4F8F7] text-[#123C50]">
      <header className="border-b border-[#DCE9E6] bg-white px-6 py-5">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/profesionales"
            className="font-bold text-[#18A69A] transition hover:text-[#123C50]"
          >
            ← Volver al portal profesional
          </Link>
          <h1 className="mt-5 text-3xl font-extrabold">Consulta Médica</h1>
          <p className="mt-2 max-w-2xl text-slate-500">
            Selecciona la modalidad de acceso y el tipo de consulta para
            continuar con la atención de tu paciente.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-10 px-6 py-12">
        <section aria-labelledby="modalidad-heading">
          <h2 id="modalidad-heading" className="text-2xl font-bold">
            Modalidad de acceso
          </h2>
          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            <button
              type="button"
              aria-pressed={modalidad === "qr"}
              onClick={() => seleccionarModalidad("qr")}
              className={`rounded-2xl border bg-white p-7 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
                modalidad === "qr"
                  ? "border-[#18A69A] ring-2 ring-[#18A69A]/20"
                  : "border-[#DCE9E6]"
              }`}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E9F4F2] text-xl font-bold text-[#18A69A]">
                QR
              </span>
              <span className="mt-5 block text-xl font-bold">Mediante QR</span>
              <span className="mt-2 block text-sm leading-relaxed text-slate-500">
                Selecciona esta modalidad para continuar con el acceso mediante
                QR.
              </span>
            </button>

            <button
              type="button"
              aria-pressed={modalidad === "manual"}
              onClick={() => seleccionarModalidad("manual")}
              className={`rounded-2xl border bg-white p-7 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
                modalidad === "manual"
                  ? "border-[#18A69A] ring-2 ring-[#18A69A]/20"
                  : "border-[#DCE9E6]"
              }`}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E9F4F2] text-xl font-bold text-[#18A69A]">
                M
              </span>
              <span className="mt-5 block text-xl font-bold">Captura manual</span>
              <span className="mt-2 block text-sm leading-relaxed text-slate-500">
                Selecciona esta modalidad para iniciar una consulta de primera
                vez.
              </span>
            </button>
          </div>
        </section>

        {modalidad && (
          <section aria-labelledby="tipo-consulta-heading">
            <h2 id="tipo-consulta-heading" className="text-2xl font-bold">
              Tipo de consulta
            </h2>
            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              <button
                type="button"
                aria-pressed={tipoConsulta === "primera-vez"}
                onClick={() => setTipoConsulta("primera-vez")}
                className={`rounded-2xl border bg-white p-7 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
                  tipoConsulta === "primera-vez"
                    ? "border-[#18A69A] ring-2 ring-[#18A69A]/20"
                    : "border-[#DCE9E6]"
                }`}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E9F4F2] text-xl font-bold text-[#18A69A]">
                  01
                </span>
                <span className="mt-5 block text-xl font-bold">Primera vez</span>
                <span className="mt-2 block text-sm leading-relaxed text-slate-500">
                  Para iniciar la atención y conocer el motivo de consulta del
                  paciente.
                </span>
              </button>

              <button
                type="button"
                aria-pressed={tipoConsulta === "subsecuente"}
                disabled={modalidad === "manual"}
                onClick={() => setTipoConsulta("subsecuente")}
                className={`rounded-2xl border p-7 text-left shadow-sm transition ${
                  modalidad === "manual"
                    ? "cursor-not-allowed border-[#DCE9E6] bg-slate-100 opacity-60"
                    : tipoConsulta === "subsecuente"
                      ? "border-[#18A69A] bg-white ring-2 ring-[#18A69A]/20"
                      : "border-[#DCE9E6] bg-white hover:-translate-y-1 hover:shadow-lg"
                }`}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E9F4F2] text-xl font-bold text-[#18A69A]">
                  02
                </span>
                <span className="mt-5 block text-xl font-bold">Subsecuente</span>
                <span className="mt-2 block text-sm leading-relaxed text-slate-500">
                  Para dar continuidad a la atención y revisar la evolución del
                  paciente.
                </span>
                {modalidad === "manual" && (
                  <span className="mt-4 block text-sm font-bold text-slate-500">
                    No disponible para captura manual
                  </span>
                )}
              </button>
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <button
                type="button"
                disabled={!modalidad || !tipoConsulta}
                onClick={continuar}
                className="rounded-xl bg-[#123C50] px-6 py-3 font-bold text-white transition hover:bg-[#18A69A] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#123C50]"
              >
                Continuar
              </button>
              <p className="text-sm text-slate-500">
                {modalidad && tipoConsulta
                  ? "La selección está lista para continuar."
                  : "Selecciona una modalidad y un tipo de consulta permitido."}
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
