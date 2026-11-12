"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createClient } from "../../../../lib/supabase/client";
import { readSessionProfessionalProfile } from "../../../../lib/professional-profile";
import { favoriteCalculatorsChangedEvent, readFavoriteCalculators, type FavoriteCalculator } from "../../../../lib/favorite-calculators";
import cie10Data from "../../../../data/cie10.json";

type Cie10Entry = {
  code: string;
  description: string;
};

type SelectedDiagnosis = Cie10Entry & {
  principal: boolean;
  chronic: boolean;
  manual?: boolean;
  manualCode?: string;
};

type ProfessionalDetails = {
  nombre: string;
  matricula: string;
  cedula: string;
  unidad: string;
};

type DetectedQr = { rawValue: string };
type QrDetector = { detect(source: HTMLVideoElement): Promise<DetectedQr[]> };
type QrDetectorConstructor = new (options: { formats: string[] }) => QrDetector;

type PatientTransfer = { nombre: string; fechaNacimiento: string; sexo: "femenino" | "masculino" | "otro" | "sin-especificar"; pesoKg: number | null; tallaCm: number | null; alergias: string; medicamentosActuales: string; enfermedadesCronicas: string; cirugias: string; antecedentesGinecoobstetricos: string };

const inputClassName =
  "mt-2 w-full rounded-xl border border-[#DCE9E6] bg-white px-4 py-3 text-[#123C50] outline-none transition placeholder:text-slate-400 focus:border-[#18A69A] focus:ring-2 focus:ring-[#18A69A]/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

const sectionClassName =
  "rounded-xl border border-[#A9CFF0] bg-white p-3 shadow-sm sm:p-4";

const defaultAntecedents = [
  "Antecedentes heredofamiliares: Interrogados y negados",
  "Antecedentes personales patológicos: Interrogados y negados",
  "Antecedentes personales no patológicos: Interrogados y negados",
  "Alergias: Interrogados y negados",
  "Medicamentos actuales: Interrogados y negados",
  "Antecedentes quirúrgicos: Interrogados y negados",
  "Toxicomanías: Interrogados y negados",
].join("\n");

const defaultGynecologic = [
  "Menarca: Interrogados y negados",
  "Ciclo menstrual (frecuencia, duración y características): Interrogados y negados",
  "Fecha de última menstruación (FUM): Interrogados y negados",
  "Inicio de vida sexual: Interrogados y negados",
  "Método anticonceptivo: Interrogados y negados",
  "Gestaciones (G): Interrogados y negados",
  "Partos (P): Interrogados y negados",
  "Cesáreas (C): Interrogados y negados",
  "Abortos (A): Interrogados y negados",
  "Complicaciones obstétricas: Interrogados y negados",
  "Antecedentes ginecológicos relevantes: Interrogados y negados",
].join("\n");

function buildPatientIndications(diagnoses: SelectedDiagnosis[]) {
  if (diagnoses.length === 0) return "";
  const diagnosisGuidance = diagnoses.map((diagnosis) =>
    `Para ${diagnosis.description}, sigue el plan acordado con tu médico y consulta antes de modificar tu tratamiento.`,
  );
  const generalGuidance = [
    "Usa los medicamentos únicamente como fueron prescritos; no los ajustes ni suspendas por cuenta propia.",
    "Acude a revisión en la fecha indicada y lleva tus estudios o registros relacionados con estos diagnósticos.",
    "Busca atención urgente ante un empeoramiento súbito, dificultad para respirar, pérdida del conocimiento o síntomas intensos.",
  ];
  return [...new Set([...diagnosisGuidance, ...generalGuidance])].join("\n");
}

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

function getLocalCie10Catalog(): readonly Cie10Entry[] {
  return cie10Data.records;
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-MX");
}

function Field({
  label,
  name,
  placeholder = "Sin información",
  type = "text",
  value,
  onChange,
}: {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-semibold text-[#123C50]">
      {label}
      <input className={inputClassName} name={name} type={type} placeholder={placeholder} value={value} onChange={onChange ? (event) => onChange(event.target.value) : undefined} />
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

export default function HojaClinica() {
  const [sexo, setSexo] = useState("");
  const [patientIdentity, setPatientIdentity] = useState("");
  const [measurements, setMeasurements] = useState<Record<string, string>>({
    presionSistolica: "",
    presionDiastolica: "",
    frecuenciaCardiaca: "",
    frecuenciaRespiratoria: "",
    temperatura: "",
    saturacionOxigeno: "",
    peso: "",
    talla: "",
  });
  const [antecedentsText, setAntecedentsText] = useState(defaultAntecedents);
  const [gynecologicText, setGynecologicText] = useState(defaultGynecologic);
  const [diagnosisQuery, setDiagnosisQuery] = useState("");
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<SelectedDiagnosis[]>([]);
  const [manualDiagnosisOpen, setManualDiagnosisOpen] = useState(false);
  const [manualDiagnosisCode, setManualDiagnosisCode] = useState("");
  const [manualDiagnosisDescription, setManualDiagnosisDescription] = useState("");
  const [exploracion, setExploracion] = useState(() => examTemplates.map((item) => `${item.title}: ${item.text}`).join("\n\n"));
  const formRef = useRef<HTMLFormElement | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [favoriteCalculators, setFavoriteCalculators] = useState<FavoriteCalculator[]>([]);
  const [finalized, setFinalized] = useState(false);
  const [correctionMode, setCorrectionMode] = useState(false);
  const [savedDraft, setSavedDraft] = useState<Record<string, FormDataEntryValue> | null>(null);
  const [recipeDraft, setRecipeDraft] = useState<Record<string, FormDataEntryValue> | null>(null);
  const [prognosis, setPrognosis] = useState("Reservado");
  const [indicationsOverride, setIndicationsOverride] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [professionalDetails, setProfessionalDetails] = useState<ProfessionalDetails>({ nombre: "", matricula: "", cedula: "", unidad: "" });
  const [professionalProfileStatus, setProfessionalProfileStatus] = useState(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? "Consultando perfil profesional…" : "Supabase no está configurado; puedes completar estos datos manualmente.");
  const [qrStatus, setQrStatus] = useState("");
  const [qrScanning, setQrScanning] = useState(false);
  const [medicationQuery, setMedicationQuery] = useState("");
  const [selectedMedication, setSelectedMedication] = useState("");
  const [medicationFields, setMedicationFields] = useState({ presentacion: "", dosis: "", via: "", frecuencia: "", duracion: "", cantidad: "", repeticiones: "" });
  const qrVideoRef = useRef<HTMLVideoElement | null>(null);
  const qrStreamRef = useRef<MediaStream | null>(null);
  const qrFrameRef = useRef<number | null>(null);
  const diagnosisSearchField = useRef<HTMLInputElement | null>(null);
  const diagnosticsSection = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const syncFavorites = () => setFavoriteCalculators(readFavoriteCalculators());
    syncFavorites();
    window.addEventListener(favoriteCalculatorsChangedEvent, syncFavorites);
    window.addEventListener("storage", syncFavorites);
    return () => {
      window.removeEventListener(favoriteCalculatorsChangedEvent, syncFavorites);
      window.removeEventListener("storage", syncFavorites);
    };
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const sessionProfile = readSessionProfessionalProfile();
      if (!sessionProfile) return;
      setProfessionalDetails((current) => ({
        nombre: current.nombre || sessionProfile.nombre,
        matricula: current.matricula || sessionProfile.matricula,
        cedula: current.cedula || sessionProfile.cedula,
        unidad: current.unidad || sessionProfile.unidad,
      }));
      setProfessionalProfileStatus("Se cargó el perfil guardado en esta sesión; puedes ajustar los datos para esta consulta.");
    });
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return;

    const client = createClient();
    void client.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (error || !data.user) {
        setProfessionalProfileStatus("No hay una sesión profesional activa; captura los datos manualmente.");
        return;
      }

      const metadata = data.user.user_metadata ?? {};
      const readText = (...keys: string[]) => {
        for (const key of keys) {
          const value = metadata[key];
          if (typeof value === "string" && value.trim()) return value.trim();
        }
        return "";
      };
      const details = {
        nombre: readText("nombre_completo", "nombreCompleto", "full_name", "name"),
        matricula: readText("matricula", "professional_id", "registration_number"),
        cedula: readText("cedula_profesional", "cedulaProfesional", "professional_license"),
        unidad: readText("unidad_medica", "unidadMedica", "medical_unit"),
      };
      setProfessionalDetails((current) => ({ nombre: current.nombre || details.nombre, matricula: current.matricula || details.matricula, cedula: current.cedula || details.cedula, unidad: current.unidad || details.unidad }));
      setProfessionalProfileStatus(Object.values(details).some(Boolean)
        ? "Se cargaron los datos disponibles del perfil. Completa cualquier dato faltante."
        : "El perfil autenticado no contiene datos profesionales; puedes capturarlos manualmente.");
    }).catch(() => {
      if (active) setProfessionalProfileStatus("No se pudo consultar el perfil; puedes completar los datos manualmente.");
    });

    return () => { active = false; };
  }, []);

  useEffect(() => () => {
    qrStreamRef.current?.getTracks().forEach((track) => track.stop());
    if (qrFrameRef.current !== null) cancelAnimationFrame(qrFrameRef.current);
  }, []);

  const cie10Catalog = getLocalCie10Catalog();
  const normalizedDiagnosisQuery = normalizeSearchText(diagnosisQuery.trim());
  const diagnosisResults = !normalizedDiagnosisQuery
    ? null
    : cie10Catalog.filter((entry) =>
        normalizeSearchText(entry.code).includes(normalizedDiagnosisQuery) ||
        normalizeSearchText(entry.description).includes(normalizedDiagnosisQuery),
      );
  const diagnosisResultLimit = 20;
  const diagnosisResultCount = diagnosisResults?.length ?? 0;
  const visibleDiagnosisResults = diagnosisResults?.slice(0, diagnosisResultLimit) ?? null;
  const principalCount = selectedDiagnoses.filter((diagnosis) => diagnosis.principal).length;
  const canContinue = principalCount === 1;
  const weight = measurements.peso === "" ? Number.NaN : Number(measurements.peso);
  const heightInMeters = measurements.talla === "" ? Number.NaN : Number(measurements.talla) / 100;
  const bmi = Number.isFinite(weight) && weight > 0 && Number.isFinite(heightInMeters) && heightInMeters > 0
    ? (weight / (heightInMeters * heightInMeters)).toFixed(1)
    : "";
  const generatedIndications = buildPatientIndications(selectedDiagnoses);

  const measurementField = (label: string, name: string, unit: string, value = measurements[name], readOnly = false) => (
    <label key={name} className="block text-sm font-semibold text-[#123C50]">
      {label}
      <span className="mt-2 flex items-center gap-2">
      <input
          className={inputClassName + " mt-0 min-w-0 flex-1 px-2 py-1.5 text-sm"}
          name={name}
          type="number"
          inputMode="decimal"
          min="0"
          step="any"
          value={value}
          readOnly={readOnly}
          onChange={readOnly ? undefined : (event) => {
            const nextValue = event.target.value;
            if (nextValue !== "" && Number(nextValue) < 0) return;
            setMeasurements((current) => ({ ...current, [name]: nextValue }));
          }}
          aria-label={`${label}, ${unit}`}
        />
        <span className="shrink-0 whitespace-nowrap text-[11px] font-medium text-slate-500">{unit}</span>
      </span>
    </label>
  );

  const addDiagnosis = (entry: Cie10Entry) => {
    setSelectedDiagnoses((current) => {
      if (current.some((diagnosis) => diagnosis.code === entry.code)) return current;
      return [...current, { ...entry, principal: false, chronic: false }];
    });
  };

  const addManualDiagnosis = () => {
    const description = manualDiagnosisDescription.trim();
    if (!description) return;
    setSelectedDiagnoses((current) => [
      ...current,
      {
        code: `MANUAL-${Date.now()}`,
        description,
        manual: true,
        manualCode: manualDiagnosisCode.trim(),
        principal: false,
        chronic: false,
      },
    ]);
    setManualDiagnosisOpen(false);
    setManualDiagnosisCode("");
    setManualDiagnosisDescription("");
    setDiagnosisQuery("");
  };

  const setPrincipalDiagnosis = (code: string) => {
    setSelectedDiagnoses((current) =>
      current.map((diagnosis) => ({
        ...diagnosis,
        principal: diagnosis.code === code,
      })),
    );
  };

  const toggleChronicDiagnosis = (code: string) => {
    setSelectedDiagnoses((current) =>
      current.map((diagnosis) =>
        diagnosis.code === code
          ? { ...diagnosis, chronic: !diagnosis.chronic }
          : diagnosis,
      ),
    );
  };

  const removeDiagnosis = (code: string) => {
    setSelectedDiagnoses((current) =>
      current.filter((diagnosis) => diagnosis.code !== code),
    );
  };

  const collectFormData = () => formRef.current ? Object.fromEntries(new FormData(formRef.current).entries()) : {};

  const saveInSession = () => {
    setSavedDraft(collectFormData());
    setSaveMessage("Borrador guardado solo en esta sesión. No se envió a un expediente permanente.");
  };

  const finishConsultation = () => {
    setSavedDraft(collectFormData());
    setFinalized(true);
    setCorrectionMode(false);
  };

  const stopQrReader = () => {
    if (qrFrameRef.current !== null) cancelAnimationFrame(qrFrameRef.current);
    qrFrameRef.current = null;
    qrStreamRef.current?.getTracks().forEach((track) => track.stop());
    qrStreamRef.current = null;
    if (qrVideoRef.current) qrVideoRef.current.srcObject = null;
    setQrScanning(false);
  };

  const applyMeasurementQr = async (raw: string) => {
    const code = raw.trim();
    if (!/^ESD1\.[A-Za-z0-9_-]{43}$/.test(code)) {
      setQrStatus("El contenido no es un código temporal válido. Genera uno desde el portal de pacientes.");
      return;
    }
    setQrStatus("Consultando código temporal…");
    try {
      const response = await fetch("/api/temporary-transfers/consume", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      const result = await response.json() as { data?: PatientTransfer; error?: string };
      if (!response.ok || !result.data) throw new Error(result.error ?? "No se pudo consultar el código.");
      const data = result.data;
      const born = new Date(data.fechaNacimiento + "T00:00:00");
      const today = new Date();
      let age = today.getFullYear() - born.getFullYear();
      if (today.getMonth() < born.getMonth() || (today.getMonth() === born.getMonth() && today.getDate() < born.getDate())) age -= 1;
      const sexLabel: Record<PatientTransfer["sexo"], string> = { femenino: "Femenino", masculino: "Masculino", otro: "Otro", "sin-especificar": "Sin especificar" };
      setPatientIdentity([
        `Nombre: ${data.nombre}`,
        `Fecha de nacimiento: ${data.fechaNacimiento}`,
        `Edad: ${age} años`,
        `Sexo: ${sexLabel[data.sexo]}`,
      ].join(", "));
      setSexo(data.sexo);
      setMeasurements((current) => ({ ...current, ...(data.pesoKg !== null ? { peso: String(data.pesoKg) } : {}), ...(data.tallaCm !== null ? { talla: String(data.tallaCm) } : {}) }));
      const defaultValue = "Interrogados y negados";
      setAntecedentsText([
        `Antecedentes heredofamiliares: ${defaultValue}`,
        `Antecedentes personales patológicos: ${data.enfermedadesCronicas || defaultValue}`,
        `Antecedentes personales no patológicos: ${defaultValue}`,
        `Alergias: ${data.alergias || defaultValue}`,
        `Medicamentos actuales: ${data.medicamentosActuales || defaultValue}`,
        `Antecedentes quirúrgicos: ${data.cirugias || defaultValue}`,
        `Toxicomanías: ${defaultValue}`,
      ].join("\n"));
      setGynecologicText(data.antecedentesGinecoobstetricos || defaultGynecologic);
      setQrStatus("Datos recibidos. El código ya se consumió; revisa y confirma la información con el paciente.");
      stopQrReader();
    } catch (error) {
      setQrStatus(error instanceof Error ? error.message : "No se pudo leer el código temporal.");
      stopQrReader();
    }
  };

  const startQrReader = async () => {
    const Detector = (window as Window & { BarcodeDetector?: QrDetectorConstructor }).BarcodeDetector;
    if (!Detector) {
      setQrStatus("Este navegador no incluye lector QR por cámara. Abre esta consulta en un navegador compatible para leer el QR.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !qrVideoRef.current) {
      setQrStatus("No se puede acceder a la cámara en este contexto. Revisa el permiso de cámara del navegador.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      qrStreamRef.current = stream;
      qrVideoRef.current.srcObject = stream;
      await qrVideoRef.current.play();
      const detector = new Detector({ formats: ["qr_code"] });
      setQrScanning(true);
      setQrStatus("Apunta la cámara al QR temporal. El código se consumirá al leerlo.");

      const scan = async () => {
        const video = qrVideoRef.current;
        if (!qrStreamRef.current || !video) return;
        try {
          const detected = await detector.detect(video);
          if (detected.length) {
            void applyMeasurementQr(detected[0].rawValue);
            return;
          }
          qrFrameRef.current = requestAnimationFrame(() => { void scan(); });
        } catch {
          stopQrReader();
          setQrStatus("No se pudo leer el QR. Intenta de nuevo con el código visible y enfocado.");
        }
      };
      qrFrameRef.current = requestAnimationFrame(() => { void scan(); });
    } catch {
      stopQrReader();
      setQrStatus("No se pudo abrir la cámara. Revisa el permiso de cámara del navegador.");
    }
  };

  const continueFromDiagnostics = () => {
    if (!canContinue) return;
    diagnosticsSection.current?.nextElementSibling?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <main className="min-h-screen bg-[#F4F8F7] text-[#123C50]">
      <header className="border-b border-[#DCE9E6] bg-white px-5 py-5 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/"
              className="font-bold text-[#18A69A] transition hover:text-[#123C50]"
            >
              ← Volver al inicio
            </Link>
            <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">Hoja de Consulta</h1>
            <p className="mt-1 text-sm text-slate-500">
              Consulta Médica · La captura se mantiene en esta sesión; no se crea un expediente permanente.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2" aria-label="Acciones rápidas de consulta">
            <button type="button" onClick={() => { document.getElementById("qr-lectura")?.scrollIntoView({ behavior: "smooth", block: "center" }); if (qrScanning) stopQrReader(); else void startQrReader(); }} className="rounded-xl border border-[#2456C7] bg-white px-4 py-2 text-sm font-bold text-[#123C50] hover:bg-[#EEF5FF]">{qrScanning ? "Detener lectura QR" : "▦ Leer código QR"}</button>
            <button type="button" onClick={() => { document.getElementById("datos-paciente")?.scrollIntoView({ behavior: "smooth", block: "start" }); requestAnimationFrame(() => formRef.current?.querySelector<HTMLTextAreaElement>("[name=identificacionPaciente]")?.focus()); }} className="rounded-xl border border-[#A9CFF0] bg-white px-4 py-2 text-sm font-bold text-[#123C50] hover:bg-[#EEF5FF]">✎ Captura manual</button>
            <button type="button" aria-expanded={sidebarOpen} aria-controls="clinical-sidebar" onClick={() => setSidebarOpen((open) => !open)} className="rounded-xl border border-[#A9CFF0] px-4 py-2 text-sm font-bold text-[#123C50] hover:bg-[#EEF5FF]">
              {sidebarOpen ? "Cerrar menú" : "Herramientas y biblioteca"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-5 sm:py-6">
        <form ref={formRef} className="rounded-2xl border border-[#A9CFF0] bg-white p-3 shadow-sm sm:p-4" onSubmit={(event) => { event.preventDefault(); saveInSession(); }}>
        <div className="space-y-3">
        <fieldset disabled={finalized && !correctionMode} className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-12">
        <section id="datos-paciente" className={sectionClassName + " lg:col-span-12"}>
          <SectionHeading number="01" note="Captura los datos manualmente o impórtalos mediante el QR temporal del paciente.">
            Identificación del paciente
          </SectionHeading>
          <label className="block text-sm font-semibold text-[#123C50]" htmlFor="identificacionPaciente">
            Identificación del paciente
            <textarea id="identificacionPaciente" className={inputClassName + " resize-y"} name="identificacionPaciente" rows={2} value={patientIdentity} onChange={(event) => {
              const value = event.target.value;
              setPatientIdentity(value);
              const normalized = normalizeSearchText(value);
              const sexMatch = normalized.match(/sexo\s*[:,]\s*(femenino|masculino|otro|sin especificar)/);
              if (sexMatch) setSexo(sexMatch[1] === "sin especificar" ? "sin-especificar" : sexMatch[1]);
              else if (/\bmasculino\b/.test(normalized)) setSexo("masculino");
              else if (/\bfemenino\b/.test(normalized)) setSexo("femenino");
              else setSexo("");
            }} placeholder="Nombre, edad, NSS, sexo u otro dato de identificación" />
            <input type="hidden" name="sexo" value={sexo} />
          </label>
          <div id="qr-lectura" className="mt-3" aria-live="polite">
            <video ref={qrVideoRef} autoPlay playsInline muted className={"max-h-48 w-full rounded-lg bg-black object-contain " + (qrScanning ? "block" : "hidden")} aria-label="Vista de la cámara para leer el QR temporal" />
            {qrStatus && <p className="mt-2 text-sm text-slate-600" role="status">{qrStatus}</p>}
          </div>
          <p className="mt-3 rounded-xl bg-[#F4F8FD] p-3 text-sm text-slate-600">
            Al leer el QR autorizado, los datos compartidos llenan identificación, antecedentes y peso/talla cuando estén incluidos. Puedes editar la información antes de continuar.
          </p>
        </section>

        <section id="signos-vitales" className={sectionClassName + " lg:col-span-12"}>
          <SectionHeading number="SV" note="El paciente puede compartir peso y talla con su QR temporal. El IMC se calcula con valores válidos.">
            Signos vitales y somatometría
          </SectionHeading>
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 font-bold text-[#123C50]">Signos vitales</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
                {measurementField("Presión arterial sistólica", "presionSistolica", "mmHg")}
                {measurementField("Presión arterial diastólica", "presionDiastolica", "mmHg")}
                {measurementField("Frecuencia cardiaca", "frecuenciaCardiaca", "latidos/min")}
                {measurementField("Frecuencia respiratoria", "frecuenciaRespiratoria", "respiraciones/min")}
                {measurementField("Temperatura", "temperatura", "°C")}
                {measurementField("Saturación de oxígeno", "saturacionOxigeno", "%")}
              </div>
            </div>
            <div>
              <h3 className="mb-3 font-bold text-[#123C50]">Somatometría</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
                {measurementField("Peso", "peso", "kg")}
                {measurementField("Talla", "talla", "cm")}
                {measurementField("Índice de masa corporal (IMC)", "imc", "kg/m²", bmi, true)}
              </div>
            </div>
          </div>
        </section>

        <section id="antecedentes" className={sectionClassName + " lg:col-span-6"}>
          <SectionHeading number="03" note="Un campo editable, con antecedentes generales y ginecoobstétricos organizados por renglón. El QR puede completar los datos que el paciente autorizó compartir.">
            Antecedentes
          </SectionHeading>
          <label htmlFor="antecedentes-unificados" className="block text-sm font-semibold text-[#123C50]">
            Antecedentes generales y ginecoobstétricos
            <textarea id="antecedentes-unificados" className={inputClassName + " resize-y"} name="antecedentes" rows={14} value={antecedentsText} onChange={(event) => setAntecedentsText(event.target.value)} />
          </label>
          <p className="mt-2 text-xs text-slate-500">Revisa y edita cada rubro con el paciente antes de finalizar la nota.</p>
        </section>

        <section id="antecedentes-gineco" className={sectionClassName + " lg:col-span-6"}>
          <SectionHeading number="03B" note="Se completa con el QR autorizado o se captura manualmente; se desactiva al identificar sexo masculino.">
            Antecedentes ginecoobstétricos
          </SectionHeading>
          <label htmlFor="antecedentes-gineco-unificados" className="block text-sm font-semibold text-[#123C50]">
            Información ginecoobstétrica
            <textarea id="antecedentes-gineco-unificados" className={inputClassName + " resize-y"} name="antecedentesGinecoobstetricos" rows={9} value={gynecologicText} onChange={(event) => setGynecologicText(event.target.value)} disabled={sexo === "masculino"} />
          </label>
          {sexo === "masculino" && <p className="mt-2 text-xs text-slate-500">Desactivado para pacientes identificados como hombres.</p>}
        </section>

        <section id="motivo-consulta" className={sectionClassName + " lg:col-span-6"}>
          <SectionHeading number="04" note="Captura manual del motivo y su evolución en una sola narración clínica.">Motivo de consulta y padecimiento actual</SectionHeading>
          <TextField label="Motivo de consulta y padecimiento actual" name="motivoPadecimientoActual" rows={6} placeholder="Escribe el motivo de consulta, inicio, evolución, síntomas asociados y datos relevantes." />
        </section>

        <section id="paraclinicos" className={sectionClassName + " lg:col-span-6"}>
          <SectionHeading number="05A" note="Registra estudios revisados durante esta consulta; no se almacenan como expediente.">
            Estudios paraclínicos
          </SectionHeading>
          <TextField label="Estudio, fecha, resultado e interpretación clínica" name="paraclinicos" rows={5} placeholder="Un estudio por renglón. Si no hay estudios, deja el campo vacío." />
        </section>

        <section id="exploracion-fisica" className={sectionClassName + " lg:col-span-12"}>
          <SectionHeading number="05" note="Campo único editable. La plantilla normal queda precargada y puedes modificar cualquier hallazgo.">Exploración física</SectionHeading>
          <label htmlFor="exploracion-completa" className="block text-sm font-semibold text-[#123C50]">Exploración por aparatos y sistemas
            <textarea id="exploracion-completa" name="exploracionFisica" rows={10} value={exploracion} onChange={(event) => setExploracion(event.target.value)} className={inputClassName + " resize-y"} />
          </label>
        </section>

        <section id="diagnosticos" ref={diagnosticsSection} className={sectionClassName + " lg:col-span-6 lg:order-1"}>
          <SectionHeading
            number="06"
            note="Busca en un catálogo CIE-10 verificable y selecciona los diagnósticos de esta consulta."
          >
            Diagnósticos
          </SectionHeading>
          <div className="space-y-6">
              <div>
                <label
                  htmlFor="cie10-search"
                  className="block text-sm font-semibold text-[#123C50]"
                >
                  Buscar por código CIE-10 o nombre
                  <input
                    ref={diagnosisSearchField}
                    id="cie10-search"
                    name="cie10-search"
                    type="search"
                    value={diagnosisQuery}
                    onChange={(event) => setDiagnosisQuery(event.target.value)}
                    placeholder="Escribe un código o nombre"
                    className={inputClassName}
                    aria-describedby="cie10-catalog-status"
                  />
                </label>
                <p
                  id="cie10-catalog-status"
                  role="status"
                  className="mt-3 rounded-xl border border-[#B8D2CE] bg-[#E9F4F2] p-4 text-sm text-[#123C50]"
                >
                  Catálogo local de {cie10Data.metadata.institution}, revisión {cie10Data.metadata.catalogReviewDate}. Se buscará en sus {cie10Data.metadata.recordCount.toLocaleString("es-MX")} registros válidos sin conexión.
                </p>
              </div>

              {!normalizedDiagnosisQuery && (
                <p className="text-sm text-slate-500">
                  Escribe un código o nombre para iniciar la búsqueda.
                </p>
              )}
              {normalizedDiagnosisQuery &&
                diagnosisResults?.length === 0 && (
                  <div className="rounded-xl bg-[#F4F8F7] p-4" role="status">
                    <p className="text-sm text-slate-600">No se encontraron coincidencias en el catálogo CIE-10 local.</p>
                    {manualDiagnosisOpen && <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label className="block text-sm font-semibold text-[#123C50]">Código CIE-10 (opcional)
                        <input value={manualDiagnosisCode} onChange={(event) => setManualDiagnosisCode(event.target.value)} className={inputClassName} placeholder="Código, si lo conoces" />
                      </label>
                      <label className="block text-sm font-semibold text-[#123C50]">Descripción del diagnóstico
                        <input value={manualDiagnosisDescription} onChange={(event) => setManualDiagnosisDescription(event.target.value)} className={inputClassName} placeholder="Escribe el diagnóstico" />
                      </label>
                    </div>}
                    <button type="button" disabled={manualDiagnosisOpen && !manualDiagnosisDescription.trim()} onClick={() => {
                      if (manualDiagnosisOpen) addManualDiagnosis();
                      else { setManualDiagnosisDescription(diagnosisQuery.trim()); setManualDiagnosisOpen(true); }
                    }} className="mt-3 rounded-lg border border-[#18A69A] px-4 py-2 text-sm font-bold text-[#123C50] disabled:cursor-not-allowed disabled:opacity-50">
                      {manualDiagnosisOpen ? "Agregar diagnóstico manual" : "Agregar diagnóstico de forma manual"}
                    </button>
                  </div>
                )}
              {visibleDiagnosisResults && diagnosisResultCount > 0 && (
                <div className="space-y-3" aria-label="Resultados CIE-10">
                  <p className="text-sm text-slate-500" role="status">
                    {diagnosisResultCount > diagnosisResultLimit
                      ? `Mostrando ${diagnosisResultLimit} de ${diagnosisResultCount} coincidencias. Refina la búsqueda para ver resultados más específicos.`
                      : `${diagnosisResultCount} coincidencias.`}
                  </p>
                  {visibleDiagnosisResults.map((entry) => {
                    const alreadySelected = selectedDiagnoses.some(
                      (diagnosis) => diagnosis.code === entry.code,
                    );
                    return (
                      <div
                        key={entry.code}
                        className="flex flex-col gap-3 rounded-xl border border-[#DCE9E6] p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <p className="text-sm text-[#123C50]">
                          <span className="font-bold">{entry.code}</span>
                          <span className="mx-2 text-slate-400">·</span>
                          {entry.description}
                        </p>
                        <button
                          type="button"
                          disabled={alreadySelected}
                          onClick={() => addDiagnosis(entry)}
                          className="shrink-0 rounded-lg border border-[#18A69A] px-4 py-2 text-sm font-bold text-[#123C50] transition hover:bg-[#E9F4F2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#18A69A] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {alreadySelected ? "Agregado" : "Agregar"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div>
                <h3 className="font-bold text-[#123C50]">Diagnósticos seleccionados</h3>
                {selectedDiagnoses.length === 0 ? (
                  <p className="mt-2 rounded-xl border border-dashed border-[#B8D2CE] bg-[#F8FBFA] p-4 text-sm text-slate-500">
                    Aún no hay diagnósticos seleccionados.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {selectedDiagnoses.map((diagnosis) => (
                      <li
                        key={diagnosis.code}
                        className="rounded-xl border border-[#DCE9E6] p-4"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <p className="font-semibold text-[#123C50]">
                            <span className="font-extrabold">{diagnosis.manual ? `Manual${diagnosis.manualCode ? ` · ${diagnosis.manualCode}` : ""}` : diagnosis.code}</span>
                            <span className="mx-2 text-slate-400">·</span>
                            {diagnosis.description}
                            <span
                              className={
                                "ml-2 inline-flex rounded-full px-3 py-1 text-xs font-bold " +
                                (diagnosis.principal
                                  ? "bg-[#E9F4F2] text-[#123C50]"
                                  : "bg-slate-100 text-slate-600")
                              }
                            >
                              {diagnosis.principal ? "Principal" : "Secundario"}
                            </span>
                          </p>
                          <button
                            type="button"
                            onClick={() => removeDiagnosis(diagnosis.code)}
                            className="self-start rounded-lg px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500"
                          >
                            Retirar
                          </button>
                        </div>
                        <div className="mt-4 flex flex-col gap-3 border-t border-[#DCE9E6] pt-4 sm:flex-row sm:items-center sm:gap-6">
                          <label className="flex items-center gap-2 text-sm font-semibold text-[#123C50]">
                            <input
                              type="radio"
                              name="diagnostico-principal"
                              checked={diagnosis.principal}
                              onChange={() => setPrincipalDiagnosis(diagnosis.code)}
                              className="h-4 w-4 accent-[#18A69A]"
                            />
                            Marcar como principal
                          </label>
                          <label className="flex items-center gap-2 text-sm text-[#123C50]">
                            <input
                              type="checkbox"
                              checked={diagnosis.chronic}
                              onChange={() => toggleChronicDiagnosis(diagnosis.code)}
                              className="h-4 w-4 accent-[#18A69A]"
                            />
                            Marcar como crónico
                          </label>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-xl border border-[#DCE9E6] bg-[#F8FBFA] p-4">
                <h3 className="font-bold text-[#123C50]">Antecedentes crónicos existentes</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Los antecedentes crónicos preexistentes, si los hubiera, permanecen protegidos y no se modifican desde este módulo.
                </p>
              </div>

              <p
                role="status"
                className="rounded-xl bg-[#F4F8F7] p-4 text-sm text-slate-600"
              >
                {canContinue
                  ? "Hay exactamente un diagnóstico principal; la selección cumple el requisito para continuar."
                  : "Para continuar, selecciona exactamente un diagnóstico principal."}
              </p>
              <button
                type="button"
                disabled={!canContinue}
                onClick={continueFromDiagnostics}
                className="rounded-xl bg-[#123C50] px-6 py-3 font-bold text-white transition hover:bg-[#18A69A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#18A69A] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#123C50]"
              >
                Continuar
              </button>
                </div>
        </section>

        <section id="tratamiento-farmacologico" className={sectionClassName + " lg:col-span-6 lg:order-2"}>
          <SectionHeading number="07" note="Busca una opción del listado institucional IMSS; revisa y ajusta la pauta según el paciente antes de generar la receta.">Tratamiento farmacológico</SectionHeading>
          <label htmlFor="buscar-medicamento" className="block text-sm font-semibold text-[#123C50]">Buscar medicamento (Listado Institucional IMSS)
            <input id="buscar-medicamento" type="search" value={medicationQuery} onChange={(event) => setMedicationQuery(event.target.value)} className={inputClassName} placeholder="Escribe el nombre o clave del medicamento" />
          </label>
          {medicationQuery.trim() && <div className="mt-2 rounded-lg border border-[#DCE9E6] bg-white" role="listbox" aria-label="Medicamentos disponibles">
            {[{ code: "010.000.2501.00", name: "Enalapril 10 mg", presentation: "Cápsula o tableta de 10 mg; envase con 30", dose: "HTA en adultos — inicial: 10 mg al día. Dosis habitual: 10 a 40 mg al día; ajustar de acuerdo con la respuesta.", route: "Oral", frequency: "Una vez al día al inicio; ajustar de acuerdo con la respuesta.", source: "https://www.imss.gob.mx/sites/all/statics/pdf/cuadros-basicos/Grupo-N3-Cardiologia-R.pdf" }].filter((item) => normalizeSearchText(item.name + " " + item.code).includes(normalizeSearchText(medicationQuery.trim()))).map((item) => <button key={item.code} type="button" role="option" aria-selected={selectedMedication === item.name} onClick={() => { setSelectedMedication(item.name); setMedicationFields({ presentacion: item.presentation, dosis: item.dose, via: item.route, frecuencia: item.frequency, duracion: "", cantidad: "", repeticiones: "" }); setMedicationQuery(item.name); }} className="block w-full border-b border-[#DCE9E6] px-4 py-3 text-left text-sm hover:bg-[#F4F8FD]"><strong>{item.name}</strong><span className="ml-2 text-slate-500">Clave {item.code}</span></button>)}
            {!normalizeSearchText("Enalapril 10 mg 010.000.2501.00").includes(normalizeSearchText(medicationQuery.trim())) && <p className="p-3 text-sm text-slate-600">No se encontró en las fichas integradas. El catálogo oficial completo está pendiente de estructurarse.</p>}
          </div>}
          {selectedMedication && <div className="mt-4 space-y-3 rounded-lg border border-[#DCE9E6] bg-[#F8FBFA] p-3">
            <p className="text-sm font-bold text-[#123C50]">{selectedMedication}</p>
            <input type="hidden" name="medicamento" value={selectedMedication} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Presentación" name="presentacion" value={medicationFields.presentacion} onChange={(value) => setMedicationFields((current) => ({ ...current, presentacion: value }))} />
              <Field label="Dosis / posología (editable)" name="dosis" value={medicationFields.dosis} onChange={(value) => setMedicationFields((current) => ({ ...current, dosis: value }))} />
              <Field label="Vía" name="viaAdministracion" value={medicationFields.via} onChange={(value) => setMedicationFields((current) => ({ ...current, via: value }))} />
              <Field label="Frecuencia" name="frecuencia" value={medicationFields.frecuencia} onChange={(value) => setMedicationFields((current) => ({ ...current, frecuencia: value }))} />
              <Field label="Duración" name="duracion" placeholder="Definir por el médico" value={medicationFields.duracion} onChange={(value) => setMedicationFields((current) => ({ ...current, duracion: value }))} />
              <Field label="Cantidad a dispensar" name="cantidad" placeholder="Definir por el médico" value={medicationFields.cantidad} onChange={(value) => setMedicationFields((current) => ({ ...current, cantidad: value }))} />
              <Field label="Repeticiones" name="repeticiones" placeholder="0 si no aplica" value={medicationFields.repeticiones} onChange={(value) => setMedicationFields((current) => ({ ...current, repeticiones: value }))} />
            </div>
            <p className="text-xs text-slate-600">Referencia de dosis del listado del IMSS; valida indicación, contraindicaciones y pauta individual. <a href="https://www.imss.gob.mx/sites/all/statics/pdf/cuadros-basicos/Grupo-N3-Cardiologia-R.pdf" target="_blank" rel="noreferrer" className="underline">Ver ficha oficial ↗</a></p>
          </div>}
          {recipeDraft && <div className="mt-6 rounded-xl border border-[#DCE9E6] bg-[#F8FBFA] p-5" aria-live="polite"><h3 className="font-bold">Receta preparada para esta sesión</h3><p className="mt-2">{String(recipeDraft.medicamento || "Sin medicamento")} · {String(recipeDraft.dosis || "Sin dosis")} · {String(recipeDraft.viaAdministracion || "Sin vía")} · {String(recipeDraft.frecuencia || "Sin frecuencia")} · {String(recipeDraft.duracion || "Sin duración")}</p><p className="mt-2 text-sm text-slate-600">Usa Imprimir para obtenerla.</p></div>}
        </section>

        <section id="indicaciones" className={sectionClassName + " lg:col-span-6 lg:order-3"}>
          <SectionHeading number="08" note="Las indicaciones se preparan según los diagnósticos seleccionados, sin repetir avisos generales, y se pueden editar.">Indicaciones</SectionHeading>
          <label htmlFor="indicaciones-paciente" className="block text-sm font-semibold text-[#123C50]">Indicaciones para el paciente
            <textarea id="indicaciones-paciente" name="indicaciones" rows={7} value={indicationsOverride ?? generatedIndications} onChange={(event) => setIndicationsOverride(event.target.value)} placeholder="Al seleccionar diagnósticos, aparecerán aquí indicaciones generales para el paciente." className={inputClassName + " resize-y"} />
          </label>
          {indicationsOverride !== null && <button type="button" onClick={() => setIndicationsOverride(null)} className="mt-2 text-xs font-semibold text-[#16877F] underline">Restablecer indicaciones sugeridas para los diagnósticos</button>}
          <div className="mt-5"><TextField label="Seguimiento y fecha sugerida" name="seguimiento" rows={2} /></div>
        </section>

        <section id="pronostico" className={sectionClassName + " lg:col-span-6 lg:order-4"}>
          <SectionHeading number="09" note="Reservado aparece seleccionado por defecto y puede cambiarse.">Pronóstico</SectionHeading>
          <label className="block max-w-md text-sm font-semibold text-[#123C50]">Pronóstico<select className={inputClassName} name="pronostico" value={prognosis} onChange={(event) => setPrognosis(event.target.value)}>{["Bueno", "Favorable", "Reservado", "Desfavorable", "Malo"].map((option) => <option key={option}>{option}</option>)}</select></label>
        </section>

        <section id="datos-medico" className={sectionClassName + " lg:col-span-12 lg:order-6"}>
          <SectionHeading number="10" note="Se cargan los datos profesionales disponibles en el perfil autenticado; los campos siguen editables.">Datos del médico</SectionHeading>
          <p className="mb-4 text-sm text-slate-600" role="status">{professionalProfileStatus}</p>
          <div className="grid gap-5 sm:grid-cols-2">
            {([ ["nombre", "Nombre completo", "medicoNombre"], ["matricula", "Matrícula", "medicoMatricula"], ["cedula", "Cédula profesional", "medicoCedula"], ["unidad", "Unidad médica", "unidadMedica"] ] as const).map(([key, label, name]) => <label key={key} className="block text-sm font-semibold text-[#123C50]">{label}<input className={inputClassName} name={name} value={professionalDetails[key]} onChange={(event) => setProfessionalDetails((current) => ({ ...current, [key]: event.target.value }))} placeholder="Dato del perfil profesional" /></label>)}
          </div>
        </section>

        <section id="cierre-consulta" className={sectionClassName + " lg:col-span-12 lg:order-7"}>
          <SectionHeading number="11" note="La consulta finalizada queda bloqueada y no se guarda en un expediente permanente.">Cierre de consulta</SectionHeading>
          <p className="rounded-xl bg-[#F4F8F7] p-4 text-sm text-slate-600">{finalized ? "Consulta finalizada y bloqueada para edición." : "Revisa los datos antes de finalizar."}</p>
          {savedDraft && <div className="mt-5 rounded-xl border border-[#DCE9E6] bg-white p-5" aria-live="polite"><h3 className="text-lg font-bold">Nota médica de esta sesión</h3><div className="mt-3 space-y-2">{Object.entries(savedDraft).filter(([key, value]) => key !== "diagnostico-principal" && String(value).trim() !== "").map(([key, value]) => <p key={key}><strong>{key.replace(/([A-Z])/g, " $1").replaceAll("-", " ")}: </strong>{String(value)}</p>)}</div><div className="mt-4"><h4 className="font-bold">Diagnósticos CIE-10</h4>{selectedDiagnoses.length ? selectedDiagnoses.map((item) => <p key={item.code}>{item.principal ? "Principal" : "Secundario"}: {item.manual ? `Diagnóstico manual${item.manualCode ? ` · Código proporcionado: ${item.manualCode}` : ""}` : item.code} · {item.description}{item.chronic ? " · Crónico" : ""}</p>) : <p>Sin diagnósticos seleccionados.</p>}</div></div>}
        </section>

        </fieldset>

        <div className="sticky bottom-0 z-10 -mx-3 mt-2 flex flex-wrap gap-3 border-t border-[#A9CFF0] bg-white/95 px-3 py-3 backdrop-blur print:hidden sm:-mx-4 sm:px-4">
          <button type="button" onClick={() => window.print()} className="rounded-xl border border-[#18A69A] px-5 py-3 font-bold text-[#123C50] hover:bg-[#E9F4F2]">Imprimir</button>
          <button type="button" onClick={saveInSession} className="rounded-xl border border-[#18A69A] px-5 py-3 font-bold text-[#123C50] hover:bg-[#E9F4F2]">Guardar</button>
          <button type="button" onClick={() => setRecipeDraft(collectFormData())} disabled={finalized && !correctionMode} className="rounded-xl border border-[#18A69A] px-5 py-3 font-bold text-[#123C50] hover:bg-[#E9F4F2] disabled:opacity-50">Generar receta</button>
          <button type="button" onClick={finishConsultation} disabled={finalized && !correctionMode} className="rounded-xl bg-[#123C50] px-5 py-3 font-bold text-white hover:bg-[#18A69A] disabled:opacity-50">Finalizar</button>
          {saveMessage && <p className="w-full text-sm text-slate-600" role="status">{saveMessage}</p>}
        </div>
        </div>
        </form>
      </div>
      {finalized && <div className="mx-auto mt-4 max-w-7xl px-4 print:hidden"><button type="button" onClick={() => setCorrectionMode(true)} className="rounded-lg px-3 py-2 text-sm font-semibold text-[#123C50] underline">Habilitar corrección de esta consulta</button></div>}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 print:hidden" id="clinical-sidebar">
          <button type="button" aria-label="Cerrar menú" onClick={() => setSidebarOpen(false)} className="absolute inset-0 bg-slate-900/25" />
          <aside className="absolute inset-y-0 right-0 w-[min(22rem,88vw)] overflow-y-auto border-l border-[#DCE9E6] bg-white p-6 shadow-xl" aria-label="Menú de herramientas, biblioteca y consulta">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-extrabold">Menú de consulta</h2>
              <button type="button" onClick={() => setSidebarOpen(false)} className="rounded-lg px-3 py-2 font-bold" aria-label="Cerrar">Cerrar</button>
            </div>
            <div className="space-y-3">
              <details open className="rounded-xl border border-[#DCE9E6] px-4 py-3">
                <summary className="cursor-pointer font-bold text-[#123C50]">Mis herramientas</summary>
                <nav className="mt-2 space-y-1" aria-label="Mis herramientas">
                  <div className="rounded-lg bg-[#F4F8F7] px-3 py-3">
                    <h3 className="text-sm font-bold text-[#123C50]">Calculadoras favoritas</h3>
                    {favoriteCalculators.length ? (
                      <ul className="mt-2 space-y-1">
                        {favoriteCalculators.map((calculator) => <li key={calculator.id} className="text-sm text-slate-700"><Link href="/profesionales#calculadoras" onClick={() => setSidebarOpen(false)} className="underline decoration-[#18A69A] underline-offset-2">{calculator.title}</Link><span className="block text-xs text-slate-500">{calculator.specialty}</span></li>)}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-slate-600">Aún no tienes favoritas. Elígelas en <Link href="/profesionales#calculadoras" onClick={() => setSidebarOpen(false)} className="font-semibold text-[#16877F] underline">Herramientas</Link>.</p>
                    )}
                  </div>
                  <Link href="/profesionales/consulta/hoja-clinica" onClick={() => setSidebarOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#E9F4F2]">Consulta médica</Link>
                  <Link href="/profesionales/perfil" onClick={() => setSidebarOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#E9F4F2]">Mi perfil</Link>
                  <Link href="/pacientes" onClick={() => setSidebarOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#E9F4F2]">Portal de pacientes y QR</Link>
                </nav>
              </details>
              <details className="rounded-xl border border-[#DCE9E6] px-4 py-3">
                <summary className="cursor-pointer font-bold text-[#123C50]">Mi Biblioteca</summary>
                <nav className="mt-2" aria-label="Mi Biblioteca">
                  <Link href="/profesionales/biblioteca" onClick={() => setSidebarOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#E9F4F2]">Guías y fuentes oficiales →</Link>
                </nav>
              </details>
              <details className="rounded-xl border border-[#DCE9E6] px-4 py-3">
                <summary className="cursor-pointer font-bold text-[#123C50]">Secciones de la hoja clínica</summary>
                <nav className="mt-2 space-y-1" aria-label="Secciones de la hoja clínica">{[["datos-paciente","Datos del paciente"],["signos-vitales","Signos vitales"],["antecedentes","Antecedentes"],["antecedentes-gineco","Antecedentes ginecoobstétricos"],["motivo-consulta","Motivo y padecimiento actual"],["paraclinicos","Paraclínicos"],["exploracion-fisica","Exploración física"],["diagnosticos","Diagnósticos CIE-10"],["tratamiento-farmacologico","Receta"],["indicaciones","Indicaciones"],["pronostico","Pronóstico"],["datos-medico","Datos del médico"],["cierre-consulta","Cierre"]].map(([id,label]) => <a key={id} href={`#${id}`} onClick={() => setSidebarOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-semibold text-[#123C50] hover:bg-[#E9F4F2]">{label}</a>)}</nav>
              </details>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
