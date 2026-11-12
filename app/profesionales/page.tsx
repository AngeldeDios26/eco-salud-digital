"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  favoriteCalculatorsChangedEvent,
  readFavoriteCalculators,
  toggleFavoriteCalculator,
  type FavoriteCalculator,
} from "../../lib/favorite-calculators";
import { clinicalCalculators, type CalculatorField } from "../../lib/clinical-calculators";
import { readRecentCalculators, recordRecentCalculator, recentCalculatorsChangedEvent } from "../../lib/recent-calculators";

const calculatorGroups: { specialty: string; items: FavoriteCalculator[] }[] = [
  { specialty: "Medicina familiar", items: [
    { id: "imc", title: "Índice de masa corporal (IMC)", specialty: "Medicina familiar" },
    { id: "ckd-epi-2021", title: "TFGe CKD-EPI 2021", specialty: "Medicina familiar" },
    { id: "cockcroft-gault", title: "Depuración de creatinina (Cockcroft-Gault)", specialty: "Medicina familiar" },
    { id: "fib-4", title: "Índice FIB-4", specialty: "Medicina familiar" },
    { id: "cha2ds2-vasc", title: "CHA₂DS₂-VASc", specialty: "Medicina familiar" },
  ] },
  { specialty: "Pediatría", items: [
    { id: "peds-imc", title: "IMC pediátrico (sin percentil)", specialty: "Pediatría" },
    { id: "mosteller", title: "Superficie corporal (Mosteller)", specialty: "Pediatría" },
    { id: "holliday-segar", title: "Líquidos de mantenimiento (Holliday-Segar)", specialty: "Pediatría" },
    { id: "edad-corregida", title: "Edad corregida en prematuridad", specialty: "Pediatría" },
    { id: "apgar", title: "Puntaje de Apgar", specialty: "Pediatría" },
  ] },
  { specialty: "Gineco-obstetricia", items: [
    { id: "edad-gestacional-fum", title: "Edad gestacional por FUM", specialty: "Gineco-obstetricia" },
    { id: "fecha-probable-parto", title: "Fecha probable de parto por FUM", specialty: "Gineco-obstetricia" },
    { id: "bishop", title: "Índice de Bishop", specialty: "Gineco-obstetricia" },
    { id: "imc-gestacional", title: "IMC pregestacional", specialty: "Gineco-obstetricia" },
    { id: "ganancia-peso-gestacional", title: "Ganancia de peso gestacional", specialty: "Gineco-obstetricia" },
  ] },
  { specialty: "Medicina interna", items: [
    { id: "ckd-epi-2021", title: "TFGe CKD-EPI 2021", specialty: "Medicina interna" },
    { id: "cockcroft-gault", title: "Depuración de creatinina (Cockcroft-Gault)", specialty: "Medicina interna" },
    { id: "anion-gap", title: "Brecha aniónica", specialty: "Medicina interna" },
    { id: "anion-gap-albumin", title: "Brecha aniónica corregida por albúmina", specialty: "Medicina interna" },
    { id: "child-pugh", title: "Clasificación Child-Pugh", specialty: "Medicina interna" },
  ] },
  { specialty: "Urgencias", items: [
    { id: "qsofa", title: "qSOFA", specialty: "Urgencias" },
    { id: "news2", title: "NEWS2", specialty: "Urgencias" },
    { id: "wells-tep", title: "Wells para tromboembolia pulmonar", specialty: "Urgencias" },
    { id: "wells-tv", title: "Wells para trombosis venosa profunda", specialty: "Urgencias" },
    { id: "heart", title: "Puntaje HEART", specialty: "Urgencias" },
  ] },
];

const vademecumGroups = [
  {
    "number": 1,
    "title": "Analgesia",
    "href": "https://www.imss.gob.mx/sites/all/statics/pdf/cuadros-basicos/Grupo-N1-Analgesia-R.pdf"
  },
  {
    "number": 2,
    "title": "Anestesia",
    "href": "https://www.imss.gob.mx/sites/all/statics/pdf/cuadros-basicos/Grupo-N2-Anestesia-R.pdf"
  },
  {
    "number": 3,
    "title": "Cardiología",
    "href": "https://www.imss.gob.mx/sites/all/statics/pdf/cuadros-basicos/Grupo-N3-Cardiologia-R.pdf"
  },
  {
    "number": 4,
    "title": "Dermatología",
    "href": "https://www.imss.gob.mx/sites/all/statics/pdf/cuadros-basicos/Grupo-N4-Dermatologia-R.pdf"
  },
  {
    "number": 5,
    "title": "Endocrinología y metabolismo",
    "href": "https://www.imss.gob.mx/sites/all/statics/pdf/cuadros-basicos/Grupo-N5-Endocrinologia-y-Metabolismo-R.pdf"
  },
  {
    "number": 6,
    "title": "Enfermedades infecciosas y parasitarias",
    "href": "https://www.imss.gob.mx/sites/all/statics/pdf/cuadros-basicos/Grupo-N6-Enfermedades-Infecciosas-y-Parasitarias-R.pdf"
  },
  {
    "number": 7,
    "title": "Enfermedades inmunoalérgicas",
    "href": "https://www.imss.gob.mx/sites/all/statics/pdf/cuadros-basicos/Grupo-N7-Enfermedades-Inmunoalergicas-R.pdf"
  },
  {
    "number": 8,
    "title": "Gastroenterología",
    "href": "https://www.imss.gob.mx/sites/all/statics/pdf/cuadros-basicos/Grupo-N8-Gastroenterologia-R.pdf"
  },
  {
    "number": 9,
    "title": "Gineco-obstetricia",
    "href": "https://www.imss.gob.mx/sites/all/statics/pdf/cuadros-basicos/Grupo-N9-Gineco-Obstetricia-R.pdf"
  },
  {
    "number": 10,
    "title": "Hematología",
    "href": "https://www.imss.gob.mx/sites/all/statics/pdf/cuadros-basicos/Grupo-N10-Hematologia-R.pdf"
  },
  {
    "number": 11,
    "title": "Intoxicaciones",
    "href": "https://www.imss.gob.mx/sites/all/statics/pdf/cuadros-basicos/Grupo-N11-Intoxicaciones-R.pdf"
  },
  {
    "number": 12,
    "title": "Nefrología y urología",
    "href": "https://www.imss.gob.mx/sites/all/statics/pdf/cuadros-basicos/Grupo-N12-Nefrologia-y-Urologia-R.pdf"
  },
  {
    "number": 13,
    "title": "Neumología",
    "href": "https://www.imss.gob.mx/sites/all/statics/pdf/cuadros-basicos/Grupo-N13-Neumologia-R.pdf"
  },
  {
    "number": 14,
    "title": "Neurología",
    "href": "https://www.imss.gob.mx/sites/all/statics/pdf/cuadros-basicos/Grupo-N14-Neurologia-R.pdf"
  },
  {
    "number": 15,
    "title": "Oftalmología",
    "href": "https://www.imss.gob.mx/sites/all/statics/pdf/cuadros-basicos/Grupo-N15-Oftalmologia-R.pdf"
  },
  {
    "number": 16,
    "title": "Oncología",
    "href": "https://www.imss.gob.mx/sites/all/statics/pdf/cuadros-basicos/Grupo-N16-Oncologia-R.pdf"
  },
  {
    "number": 17,
    "title": "Otorrinolaringología",
    "href": "https://www.imss.gob.mx/sites/all/statics/pdf/cuadros-basicos/Grupo-N17-Otorrinolaringologia-R.pdf"
  },
  {
    "number": 18,
    "title": "Planificación familiar",
    "href": "https://www.imss.gob.mx/sites/all/statics/pdf/cuadros-basicos/Grupo-N18-Planificacion-Familiar-R.pdf"
  },
  {
    "number": 19,
    "title": "Psiquiatría",
    "href": "https://www.imss.gob.mx/sites/all/statics/pdf/cuadros-basicos/Grupo-N19-Psiquiatria-R.pdf"
  },
  {
    "number": 20,
    "title": "Reumatología y traumatología",
    "href": "https://www.imss.gob.mx/sites/all/statics/pdf/cuadros-basicos/Grupo-N20-Reumatologia-y-Traumatologia-R.pdf"
  },
  {
    "number": 21,
    "title": "Soluciones electrolíticas y sustitutos del plasma",
    "href": "https://www.imss.gob.mx/sites/all/statics/pdf/cuadros-basicos/Grupo-N21-Soluciones-Electroliticas-y-Sustitutos-del-Plasma-R.pdf"
  },
  {
    "number": 22,
    "title": "Vacunas, toxoides, inmunoglobulinas y antitoxinas",
    "href": "https://www.imss.gob.mx/sites/all/statics/pdf/cuadros-basicos/Grupo-N22-Vacunas-Toxoides-Inmunoglobulinas-Antitoxinas-R.pdf"
  },
  {
    "number": 23,
    "title": "Cuidados paliativos",
    "href": "https://www.imss.gob.mx/sites/all/statics/pdf/cuadros-basicos/Grupo-N23-Cuidados-Paliativos-R.pdf"
  }
];

function getCalculatorSearchText(calculator: FavoriteCalculator) {
  const formulaTerms: Record<string, string> = {
    "imc": "indice masa corporal bmi peso talla formula",
    "ckd-epi-2021": "ckd epi tfge tfg filtracion glomerular formula",
    "cockcroft-gault": "cockcroft gault depuracion creatinina aclaramiento formula",
    "fib-4": "fib4 fibrosis hepatica edad ast alt plaquetas formula",
    "cha2ds2-vasc": "cha2ds2 vasc riesgo embolico fibrilacion auricular",
    "edad-gestacional-fum": "gestograma semanas embarazo fum edad gestacional formula",
    "fecha-probable-parto": "fpp fecha probable parto regla naegele fum formula",
    "peds-imc": "imc pediatrico indice masa corporal bmi",
    "mosteller": "mosteller superficie corporal formula",
    "holliday-segar": "holliday segar liquidos mantenimiento formula",
  };
  const terms = formulaTerms[calculator.id] ?? calculator.id.replaceAll("-", " ");
  return normalizeSearchText([calculator.title, calculator.specialty, terms].join(" "));
}
function normalizeSearchText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-MX");
}

function calculatorAnchor(calculator: FavoriteCalculator) {
  return "calculadora-" + normalizeSearchText(calculator.specialty).replace(/[^a-z0-9]+/g, "-") + "-" + calculator.id;
}

const sections = [
  {
    id: "calculadoras",
    title: "Calculadoras",
    description: "Catálogo inicial de calculadoras para las cinco especialidades de atención primaria.",
    keywords: "calculadora calculadoras especialidad medicina familiar pediatría ginecología cardiología",
    details: [
      "Cinco herramientas por especialidad, con fuente y límites visibles.",
      "Los resultados orientan cálculos o puntuaciones; no sustituyen la valoración clínica ni establecen diagnósticos por sí solos.",
    ],
  },
  {
    id: "vademecum",
    title: "Vademécum",
    description: "Consulta de medicamentos basada únicamente en el listado institucional del IMSS.",
    keywords: "vademecum medicamento medicamentos cuadro básico imss dosis clave indicación listados institucionales",
    details: [
      "La referencia será el Listado Institucional de Insumos para la Salud del IMSS, antes Cuadros Básicos.",
      "No se incorporarán catálogos comerciales ni formularios de otras instituciones.",
    ],
    href: "https://www.imss.gob.mx/profesionales-salud/cuadros-basicos/medicamentos",
    linkLabel: "Consultar listado de medicamentos del IMSS ↗",
  },
  {
    id: "paraclinicos",
    title: "Paraclínicos",
    description: "Consulta rápida de referencias orientativas de laboratorio y una pauta ordenada para revisar radiografías de tórax.",
    keywords: "paraclínicos laboratorio resultados valores referencia biometría hemoglobina hematocrito eritrocitos leucocitos plaquetas química radiografía rx tórax imagen",
    details: [
      "Las cifras de biometría son ejemplos publicados para adultos; utiliza siempre el intervalo impreso por el laboratorio que procesó la muestra.",
      "La revisión de imagen es una lista de comprobación educativa y no sustituye el informe radiológico ni la correlación clínica.",
    ],
  },
  {
    id: "escalas",
    title: "Escalas y cuestionarios",
    description: "Tamizaje breve PHQ-2 y acceso a instrumentos oficiales como PHQ-9, GAD-7 y Epworth.",
    keywords: "escalas cuestionarios epworth somnolencia depresión phq-2 phq2 phq-9 phq9 gad-7 gad7 ansiedad salud mental tamizaje",
    details: [
      "El resultado de un tamizaje no confirma ni descarta por sí solo un diagnóstico; confirma la evaluación clínica y el seguimiento necesarios.",
      "Epworth requiere licencia para su uso; el portal enlaza al trámite oficial y no reproduce sus reactivos.",
    ],
  },
];

const inputClass = "mt-2 w-full rounded-xl border border-[#DCE9E6] bg-white px-4 py-3 text-[#123C50] outline-none focus:border-[#18A69A] focus:ring-2 focus:ring-[#18A69A]/15";

function CalculatorWidget({ calculatorId, onCalculated }: { calculatorId: string; onCalculated: () => void }) {
  const definition = clinicalCalculators[calculatorId];
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries((definition?.fields ?? []).map((field) => [field.key, field.kind === "checkbox" ? "false" : ""])),
  );
  const [result, setResult] = useState("");

  if (!definition) {
    return <p className="mt-2 text-xs text-slate-500">En preparación: falta validar e implementar el cálculo y su referencia.</p>;
  }

  const updateValue = (key: string, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setResult("");
  };
  const isComplete = definition.fields.every((field) => field.kind === "checkbox" || values[field.key]?.trim());
  const isWithinRange = definition.fields.every((field) => {
    if (field.kind !== "number" || !values[field.key]?.trim()) return true;
    const value = Number(values[field.key]);
    return Number.isFinite(value) && (field.min === undefined || value >= field.min) && (field.max === undefined || value <= field.max);
  });

  return (
    <div className="mt-3 rounded-xl border border-[#DCE9E6] bg-white p-3">
      <form className="mt-3 space-y-3" onSubmit={(event) => {
        event.preventDefault();
        if (isComplete && isWithinRange) {
          setResult(definition.calculate(values));
          onCalculated();
        }
      }}>
        {definition.fields.map((field: CalculatorField) => field.kind === "checkbox" ? (
          <label key={field.key} className="flex items-start gap-2 text-sm text-[#123C50]">
            <input type="checkbox" checked={values[field.key] === "true"} onChange={(event) => updateValue(field.key, String(event.target.checked))} className="mt-1 accent-[#18A69A]" />
            <span>{field.label}</span>
          </label>
        ) : field.kind === "date" ? (
          <label key={field.key} className="block text-sm font-semibold text-[#123C50]">{field.label}
            <input className={inputClass} type="date" value={values[field.key]} onChange={(event) => updateValue(field.key, event.target.value)} required />
          </label>
        ) : field.kind === "select" ? (
          <label key={field.key} className="block text-sm font-semibold text-[#123C50]">{field.label}
            <select className={inputClass} value={values[field.key]} onChange={(event) => updateValue(field.key, event.target.value)} required>
              <option value="">Selecciona una opción</option>
              {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        ) : (
          <label key={field.key} className="block text-sm font-semibold text-[#123C50]">{field.label}{field.unit ? ` (${field.unit})` : ""}
            <input className={inputClass} type="number" min={field.min} max={field.max} step={field.step ?? "any"} value={values[field.key]} onChange={(event) => updateValue(field.key, event.target.value)} required />
          </label>
        ))}
        <button type="submit" disabled={!isComplete || !isWithinRange} className="rounded-lg bg-[#123C50] px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">Calcular</button>
        {!isWithinRange && <p role="alert" className="text-sm text-red-700">Revisa los valores: hay uno fuera del intervalo permitido.</p>}
        {result && <p role="status" className="rounded-lg bg-[#E9F4F2] p-3 font-bold text-[#123C50]">Resultado: {result}</p>}
        <p className="text-xs leading-relaxed text-slate-600">{definition.note}</p>
        <a href={definition.source} target="_blank" rel="noreferrer" className="inline-block text-xs font-semibold text-[#16877F] underline underline-offset-2">Fuente: {definition.sourceLabel} ↗</a>
      </form>
    </div>
  );
}

function Phq2Widget() {
  const [answers, setAnswers] = useState(["", ""]);
  const score = answers.reduce((sum, answer) => sum + (answer ? Number(answer) : 0), 0);
  const complete = answers.every((answer) => answer !== "");
  const questions = [
    "Poco interés o placer en hacer cosas",
    "Sentirse decaído(a), deprimido(a) o sin esperanzas",
  ];
  const options = [
    ["0", "Nunca"],
    ["1", "Varios días"],
    ["2", "Más de la mitad de los días"],
    ["3", "Casi todos los días"],
  ];

  return (
    <div className="mt-4 rounded-xl border border-[#DCE9E6] bg-white p-4">
      <h3 className="font-bold text-[#123C50]">PHQ-2 · últimas 2 semanas</h3>
      <p className="mt-1 text-sm text-slate-600">¿Con qué frecuencia le han afectado estos problemas?</p>
      <div className="mt-3 space-y-4">
        {questions.map((question, index) => (
          <label key={question} className="block text-sm font-semibold text-[#123C50]">
            {index + 1}. {question}
            <select className={inputClass} value={answers[index]} onChange={(event) => {
              setAnswers((current) => current.map((answer, answerIndex) => answerIndex === index ? event.target.value : answer));
            }}>
              <option value="">Selecciona una respuesta</option>
              {options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        ))}
      </div>
      {complete && (
        <p role="status" className="mt-4 rounded-lg bg-[#E9F4F2] p-3 text-sm text-[#123C50]">
          Puntaje: <strong>{score}/6</strong>. {score >= 3 ? "Tamizaje positivo (punto de corte usual ≥3); completar evaluación clínica y valorar PHQ-9." : "Por debajo del punto de corte usual (≥3); esto no descarta depresión si hay sospecha clínica."}
        </p>
      )}
      <p className="mt-3 text-xs leading-relaxed text-slate-600">Herramienta breve para adultos. Documenta el resultado y valora contexto, deterioro funcional y riesgo; no es diagnóstico. El punto de corte puede variar según población y protocolo local.</p>
    </div>
  );
}

export default function Profesionales() {
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<FavoriteCalculator[]>([]);
  const [recentCalculators, setRecentCalculators] = useState<FavoriteCalculator[]>([]);
  useEffect(() => {
    const syncFavorites = () => setFavorites(readFavoriteCalculators());
    syncFavorites();
    window.addEventListener(favoriteCalculatorsChangedEvent, syncFavorites);
    window.addEventListener("storage", syncFavorites);
    return () => {
      window.removeEventListener(favoriteCalculatorsChangedEvent, syncFavorites);
      window.removeEventListener("storage", syncFavorites);
    };
  }, []);
  useEffect(() => {
    const syncRecents = () => setRecentCalculators(readRecentCalculators());
    syncRecents();
    window.addEventListener(recentCalculatorsChangedEvent, syncRecents);
    window.addEventListener("storage", syncRecents);
    return () => {
      window.removeEventListener(recentCalculatorsChangedEvent, syncRecents);
      window.removeEventListener("storage", syncRecents);
    };
  }, []);
  const normalizedQuery = normalizeSearchText(query.trim());
  const visibleCalculatorGroups = useMemo(() => {
    const recentOrder = new Map(recentCalculators.map((calculator, index) => [calculator.id + "::" + calculator.specialty, index]));
    const recentIndex = (calculator: FavoriteCalculator) => recentOrder.get(calculator.id + "::" + calculator.specialty) ?? Number.MAX_SAFE_INTEGER;
    if (!normalizedQuery) return calculatorGroups.map((group) => ({ ...group, items: [...group.items].sort((a, b) => recentIndex(a) - recentIndex(b)) }));
    return calculatorGroups.map((group) => ({
      ...group,
      items: group.items.filter((calculator) =>
        getCalculatorSearchText(calculator).includes(normalizedQuery),
      ).sort((a, b) => recentIndex(a) - recentIndex(b)),
    })).filter((group) => group.items.length > 0);
  }, [normalizedQuery, recentCalculators]);
  const visibleRecentCalculators = useMemo(() => {
    const catalog = calculatorGroups.flatMap((group) => group.items);
    return recentCalculators.flatMap((recent) => {
      const calculator = catalog.find((item) => item.id === recent.id && item.specialty === recent.specialty);
      return calculator && (!normalizedQuery || normalizeSearchText(`${calculator.title} ${calculator.specialty}`).includes(normalizedQuery)) ? [calculator] : [];
    });
  }, [normalizedQuery, recentCalculators]);
  const visibleVademecumGroups = useMemo(() => {
    const generalCatalogTerms = normalizeSearchText("vademecum medicamento medicamentos cuadro basico imss dosis clave indicacion listados institucionales");
    if (!normalizedQuery || generalCatalogTerms.includes(normalizedQuery)) return vademecumGroups;
    return vademecumGroups.filter((group) =>
      normalizeSearchText(`grupo ${group.number} ${group.title}`).includes(normalizedQuery),
    );
  }, [normalizedQuery]);
  const filteredSections = useMemo(() => {
    if (!normalizedQuery) return sections;
    return sections.filter((section) =>
      normalizeSearchText(`${section.title} ${section.description} ${section.keywords}`).includes(normalizedQuery)
        || (section.id === "calculadoras" && visibleCalculatorGroups.length > 0)
        || (section.id === "vademecum" && visibleVademecumGroups.length > 0),
    );
  }, [normalizedQuery, visibleCalculatorGroups, visibleVademecumGroups]);

  return (
    <main className="min-h-screen bg-[#F4F8F7] text-[#123C50]">
      <header className="border-b border-[#DCE9E6] bg-white px-6 py-5">
        <div className="mx-auto max-w-5xl">
          <Link href="/" className="font-bold text-[#18A69A]">← Volver al inicio</Link>
          <h1 className="mt-5 text-3xl font-extrabold">Herramientas</h1>
          <label className="mt-5 block text-sm font-semibold">
            Buscar herramientas
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className={inputClass}
              placeholder="Buscar calculadoras, medicamentos, estudios o escalas"
            />
          </label>
        </div>
      </header>

      <section className="mx-auto max-w-5xl space-y-4 px-6 py-8" aria-label="Áreas de herramientas">
        {filteredSections.map((section) => (
        <details key={section.id} id={section.id} open={section.id === "calculadoras"} className="group rounded-2xl border border-[#DCE9E6] bg-white p-5 shadow-sm sm:p-6">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
              <span>
                <span className="block text-xl font-extrabold">{section.title}</span>
                <span className="mt-2 block text-sm leading-relaxed text-slate-600">{section.description}</span>
              </span>
              <span className="mt-1 rounded-full bg-[#E9F4F2] px-3 py-1 text-sm font-bold text-[#16877F] group-open:rotate-180" aria-hidden="true">⌄</span>
            </summary>
            <div className="mt-5 border-t border-[#DCE9E6] pt-4">
              <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-600">
                {section.details.map((detail) => <li key={detail}>{detail}</li>)}
              </ul>
              {section.href && (
                <a href={section.href} target="_blank" rel="noreferrer" className="mt-4 inline-block font-bold text-[#16877F] underline underline-offset-4">
                  {section.linkLabel}
                </a>
              )}
              {section.id === "vademecum" && (
                <div className="mt-5">
                  <p className="text-sm leading-relaxed text-slate-600">Busca por grupo terapéutico y abre la ficha publicada por el IMSS. La información se consulta en la fuente oficial para conservar sus indicaciones y actualizaciones.</p>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                    {visibleVademecumGroups.map((group) => (
                      <li key={group.number}>
                        <a href={group.href} target="_blank" rel="noreferrer" className="flex h-full items-center justify-between gap-3 rounded-xl border border-[#DCE9E6] bg-[#F8FBFA] px-4 py-3 text-sm font-semibold text-[#123C50] hover:border-[#18A69A] hover:bg-[#E9F4F2]">
                          <span>{group.number}. {group.title}</span><span className="shrink-0 text-[#16877F]">PDF IMSS ↗</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                  {visibleVademecumGroups.length === 0 && <p role="status" className="mt-4 text-sm text-slate-600">No hay grupos del listado con ese término.</p>}
                </div>
              )}
              {section.id === "calculadoras" && (
                <div className="mt-5 space-y-5">
                  <p className="text-sm text-slate-600">Las calculadoras están listas para usar y no guardan los datos introducidos. Usa la búsqueda para ir directamente a una fórmula; las últimas utilizadas aparecen primero.</p>
                  {visibleRecentCalculators.length > 0 && (
                    <section className="rounded-xl border border-[#B8D2CE] bg-[#F8FBFA] p-4" aria-label="Calculadoras usadas recientemente">
                      <h3 className="font-bold text-[#123C50]">Usadas recientemente</h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {visibleRecentCalculators.map((calculator) => <a key={calculator.id + calculator.specialty} href={`#${calculatorAnchor(calculator)}`} className="rounded-full border border-[#DCE9E6] bg-white px-3 py-2 text-sm font-semibold text-[#123C50] hover:border-[#18A69A]">{calculator.title} <span className="text-xs text-slate-500">· {calculator.specialty}</span></a>)}
                      </div>
                    </section>
                  )}
                  {visibleCalculatorGroups.map((group) => (
                    <section key={group.specialty} aria-label={group.specialty}>
                      <h3 className="mb-2 font-bold text-[#123C50]">{group.specialty}</h3>
                      <ul className="grid gap-3 lg:grid-cols-2">
                        {group.items.map((calculator) => {
                          const isFavorite = favorites.some((favorite) => favorite.id === calculator.id);
                          return <li id={calculatorAnchor(calculator)} key={calculator.id} className="scroll-mt-24 rounded-xl bg-[#F4F8F7] px-3 py-3 text-sm">
                            <div className="flex items-center justify-between gap-3">
                              <span>{calculator.title}</span>
                              <button type="button" aria-pressed={isFavorite} aria-label={`${isFavorite ? "Quitar de" : "Agregar a"} favoritas: ${calculator.title}`} onClick={() => setFavorites(toggleFavoriteCalculator(calculator))} className="shrink-0 rounded-lg px-3 py-2 font-bold text-[#16877F] hover:bg-white">
                                {isFavorite ? "★ Favorita" : "☆ Agregar"}
                              </button>
                            </div>
                            <CalculatorWidget calculatorId={calculator.id} onCalculated={() => setRecentCalculators(recordRecentCalculator(calculator))} />
                          </li>;
                        })}
                      </ul>
                    </section>
                  ))}
                  {visibleCalculatorGroups.length === 0 && <p role="status" className="text-sm text-slate-600">No hay calculadoras con ese nombre o especialidad.</p>}
                </div>
              )}
              {section.id === "paraclinicos" && (
                <div className="mt-5 space-y-5">
                  <section className="rounded-xl border border-[#DCE9E6] bg-[#F4F8F7] p-4">
                    <h3 className="font-bold text-[#123C50]">Biometría hemática · ejemplos en adultos</h3>
                    <p className="mt-1 text-sm text-slate-600">Intervalos publicados por Mayo Clinic Laboratories para su método. La edad, el embarazo, el método y la población pueden cambiar los límites.</p>
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                        <thead><tr className="border-b border-[#DCE9E6] text-[#123C50]"><th className="p-2">Parámetro</th><th className="p-2">Hombres adultos</th><th className="p-2">Mujeres adultas</th></tr></thead>
                        <tbody className="text-slate-700">
                          <tr className="border-b border-[#DCE9E6]"><th scope="row" className="p-2 font-semibold">Eritrocitos</th><td className="p-2">4.35–5.65 ×10¹²/L</td><td className="p-2">3.92–5.13 ×10¹²/L</td></tr>
                          <tr className="border-b border-[#DCE9E6]"><th scope="row" className="p-2 font-semibold">Hemoglobina</th><td className="p-2">13.2–16.6 g/dL</td><td className="p-2">11.6–15.0 g/dL</td></tr>
                          <tr className="border-b border-[#DCE9E6]"><th scope="row" className="p-2 font-semibold">Leucocitos</th><td className="p-2">3.4–9.6 ×10⁹/L</td><td className="p-2">3.4–9.6 ×10⁹/L</td></tr>
                          <tr><th scope="row" className="p-2 font-semibold">Plaquetas</th><td className="p-2">135–317 ×10⁹/L</td><td className="p-2">157–371 ×10⁹/L</td></tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-5 overflow-x-auto">
                      <h4 className="mb-2 font-bold text-[#123C50]">Química básica · ejemplos de referencia</h4>
                      <table className="w-full min-w-[540px] border-collapse text-left text-sm">
                        <thead><tr className="border-b border-[#DCE9E6] text-[#123C50]"><th className="p-2">Analito</th><th className="p-2">Intervalo publicado</th><th className="p-2">Población/nota</th></tr></thead>
                        <tbody className="text-slate-700">
                          <tr className="border-b border-[#DCE9E6]"><th scope="row" className="p-2 font-semibold">Sodio</th><td className="p-2">135–145 mmol/L</td><td className="p-2">≥1 año</td></tr>
                          <tr className="border-b border-[#DCE9E6]"><th scope="row" className="p-2 font-semibold">Potasio</th><td className="p-2">3.6–5.2 mmol/L</td><td className="p-2">≥1 año</td></tr>
                          <tr className="border-b border-[#DCE9E6]"><th scope="row" className="p-2 font-semibold">Cloro</th><td className="p-2">98–107 mmol/L</td><td className="p-2">≥18 años</td></tr>
                          <tr className="border-b border-[#DCE9E6]"><th scope="row" className="p-2 font-semibold">Bicarbonato</th><td className="p-2">22–29 mmol/L</td><td className="p-2">Adultos</td></tr>
                          <tr className="border-b border-[#DCE9E6]"><th scope="row" className="p-2 font-semibold">Nitrógeno ureico (BUN)</th><td className="p-2">H: 8–24 · M: 6–21 mg/dL</td><td className="p-2">≥18 años</td></tr>
                          <tr className="border-b border-[#DCE9E6]"><th scope="row" className="p-2 font-semibold">Creatinina</th><td className="p-2">H: 0.74–1.35 · M: 0.59–1.04 mg/dL</td><td className="p-2">H ≥15 · M ≥16 años</td></tr>
                          <tr><th scope="row" className="p-2 font-semibold">Glucosa</th><td className="p-2">70–140 mg/dL</td><td className="p-2">≥1 año; interpreta según ayuno/contexto</td></tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-slate-600">Usa primero el intervalo de referencia que acompaña el resultado del paciente; estos valores no son universales. Revisa edad, embarazo, sexo, ayuno, método y contexto clínico.</p>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-[#16877F]">
                      <a href="https://www.mayocliniclabs.com/test-catalog/overview/9109" target="_blank" rel="noreferrer" className="underline underline-offset-2">Biometría hemática ↗</a>
                      <a href="https://www.mayocliniclabs.com/test-catalog/overview/113630" target="_blank" rel="noreferrer" className="underline underline-offset-2">Química básica ↗</a>
                    </div>
                  </section>
                  <section className="rounded-xl border border-[#DCE9E6] bg-[#F4F8F7] p-4">
                    <h3 className="font-bold text-[#123C50]">Radiografía de tórax · revisión sistemática</h3>
                    <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
                      <li>Confirma identidad, fecha, proyección y posición; valora rotación, penetración, movimiento e inspiración.</li>
                      <li>Revisa dispositivos y su trayecto/posición, si existen.</li>
                      <li>Continúa por pared torácica y huesos, mediastino, silueta cardiaca e hilios.</li>
                      <li>Revisa ambos pulmones y vías aéreas; compara regiones y busca asimetrías u opacidades.</li>
                      <li>Evalúa pleuras, senos costofrénicos y diafragmas; vuelve a correlacionar con síntomas y estudios previos.</li>
                    </ol>
                    <p className="mt-3 text-xs leading-relaxed text-slate-600">Lista educativa: una radiografía puede ser normal pese a enfermedad y la técnica limita su sensibilidad. Integra el informe radiológico y la situación clínica.</p>
                    <a href="https://www.ncbi.nlm.nih.gov/books/NBK553874/" target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-[#16877F] underline underline-offset-2">Fuente: análisis sistemático de radiografía de tórax ↗</a>
                  </section>
                  <p className="text-xs text-slate-500">Esta sección es material de consulta; no carga ni almacena resultados de pacientes.</p>
                </div>
              )}
              {section.id === "escalas" && (
                <div className="mt-5 space-y-5">
                  <Phq2Widget />
                  <section className="rounded-xl border border-[#DCE9E6] bg-[#F4F8F7] p-4">
                    <h3 className="font-bold text-[#123C50]">PHQ-9 y GAD-7 · formularios oficiales</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">Consulta y descarga las versiones oficiales en español. Antes de aplicar, confirma que el instrumento y la versión lingüística correspondan a la población y protocolo local.</p>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-[#16877F]">
                      <a href="https://www.nih.gov/node/19946" target="_blank" rel="noreferrer" className="underline underline-offset-2">PHQ-9 en español · NIH ↗</a>
                      <a href="https://www.phqscreeners.com/" target="_blank" rel="noreferrer" className="underline underline-offset-2">PHQ/GAD Screeners ↗</a>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-slate-600">Un reactivo positivo de autolesión/suicidio en PHQ-9 requiere valoración clínica directa del riesgo y atención según el protocolo local.</p>
                  </section>
                  <section className="rounded-xl border border-[#DCE9E6] bg-[#F4F8F7] p-4">
                    <h3 className="font-bold text-[#123C50]">Somnolencia · Epworth (ESS)</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">La escala ESS tiene derechos de autor y requiere licencia de uso, incluso cuando no implique pago. No se incluyen sus reactivos aquí.</p>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-[#16877F]">
                      <a href="https://epworthsleepinessscale.com/licenses/" target="_blank" rel="noreferrer" className="underline underline-offset-2">Consultar licencia oficial ↗</a>
                      <a href="https://eprovide.mapi-trust.org/instruments/epworth-sleepiness-scale" target="_blank" rel="noreferrer" className="underline underline-offset-2">Solicitar uso mediante Mapi Research Trust ↗</a>
                    </div>
                  </section>
                </div>
              )}
            </div>
          </details>
        ))}
        {filteredSections.length === 0 && (
          <p role="status" className="rounded-xl bg-white p-5 text-slate-600">No se encontraron herramientas con ese término.</p>
        )}
      </section>
    </main>
  );
}
