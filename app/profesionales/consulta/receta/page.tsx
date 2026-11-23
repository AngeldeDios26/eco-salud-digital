"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLogo } from "../../../../components/BrandLogo";
import {
  imssMedicationsCatalog,
  RECETA_DRAFT_STORAGE_KEY,
  type ImssMedication,
  type PrescribedMedication,
  type RecetaDraft,
} from "../../../../lib/imss-medications";
import { readProfessionalProfile } from "../../../../lib/professional-profile";

const inputClass =
  "mt-1 w-full rounded-xl border border-[#D6E6E1] bg-white px-3 py-2 text-xs text-[#0F2D3D] outline-none focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/15 sm:text-sm";

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-MX");
}

export default function RecetaMedicaPage() {
  const [doctor, setDoctor] = useState({
    nombre: "Dr. Ángel de Dios",
    cedula: "12345678",
    matricula: "99887766",
    unidad: "UMF No. 1 · IMSS",
  });
  const [patientNote, setPatientNote] = useState("");
  const [diagnosesText, setDiagnosesText] = useState("");
  const [indicationsText, setIndicationsText] = useState(
    "Medidas higiénico-dietéticas y datos de alarma comentados en consulta.",
  );
  const [issueDate, setIssueDate] = useState("");

  const [query, setQuery] = useState("");
  const [selectedMed, setSelectedMed] = useState<ImssMedication | null>(null);
  const [medFields, setMedFields] = useState({
    presentacion: "",
    dosis: "",
    via: "",
    frecuencia: "",
    duracion: "",
    cantidad: "",
  });
  const [prescribedList, setPrescribedList] = useState<PrescribedMedication[]>(
    [],
  );

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setIssueDate(new Date().toLocaleDateString("es-MX"));

      const profile = readProfessionalProfile();
      if (profile?.nombre) {
        setDoctor({
          nombre: profile.nombre,
          cedula: profile.cedula || "S/D",
          matricula: profile.matricula || "S/D",
          unidad: profile.unidad || "Unidad Médica",
        });
      }

      try {
        const rawDraft = window.sessionStorage.getItem(
          RECETA_DRAFT_STORAGE_KEY,
        );
        if (rawDraft) {
          const parsed = JSON.parse(rawDraft) as Partial<RecetaDraft>;
          if (parsed.doctor?.nombre) {
            setDoctor(parsed.doctor);
          }
          if (typeof parsed.patientNote === "string") {
            setPatientNote(parsed.patientNote);
          }
          if (typeof parsed.diagnosesText === "string") {
            setDiagnosesText(parsed.diagnosesText);
          }
          if (typeof parsed.indicationsText === "string" && parsed.indicationsText.trim()) {
            setIndicationsText(parsed.indicationsText);
          }
        }
      } catch {
        // Ignorar si sessionStorage no está disponible
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const normalizedQuery = normalizeSearch(query.trim());
  const filteredCatalog = normalizedQuery
    ? imssMedicationsCatalog.filter(
        (item) =>
          normalizeSearch(item.name).includes(normalizedQuery) ||
          normalizeSearch(item.code).includes(normalizedQuery),
      )
    : imssMedicationsCatalog.slice(0, 6);

  const selectCatalogMed = (item: ImssMedication) => {
    setSelectedMed(item);
    setQuery(item.name);
    setMedFields({
      presentacion: item.presentation,
      dosis: item.dose,
      via: item.route,
      frecuencia: item.frequency,
      duracion: item.duration,
      cantidad: item.quantity,
    });
  };

  const addMedication = () => {
    if (!selectedMed) return;
    setPrescribedList((current) => [
      ...current,
      {
        id: `${selectedMed.code}-${Date.now()}`,
        code: selectedMed.code,
        name: selectedMed.name,
        presentacion: medFields.presentacion || selectedMed.presentation,
        dosis: medFields.dosis || selectedMed.dose,
        via: medFields.via || selectedMed.route,
        frecuencia: medFields.frecuencia || selectedMed.frequency,
        duracion: medFields.duracion || selectedMed.duration,
        cantidad: medFields.cantidad || selectedMed.quantity,
      },
    ]);
    setSelectedMed(null);
    setQuery("");
  };

  const removeMedication = (id: string) => {
    setPrescribedList((current) => current.filter((item) => item.id !== id));
  };

  const downloadPrescription = () => {
    const medsText =
      prescribedList.length > 0
        ? prescribedList
            .map(
              (m, i) =>
                `${i + 1}. ${m.name} (Clave IMSS: ${m.code})\n   ${m.presentacion} | Dosis: ${m.dosis} | Vía: ${m.via} | ${m.frecuencia} | Durante: ${m.duracion} | Surtir: ${m.cantidad}`,
            )
            .join("\n\n")
        : "- Sin medicamentos agregados.";
    const content = [
      "RECETA MÉDICA GENÉRICA - CUADRO BÁSICO IMSS",
      `Fecha: ${issueDate}`,
      `Médico: ${doctor.nombre} | Céd. Prof.: ${doctor.cedula} | Matrícula: ${doctor.matricula} | Unidad: ${doctor.unidad}`,
      "\nDATOS DEL PACIENTE Y NOTA MÉDICA:\n" + (patientNote || "No especificado"),
      "\nDIAGNÓSTICOS CIE-10:\n" + (diagnosesText || "Sin diagnósticos"),
      "\nMEDICAMENTOS PRESCRITOS:\n" + medsText,
      "\nINDICACIONES:\n" + indicationsText,
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "receta-medica-imss.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-[#F6FAF8] px-4 py-6 text-[#0F2D3D] sm:px-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#D6E6E1] bg-white p-4 shadow-sm print:hidden">
          <div className="flex items-center gap-3">
            <BrandLogo size="md" />
            <div>
              <Link
                href="/profesionales/consulta/hoja-clinica"
                className="text-xs font-extrabold text-[#0F766E] hover:underline"
              >
                ← Volver a la hoja de consulta
              </Link>
              <h1 className="mt-0.5 text-lg font-extrabold text-[#0F2D3D] sm:text-xl">
                Receta Médica Genérica · Cuadro Básico IMSS
              </h1>
              <p className="text-xs text-slate-500">
                Eco Salud Digital · Precargada con los datos del médico, paciente y nota médica
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-xl bg-[#0F2D3D] px-4 py-2 text-xs font-bold text-white hover:bg-[#0D9488]"
            >
              🖨 Imprimir Receta / PDF
            </button>
            <button
              type="button"
              onClick={downloadPrescription}
              className="rounded-xl bg-[#0D9488] px-4 py-2 text-xs font-bold text-white hover:bg-[#0F766E]"
            >
              💾 Guardar .txt
            </button>
          </div>
        </header>

        {/* DATOS DE LA CONSULTA Y BUSCADOR EXCLUSIVO CUADRO BÁSICO IMSS */}
        <section className="grid gap-4 lg:grid-cols-12 print:hidden">
          <div className="space-y-3 rounded-2xl border border-[#D6E6E1] bg-white p-4 shadow-sm lg:col-span-5">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#0F2D3D]">
              1. Datos del Médico, Paciente y Nota
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <label className="col-span-2 text-xs font-semibold">
                Médico
                <input
                  className={inputClass}
                  value={doctor.nombre}
                  onChange={(e) =>
                    setDoctor((d) => ({ ...d, nombre: e.target.value }))
                  }
                />
              </label>
              <label className="text-xs font-semibold">
                Cédula Prof.
                <input
                  className={inputClass}
                  value={doctor.cedula}
                  onChange={(e) =>
                    setDoctor((d) => ({ ...d, cedula: e.target.value }))
                  }
                />
              </label>
              <label className="text-xs font-semibold">
                Matrícula
                <input
                  className={inputClass}
                  value={doctor.matricula}
                  onChange={(e) =>
                    setDoctor((d) => ({ ...d, matricula: e.target.value }))
                  }
                />
              </label>
              <label className="col-span-2 text-xs font-semibold">
                Unidad Médica
                <input
                  className={inputClass}
                  value={doctor.unidad}
                  onChange={(e) =>
                    setDoctor((d) => ({ ...d, unidad: e.target.value }))
                  }
                />
              </label>
            </div>
            <label className="block text-xs font-semibold">
              Paciente y resumen de nota médica
              <textarea
                rows={4}
                className={inputClass + " resize-y"}
                value={patientNote}
                onChange={(e) => setPatientNote(e.target.value)}
                placeholder="Datos del paciente, signos vitales y padecimiento..."
              />
            </label>
            <label className="block text-xs font-semibold">
              Diagnósticos CIE-10
              <textarea
                rows={2}
                className={inputClass + " resize-y"}
                value={diagnosesText}
                onChange={(e) => setDiagnosesText(e.target.value)}
                placeholder="Diagnósticos..."
              />
            </label>
            <label className="block text-xs font-semibold">
              Indicaciones para el paciente
              <textarea
                rows={3}
                className={inputClass + " resize-y"}
                value={indicationsText}
                onChange={(e) => setIndicationsText(e.target.value)}
              />
            </label>
          </div>

          <div className="space-y-3 rounded-2xl border border-[#D6E6E1] bg-white p-4 shadow-sm lg:col-span-7">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#0F2D3D]">
              2. Buscador Exclusivo · Cuadro Básico IMSS
            </h2>
            <p className="text-xs text-slate-500">
              Busca por nombre genérico o clave del Cuadro Básico del IMSS (solo medicamentos del catálogo institucional).
            </p>
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!e.target.value.trim()) setSelectedMed(null);
              }}
              placeholder="Ej. Metformina, 010.000.5165.00, Losartán, Amoxicilina, Paracetamol..."
              className={inputClass}
            />

            <div className="max-h-52 space-y-1.5 overflow-y-auto rounded-xl border border-[#D6E6E1] bg-[#F8FBFA] p-2">
              {filteredCatalog.length === 0 ? (
                <p className="p-2 text-xs text-slate-500">
                  No se encontraron medicamentos con ese nombre o clave en el Cuadro Básico IMSS.
                </p>
              ) : (
                filteredCatalog.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => selectCatalogMed(item)}
                    className="block w-full rounded-lg border border-[#EAF4F1] bg-white px-3 py-2 text-left text-xs transition hover:border-[#0D9488] hover:bg-[#EAF4F1]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <strong className="text-[#0F2D3D]">{item.name}</strong>
                      <span className="rounded bg-[#EAF4F1] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#0F766E]">
                        {item.code}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {item.presentation}
                    </p>
                  </button>
                ))
              )}
            </div>

            {selectedMed && (
              <div className="space-y-2.5 rounded-xl border-2 border-[#0D9488] bg-[#F6FAF8] p-3">
                <p className="text-xs font-extrabold text-[#0F2D3D]">
                  Configurar posología: {selectedMed.name} ({selectedMed.code})
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="text-xs font-semibold">
                    Presentación
                    <input
                      className={inputClass}
                      value={medFields.presentacion}
                      onChange={(e) =>
                        setMedFields((m) => ({ ...m, presentacion: e.target.value }))
                      }
                    />
                  </label>
                  <label className="text-xs font-semibold">
                    Dosis
                    <input
                      className={inputClass}
                      value={medFields.dosis}
                      onChange={(e) =>
                        setMedFields((m) => ({ ...m, dosis: e.target.value }))
                      }
                    />
                  </label>
                  <label className="text-xs font-semibold">
                    Vía
                    <input
                      className={inputClass}
                      value={medFields.via}
                      onChange={(e) =>
                        setMedFields((m) => ({ ...m, via: e.target.value }))
                      }
                    />
                  </label>
                  <label className="text-xs font-semibold">
                    Frecuencia
                    <input
                      className={inputClass}
                      value={medFields.frecuencia}
                      onChange={(e) =>
                        setMedFields((m) => ({ ...m, frecuencia: e.target.value }))
                      }
                    />
                  </label>
                  <label className="text-xs font-semibold">
                    Duración
                    <input
                      className={inputClass}
                      value={medFields.duracion}
                      onChange={(e) =>
                        setMedFields((m) => ({ ...m, duracion: e.target.value }))
                      }
                    />
                  </label>
                  <label className="text-xs font-semibold">
                    Cantidad a surtir
                    <input
                      className={inputClass}
                      value={medFields.cantidad}
                      onChange={(e) =>
                        setMedFields((m) => ({ ...m, cantidad: e.target.value }))
                      }
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={addMedication}
                  className="w-full rounded-xl bg-[#0D9488] py-2 text-xs font-extrabold text-white hover:bg-[#0F2D3D]"
                >
                  + Agregar a la Receta
                </button>
              </div>
            )}
          </div>
        </section>

        {/* VISTA IMPRIMIBLE DE LA RECETA MÉDICA GENÉRICA */}
        <section className="rounded-2xl border-2 border-[#0F2D3D] bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 border-b-2 border-[#0F2D3D] pb-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-[#0F2D3D] sm:text-xl">
                RECETA MÉDICA
              </h2>
              <p className="text-xs font-semibold text-[#0F766E]">
                {doctor.unidad}
              </p>
              <p className="text-xs text-slate-500">Fecha: {issueDate}</p>
            </div>
            <div className="text-left text-xs text-[#0F2D3D] sm:text-right">
              <p className="text-sm font-extrabold">{doctor.nombre}</p>
              <p>
                Céd. Prof.: <strong>{doctor.cedula}</strong> · Matrícula:{" "}
                <strong>{doctor.matricula}</strong>
              </p>
            </div>
          </div>

          <div className="mt-3 space-y-2 border-b border-[#D6E6E1] pb-3 text-xs">
            <p className="whitespace-pre-line">
              <strong>Datos del paciente / Nota médica:</strong>{" "}
              {patientNote || "No especificado"}
            </p>
            {diagnosesText && (
              <p className="whitespace-pre-line">
                <strong>Diagnósticos CIE-10:</strong> {diagnosesText}
              </p>
            )}
          </div>

          <div className="mt-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0F2D3D]">
              Prescripción (Cuadro Básico IMSS)
            </h3>
            {prescribedList.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">
                Usa el buscador del Cuadro Básico IMSS para agregar medicamentos a esta receta.
              </p>
            ) : (
              <ol className="mt-2 space-y-2 text-xs">
                {prescribedList.map((med, idx) => (
                  <li
                    key={med.id}
                    className="flex items-start justify-between gap-2 rounded-xl border border-[#D6E6E1] bg-[#F8FBFA] p-3"
                  >
                    <div>
                      <p className="font-bold text-[#0F2D3D]">
                        {idx + 1}. {med.name}{" "}
                        <span className="font-mono text-[11px] font-normal text-slate-500">
                          [Clave {med.code}] · {med.presentacion}
                        </span>
                      </p>
                      <p className="mt-0.5 text-slate-700">
                        {med.dosis} · Vía {med.via} · {med.frecuencia} · durante{" "}
                        {med.duracion} · Surtir: {med.cantidad}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMedication(med.id)}
                      className="shrink-0 font-bold text-rose-700 hover:underline print:hidden"
                    >
                      Quitar ×
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="mt-4 border-t border-[#D6E6E1] pt-3 text-xs">
            <p className="whitespace-pre-line">
              <strong>Indicaciones generales:</strong> {indicationsText}
            </p>
            <div className="mt-8 flex justify-center sm:justify-end">
              <div className="w-full border-t border-[#0F2D3D] pt-1 text-center text-xs sm:w-64">
                <strong>{doctor.nombre}</strong>
                <p className="text-[11px] text-slate-500">Firma del médico</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
