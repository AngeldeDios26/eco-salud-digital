"use client";

import Link from "next/link";
import { Suspense, use, useRef, useState } from "react";

type SearchParams = Promise<{
  modalidad?: string | string[];
  tipo?: string | string[];
}>;

type HojaClinicaProps = {
  searchParams: SearchParams;
};

const inputClassName =
  "mt-2 w-full rounded-xl border border-[#DCE9E6] bg-white px-4 py-3 text-[#123C50] outline-none transition placeholder:text-slate-400 focus:border-[#18A69A] focus:ring-2 focus:ring-[#18A69A]/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

const sectionClassName =
  "rounded-2xl border border-[#DCE9E6] bg-white p-6 shadow-sm sm:p-8";

const antecedents = [
  {
    title: "Antecedentes personales patológicos",
    name: "antecedentesPatologicos",
    placeholder:
      "Antecedentes de enfermedades crónicas, enfermedades infectocontagiosas, enfermedades relevantes, hospitalizaciones y otros padecimientos de importancia clínica. Especificar diagnóstico, fecha de inicio, tratamiento y estado actual.",
  },
  {
    title: "Antecedentes personales no patológicos",
    name: "antecedentesNoPatologicos",
    placeholder:
      "Registrar condiciones de vivienda, alimentación, actividad física, higiene personal, hábitos de sueño, inmunizaciones y otros factores relacionados con el entorno y estilo de vida.",
  },
  {
    title: "Antecedentes heredofamiliares",
    name: "antecedentesHeredofamiliares",
    placeholder:
      "Registrar antecedentes familiares de enfermedades hereditarias, crónicas, cardiovasculares, metabólicas, oncológicas, neurológicas y otros padecimientos relevantes. Especificar parentesco y enfermedad identificada.",
  },
  {
    title: "Alergias",
    name: "alergias",
    placeholder:
      "Investigar alergias a medicamentos, alimentos, sustancias ambientales, látex y otros agentes. Especificar agente causal, tipo de reacción y gravedad cuando se conozcan.",
  },
  {
    title: "Toxicomanías",
    name: "toxicomanias",
    placeholder:
      "Investigar consumo de tabaco, alcohol, sustancias psicoactivas y otras sustancias. Especificar tipo de sustancia, cantidad, frecuencia, tiempo de consumo, fecha de último consumo y antecedentes de consumo previo.",
  },
  {
    title: "Antecedentes ginecoobstétricos",
    name: "antecedentesGinecoobstetricos",
    placeholder:
      "Registrar menarca, características del ciclo menstrual, fecha de última menstruación, inicio de vida sexual cuando corresponda, métodos anticonceptivos, gestaciones, partos, cesáreas, abortos, complicaciones obstétricas y antecedentes ginecológicos relevantes.",
    disabledForMen: true,
  },
];

const examTemplates = [
  {
    id: "estado-general",
    title: "Estado general",
    text: "Paciente consciente, alerta y orientado en persona, tiempo y espacio. Cooperador durante la exploración, con adecuada actitud y estado general. Marcha y movilidad espontánea conservadas.",
  },
  {
    id: "cabeza-cuello",
    title: "Cabeza, cuello, ojos, boca y faringe",
    text: "Cráneo normocéfalo, sin deformidades visibles. Cuello cilíndrico, simétrico, con movilidad conservada, sin adenomegalias palpables ni masas cervicales evidentes. Pupilas isocóricas y normorreactivas a la luz, movimientos oculares conservados y conjuntivas sin alteraciones aparentes. Pabellones auriculares sin alteraciones visibles. Mucosa oral hidratada, sin lesiones aparentes. Labios, lengua y encías sin alteraciones visibles. Orofaringe sin hiperemia ni exudados. Amígdalas sin aumento de volumen ni alteraciones aparentes.",
  },
  {
    id: "cardiovascular",
    title: "Cardiovascular",
    text: "Ruidos cardiacos rítmicos, de adecuada intensidad y frecuencia, sin soplos ni fenómenos agregados. Pulsos periféricos palpables y simétricos. Llenado capilar conservado.",
  },
  {
    id: "respiratorio",
    title: "Respiratorio",
    text: "Tórax simétrico, con adecuada expansión bilateral. Movimientos respiratorios conservados. Murmullo vesicular presente bilateralmente, sin estertores, sibilancias ni otros ruidos agregados.",
  },
  {
    id: "digestivo",
    title: "Digestivo",
    text: "Abdomen blando, depresible, sin dolor a la palpación superficial ni profunda. Peristalsis presente. Sin datos de irritación peritoneal ni masas palpables.",
  },
  {
    id: "genitourinario",
    title: "Genitourinario",
    text: "Región genitourinaria sin alteraciones externas evidentes a la inspección, cuando se realiza. Sin dolor referido a la palpación de regiones renales. Exploración específica de acuerdo con las características clínicas y el consentimiento del paciente.",
  },
  {
    id: "musculoesqueletico",
    title: "Musculoesquelético",
    text: "Extremidades simétricas, sin deformidades evidentes. Arcos de movilidad conservados. Fuerza muscular y tono aparentemente conservados. Sin edema ni limitación funcional evidente.",
  },
];

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function Field({
  label,
  name,
  placeholder = "Sin información",
  type = "text",
}: {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-[#123C50]">
      {label}
      <input className={inputClassName} name={name} type={type} placeholder={placeholder} />
    </label>
  );
}

function TextField({
  label,
  name,
  placeholder = "Sin información. Puedes escribir aquí.",
  rows = 4,
}: {
  label: string;
  name: string;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block text-sm font-semibold text-[#123C50]">
      {label}
      <textarea
        className={`${inputClassName} resize-y`}
        name={name}
        rows={rows}
        placeholder={placeholder}
      />
    </label>
  );
}

function SectionHeading({
  number,
  children,
  note,
}: {
  number: string;
  children: React.ReactNode;
  note?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E9F4F2] text-sm font-extrabold text-[#18A69A]">
        {number}
      </span>
      <div>
        <h2 className="text-lg font-extrabold uppercase tracking-wide text-[#123C50] sm:text-xl">
          {children}
        </h2>
        {note && <p className="mt-1 text-sm text-slate-500">{note}</p>}
      </div>
    </div>
  );
}

function AccordionBar({
  id,
  title,
  expanded,
  onToggle,
  disabled = false,
  children,
}: {
  id: string;
  title: string;
  expanded: boolean;
  onToggle: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={"overflow-hidden rounded-xl border transition-colors " + (
        disabled
          ? "border-[#DCE9E6] bg-slate-50"
          : expanded
            ? "border-[#18A69A] bg-white shadow-sm"
            : "border-[#DCE9E6] bg-white"
      )}
    >
      <button
        id={id + "-trigger"}
        type="button"
        aria-expanded={expanded}
        aria-controls={id + "-panel"}
        disabled={disabled}
        onClick={onToggle}
        className={"flex min-h-14 w-full items-center justify-between gap-4 px-4 py-4 text-left font-bold text-[#123C50] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#18A69A] sm:px-5 " + (
          disabled
            ? "cursor-not-allowed text-slate-500"
            : "cursor-pointer hover:bg-[#F4F8F7]"
        )}
      >
        <span>{title}</span>
        <span className="flex shrink-0 items-center gap-3">
          {disabled && (
            <span className="text-xs font-semibold text-slate-500">Deshabilitado</span>
          )}
          <span
            aria-hidden="true"
            className={"text-xl leading-none text-[#18A69A] transition-transform " + (
              expanded ? "rotate-180" : ""
            )}
          >
            {expanded ? "-" : "+"}
          </span>
        </span>
      </button>
      {expanded && (
        <div
          id={id + "-panel"}
          role="region"
          aria-labelledby={id + "-trigger"}
          className="border-t border-[#DCE9E6] px-4 pb-5 pt-4 sm:px-5"
        >
          {children}
        </div>
      )}
    </div>
  );
}

function HojaClinicaFallback() {
  return (
    <main className="min-h-screen bg-[#F4F8F7] px-4 py-10 text-[#123C50] sm:px-6">
      <div className="mx-auto max-w-5xl rounded-2xl border border-[#DCE9E6] bg-white p-6 shadow-sm sm:p-8">
        Cargando hoja clínica...
      </div>
    </main>
  );
}

export default function HojaClinica({ searchParams }: HojaClinicaProps) {
  return (
    <Suspense fallback={<HojaClinicaFallback />}>
      <HojaClinicaContent searchParams={searchParams} />
    </Suspense>
  );
}

function HojaClinicaContent({ searchParams }: HojaClinicaProps) {
  const params = use(searchParams);
  const rawModalidad = getSingleValue(params.modalidad);
  const rawTipo = getSingleValue(params.tipo);
  const modalidad = rawModalidad === "qr" || rawModalidad === "manual" ? rawModalidad : null;
  const tipo = rawTipo === "primera-vez" || rawTipo === "subsecuente" ? rawTipo : null;
  const seleccionValida = modalidad !== null && tipo !== null && !(modalidad === "manual" && tipo === "subsecuente");
  const [sexo, setSexo] = useState("");
  const [antecedentTexts, setAntecedentTexts] = useState<Record<string, string>>({});
  const [activeAntecedent, setActiveAntecedent] = useState<string | null>(null);
  const [activeExamination, setActiveExamination] = useState<string | null>(null);
  const [exploracion, setExploracion] = useState<Record<string, string>>({});
  const antecedentFields = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const examinationFields = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const aplicarPlantilla = (id: string, texto: string) => {
    setExploracion((actual) => ({ ...actual, [id]: texto }));
  };

  const toggleAntecedent = (id: string, disabled = false) => {
    if (disabled) return;
    if (activeAntecedent === id) {
      setActiveAntecedent(null);
      return;
    }
    setActiveAntecedent(id);
    requestAnimationFrame(() => antecedentFields.current[id]?.focus());
  };

  const toggleExamination = (id: string) => {
    if (activeExamination === id) {
      setActiveExamination(null);
      return;
    }
    setActiveExamination(id);
    requestAnimationFrame(() => examinationFields.current[id]?.focus());
  };

  return (
    <main className="min-h-screen bg-[#F4F8F7] text-[#123C50]">
      <header className="border-b border-[#DCE9E6] bg-white px-5 py-5 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/profesionales/consulta"
              className="font-bold text-[#18A69A] transition hover:text-[#123C50]"
            >
              ← Volver a selección de consulta
            </Link>
            <h1 className="mt-4 text-2xl font-extrabold sm:text-3xl">Hoja clínica</h1>
            <p className="mt-1 text-sm text-slate-500">
              Consulta Médica · Información capturada manualmente no se guarda.
            </p>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Selección de consulta">
            <span className="rounded-full bg-[#E9F4F2] px-4 py-2 text-sm font-bold text-[#123C50]">
              Modalidad: {modalidad === "qr" ? "Mediante QR" : modalidad === "manual" ? "Manual" : "No recibida"}
            </span>
            <span className="rounded-full bg-[#E9F4F2] px-4 py-2 text-sm font-bold text-[#123C50]">
              Tipo: {tipo === "primera-vez" ? "Primera vez" : tipo === "subsecuente" ? "Subsecuente" : "No recibido"}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-7 sm:px-6 sm:py-10">
        {!seleccionValida && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="status">
            La modalidad o el tipo de consulta no es válido. Regresa a la selección para elegir una combinación permitida.
          </div>
        )}

        <section className={sectionClassName}>
          <SectionHeading number="01" note="Captura manual; los campos vacíos permanecen en blanco.">
            Identificación del paciente
          </SectionHeading>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Nombre" name="nombre" />
            </div>
            <Field label="Fecha de nacimiento" name="fechaNacimiento" type="date" />
            <Field label="Edad" name="edad" placeholder="Sin información" />
            <label className="block text-sm font-semibold text-[#123C50]">
              Sexo
              <select
                className={inputClassName}
                name="sexo"
                value={sexo}
                onChange={(event) => {
                  const nextSex = event.target.value;
                  setSexo(nextSex);
                  if (nextSex === "masculino" && activeAntecedent === "antecedentesGinecoobstetricos") {
                    setActiveAntecedent(null);
                  }
                }}
              >
                <option value="">Selecciona una opción</option>
                <option value="femenino">Femenino</option>
                <option value="masculino">Masculino</option>
                <option value="otro">Otro</option>
                <option value="sin-especificar">Prefiere no especificar</option>
              </select>
            </label>
          </div>
          <p className="mt-4 rounded-xl bg-[#F4F8F7] p-4 text-sm text-slate-500">
            {modalidad === "qr"
              ? "Espacios preparados para futura precarga mediante QR; aún no hay información del paciente."
              : "Sin información del paciente. La captura es manual."}
          </p>
        </section>

        <section className={sectionClassName}>
          <SectionHeading
            number="02"
            note={modalidad === "qr" ? "Campo manual con espacio reservado para futura precarga QR." : "Campo de captura manual."}
          >
            Motivo de consulta
          </SectionHeading>
          <TextField label="Descripción" name="motivoConsulta" rows={3} />
        </section>

        <section className={sectionClassName}>
          <SectionHeading
            number="03"
            note={modalidad === "qr" ? "Leyendas editables en cada lista; espacio preparado para futura precarga QR." : "Leyendas editables; captura manual."}
          >
            Antecedentes
          </SectionHeading>
          <div className="space-y-3">
            {antecedents.map((item) => (
              <AccordionBar
                id={"antecedente-" + item.name}
                key={item.name}
                title={item.title}
                expanded={activeAntecedent === item.name}
                onToggle={() =>
                  toggleAntecedent(
                    item.name,
                    Boolean(item.disabledForMen && sexo === "masculino"),
                  )
                }
                disabled={item.disabledForMen && sexo === "masculino"}
              >
                <label
                  htmlFor={"antecedente-field-" + item.name}
                  className="block text-sm font-semibold text-[#123C50]"
                >
                  Información (opcional)
                  <textarea
                    ref={(field) => {
                      antecedentFields.current[item.name] = field;
                    }}
                    id={"antecedente-field-" + item.name}
                    className={`${inputClassName} resize-y`}
                    name={item.name}
                    rows={4}
                    value={antecedentTexts[item.name] ?? ""}
                    onChange={(event) =>
                      setAntecedentTexts((current) => ({
                        ...current,
                        [item.name]: event.target.value,
                      }))
                    }
                    placeholder={item.placeholder}
                    disabled={Boolean(item.disabledForMen && sexo === "masculino")}
                  />
                  {item.disabledForMen && sexo === "masculino" && (
                    <span className="mt-2 block text-xs font-semibold text-slate-500">
                      Deshabilitado para pacientes registrados como hombres.
                    </span>
                  )}
                </label>
              </AccordionBar>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Las leyendas son indicaciones editables. No se agregan al campo hasta que el profesional escriba; no se insertan negaciones automáticamente.
          </p>
        </section>

        <section className={sectionClassName}>
          <SectionHeading number="04" note="Captura exclusivamente manual.">
            Padecimiento actual
          </SectionHeading>
          <TextField label="Descripción del padecimiento" name="padecimientoActual" />
        </section>

        <section className={sectionClassName}>
          <SectionHeading number="05" note="Los textos normales son opcionales y solo se insertan al seleccionarlos.">
            Exploración física
          </SectionHeading>
          <div className="space-y-3">
            {examTemplates.map((item) => (
              <AccordionBar
                id={"exam-" + item.id}
                key={item.id}
                title={item.title}
                expanded={activeExamination === item.id}
                onToggle={() => toggleExamination(item.id)}
              >
                <label
                  htmlFor={"exploracion-" + item.id}
                  className="block text-sm font-semibold text-[#123C50]"
                >
                  Hallazgos observados
                  <textarea
                    ref={(field) => {
                      examinationFields.current[item.id] = field;
                    }}
                    id={"exploracion-" + item.id}
                    name={"exploracion-" + item.id}
                    rows={4}
                    value={exploracion[item.id] ?? ""}
                    onChange={(event) => aplicarPlantilla(item.id, event.target.value)}
                    placeholder="Sin información. Escribe solo los hallazgos explorados."
                    className={inputClassName + " resize-y"}
                  />
                </label>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => aplicarPlantilla(item.id, item.text)}
                    className="rounded-lg border border-[#18A69A] px-4 py-2 text-sm font-bold text-[#123C50] transition hover:bg-[#E9F4F2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#18A69A]"
                  >
                    Usar plantilla normal
                  </button>
                  <button
                    type="button"
                    onClick={() => aplicarPlantilla(item.id, "")}
                    className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#18A69A]"
                  >
                    Dejar en blanco
                  </button>
                </div>
              </AccordionBar>
            ))}
            <AccordionBar
              id="exam-otros"
              title="Otros hallazgos"
              expanded={activeExamination === "otros"}
              onToggle={() => toggleExamination("otros")}
            >
              <label
                htmlFor="exploracion-otros"
                className="block text-sm font-semibold text-[#123C50]"
              >
                Hallazgos observados
                <textarea
                  ref={(field) => {
                    examinationFields.current.otros = field;
                  }}
                  id="exploracion-otros"
                  name="exploracion-otros"
                  rows={4}
                  value={exploracion.otros ?? ""}
                  onChange={(event) => aplicarPlantilla("otros", event.target.value)}
                  placeholder="Campo libre. Sin información."
                  className={inputClassName + " resize-y"}
                />
              </label>
            </AccordionBar>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Selecciona una plantilla normal únicamente si comprobaste esos hallazgos. Cada texto puede editarse o dejarse completamente en blanco.
          </p>
        </section>

        <section className={sectionClassName}>
          <SectionHeading number="06" note="La futura búsqueda de diagnósticos utilizará el catálogo CIE-10.">
            Diagnósticos
          </SectionHeading>
          <div className="rounded-xl border border-dashed border-[#B8D2CE] bg-[#F8FBFA] p-5">
            <h3 className="font-bold">Diagnósticos existentes</h3>
            <p className="mt-2 text-sm text-slate-500">Sin diagnósticos registrados.</p>
          </div>
          <div className="mt-5 rounded-xl border border-[#DCE9E6] p-5">
            <h3 className="font-bold">Agregar diagnóstico</h3>
            <p className="mt-1 text-sm text-slate-500">
              Espacio reservado para búsqueda CIE-10. La búsqueda aún no está disponible.
            </p>
            <Field label="Nuevo diagnóstico" name="nuevoDiagnostico" placeholder="Campo vacío; búsqueda próximamente" />
          </div>
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-5">
            <h3 className="font-bold text-amber-950">Diagnósticos crónicos protegidos</h3>
            <p className="mt-2 text-sm text-amber-900">
              No hay diagnósticos crónicos cargados. Los diagnósticos crónicos protegidos no podrán modificarse directamente.
            </p>
          </div>
        </section>

        <section className={sectionClassName}>
          <SectionHeading number="07" note="Espacio reservado para recomendaciones generales relacionadas con los diagnósticos.">
            Tratamiento no farmacológico
          </SectionHeading>
          <div className="mb-5 rounded-xl border border-dashed border-[#B8D2CE] bg-[#F8FBFA] p-5 text-sm text-slate-500">
            Las recomendaciones relacionadas con los diagnósticos aparecerán aquí cuando estén disponibles.
          </div>
          <TextField label="Recomendaciones manuales" name="recomendacionesNoFarmacologicas" />
        </section>

        <section className={sectionClassName}>
          <SectionHeading number="08" note="El módulo de recetas estará disponible próximamente.">
            Expedición de receta médica
          </SectionHeading>
          <button
            type="button"
            disabled
            className="rounded-xl bg-[#123C50] px-6 py-3 font-bold text-white opacity-60"
          >
            Acceder al módulo de recetas
          </button>
        </section>

        <div className="pb-4">
          <Link
            href="/profesionales/consulta"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#18A69A] px-6 py-3 text-center font-bold text-[#123C50] transition hover:bg-[#E9F4F2]"
          >
            Regresar a selección de consulta
          </Link>
        </div>
      </div>
    </main>
  );
}
