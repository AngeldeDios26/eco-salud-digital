"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { BrandLogo } from "../../components/BrandLogo";

export type LocalPatientHistoryEntry = {
  id: string;
  fecha: string;
  diagnostico: string;
  tratamiento: string;
  atendidoPor: string;
};

export const PATIENT_HISTORY_STORAGE_KEY = "eco-salud-patient-history-v1";

const inputClass =
  "mt-1 w-full rounded-xl border border-[#D6E6E1] bg-white px-3 py-2 text-xs text-[#0F2D3D] outline-none focus:border-[#0D9488] sm:text-sm";

export default function PacientesAppPage() {
  const [history, setHistory] = useState<LocalPatientHistoryEntry[]>([]);
  const [fecha, setFecha] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [tratamiento, setTratamiento] = useState("");
  const [atendidoPor, setAtendidoPor] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setFecha(new Date().toISOString().slice(0, 10));
      try {
        const raw = window.localStorage.getItem(PATIENT_HISTORY_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as LocalPatientHistoryEntry[];
          if (Array.isArray(parsed)) setHistory(parsed);
        }
      } catch {
        // Ignorar si localStorage no está disponible
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const persistHistory = (next: LocalPatientHistoryEntry[]) => {
    setHistory(next);
    try {
      window.localStorage.setItem(
        PATIENT_HISTORY_STORAGE_KEY,
        JSON.stringify(next),
      );
    } catch {
      // Ignorar
    }
  };

  const addEntry = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!diagnostico.trim() || !tratamiento.trim()) {
      setStatus("Escribe al menos el diagnóstico y el tratamiento.");
      return;
    }
    const newEntry: LocalPatientHistoryEntry = {
      id: `hist-${Date.now()}`,
      fecha: fecha || new Date().toISOString().slice(0, 10),
      diagnostico: diagnostico.trim(),
      tratamiento: tratamiento.trim(),
      atendidoPor: atendidoPor.trim() || "Médico tratante",
    };
    persistHistory([newEntry, ...history]);
    setDiagnostico("");
    setTratamiento("");
    setAtendidoPor("");
    setStatus("Consulta guardada en tu celular.");
  };

  const removeEntry = (id: string) => {
    persistHistory(history.filter((item) => item.id !== id));
  };

  return (
    <main className="min-h-dvh text-[#0F2D3D]">
      <header className="border-b border-[#D6E6E1] bg-white/95 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BrandLogo size="md" />
            <div>
              <Link href="/" className="text-xs font-bold text-[#0D9488] hover:underline">
                ← Volver al inicio
              </Link>
              <h1 className="text-xl font-extrabold sm:text-2xl">
                App de Pacientes · Mi Historial
              </h1>
            </div>
          </div>
          <Link
            href="/pacientes/qr"
            className="rounded-xl bg-[#0D9488] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#0F2D3D] sm:text-sm"
          >
            📷 Generar QR para Consulta →
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl space-y-5 px-4 py-6 sm:px-6">
        <div className="rounded-2xl border border-[#B9DED8] bg-[#EAF4F1]/90 p-4 text-xs leading-relaxed text-[#0F2D3D] sm:text-sm">
          <strong>Privacidad en tu celular:</strong> Tu historial médico se guarda únicamente en este dispositivo. Al generar tu código QR, enlazas tus datos básicos (nombre, peso, talla) y otorgas acceso temporal a este historial <strong>solo durante la consulta</strong>.
        </div>

        <form
          onSubmit={addEntry}
          className="space-y-3 rounded-2xl border border-[#D6E6E1] bg-white p-4 shadow-sm sm:p-5"
        >
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#0F2D3D]">
            Registrar consulta en mi historial
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold">
              Fecha de atención
              <input
                type="date"
                className={inputClass}
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
              />
            </label>
            <label className="block text-xs font-semibold">
              Atendido por (Médico / Unidad)
              <input
                type="text"
                className={inputClass}
                value={atendidoPor}
                onChange={(e) => setAtendidoPor(e.target.value)}
                placeholder="Ej. Dr. Pérez · UMF No. 1"
              />
            </label>
          </div>
          <label className="block text-xs font-semibold">
            Diagnóstico
            <input
              type="text"
              className={inputClass}
              value={diagnostico}
              onChange={(e) => setDiagnostico(e.target.value)}
              placeholder="Ej. Faringitis aguda / Control de Diabetes Mellitus"
              required
            />
          </label>
          <label className="block text-xs font-semibold">
            Tratamiento indicado
            <textarea
              rows={2}
              className={inputClass + " resize-y"}
              value={tratamiento}
              onChange={(e) => setTratamiento(e.target.value)}
              placeholder="Ej. Paracetamol 500 mg cada 8 h por 3 días, hidratación..."
              required
            />
          </label>
          <button
            type="submit"
            className="rounded-xl bg-[#0F2D3D] px-5 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#0D9488] sm:text-sm"
          >
            + Guardar en mi celular
          </button>
          {status && (
            <p className="text-xs font-semibold text-[#0F766E]" role="status">
              {status}
            </p>
          )}
        </form>

        <div className="rounded-2xl border border-[#D6E6E1] bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#0F2D3D]">
              Consultas guardadas en este dispositivo ({history.length})
            </h2>
          </div>
          {history.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-[#D6E6E1] bg-[#F6FAF8] p-4 text-xs text-slate-500">
              Aún no tienes consultas registradas. Agrega tu primera consulta arriba para llevar tu historial contigo.
            </p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {history.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-[#D6E6E1] bg-[#F6FAF8] p-3 text-xs sm:text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-extrabold text-[#0F2D3D]">
                      {item.fecha} · {item.diagnostico}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeEntry(item.id)}
                      className="text-xs font-bold text-rose-700 hover:underline"
                    >
                      Eliminar
                    </button>
                  </div>
                  <p className="mt-1 text-slate-700">
                    <strong>Tratamiento:</strong> {item.tratamiento}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    <strong>Atendido por:</strong> {item.atendidoPor}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
