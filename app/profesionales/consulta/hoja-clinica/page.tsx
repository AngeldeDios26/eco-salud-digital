"use client";

import React, { useEffect, useRef, useState } from "react";

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

type PrescribedMedication = {
  id: string;
  code: string;
  name: string;
  presentacion: string;
  dosis: string;
  via: string;
  frecuencia: string;
  duracion: string;
  cantidad: string;
  repeticiones: string;
};

type ClinicalFormat = "general" | "diabetes" | "hipertension" | "prenatal";

type DetectedQr = { rawValue: string };
type QrDetector = { detect(source: HTMLVideoElement): Promise<DetectedQr[]> };
type QrDetectorConstructor = new (options: { formats: string[] }) => QrDetector;

type PatientTransfer = {
  nombre: string;
  fechaNacimiento: string;
  sexo: "femenino" | "masculino" | "otro" | "sin-especificar";
  pesoKg: number | null;
  tallaCm: number | null;
  alergias: string;
  medicamentosActuales: string;
  enfermedadesCronicas: string;
  cirugias: string;
  antecedentesGinecoobstetricos: string;
};

type CalcField = {
  key: string;
  label: string;
  unit?: string;
  kind?: "number" | "select" | "checkbox" | "date";
  step?: string;
  options?: { value: string; label: string }[];
};

type CalculatorConfig = {
  title: string;
  fields: CalcField[];
  calculate: (inputs: Record<string, string>) => string;
};

type DoctorProfileFieldConfig = {
  key: keyof ProfessionalDetails;
  label: string;
  name: string;
};

type ClinicalFormatOption = {
  key: ClinicalFormat;
  label: string;
};

type ActiveModalWindow =
  | null
  | "diabetes"
  | "hipertension"
  | "prenatal"
  | "receta"
  | "perfil"
  | "herramientas";

const DOCTOR_PROFILE_FIELDS: DoctorProfileFieldConfig[] = [
  { key: "nombre", label: "Nombre completo del médico", name: "medicoNombre" },
  { key: "cedula", label: "Cédula profesional", name: "medicoCedula" },
  {
    key: "matricula",
    label: "Matrícula institucional",
    name: "medicoMatricula",
  },
  {
    key: "unidad",
    label: "Unidad Médica / Consultorio",
    name: "unidadMedica",
  },
];

const CLINICAL_FORMAT_OPTIONS: ClinicalFormatOption[] = [
  { key: "general", label: "Consulta General (Estándar)" },
  { key: "diabetes", label: "Formato Diabetes Mellitus" },
  { key: "hipertension", label: "Formato Hipertensión Arterial" },
  { key: "prenatal", label: "Formato Control Prenatal" },
];

type PrintableClinicalFormat = {
  id: string;
  title: string;
  source: string;
  subtitle: string;
  htmlBody: string;
};

const PRINTABLE_CLINICAL_FORMATS: PrintableClinicalFormat[] = [
  {
    id: "cdc-pediatria",
    title: "Tablas de Percentiles Pediátricos (CDC / OMS)",
    source: "Estándares Oficiales OMS (0 a 24 meses) y CDC NCHS (2 a 20 años)",
    subtitle: "Referencia clínica e imprimible de Peso, Talla e IMC por percentil (P3, P15, P50, P85, P97)",
    htmlBody: `
      <p style="font-size:12px;color:#334155;margin-bottom:10px;">
        <strong>Interpretación nutricional oficial:</strong> Bajo peso / Desnutrición: &lt; Percentil 3 (o &lt;-2 DE) · Peso normal: Percentil 15 a 84 · Sobrepeso: Percentil 85 a 94 · Obesidad: ≥ Percentil 95.
      </p>
      <h3 style="font-size:13px;background:#123C50;color:white;padding:6px 10px;border-radius:6px;margin:10px 0 6px 0;">
        1. Referencia Rápida de Peso (kg) y Longitud/Talla (cm) — 0 a 5 Años (OMS / CDC)
      </h3>
      <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:12px;">
        <thead>
          <tr style="background:#E9F4F2;color:#123C50;">
            <th style="border:1px solid #94A3B8;padding:5px;">Edad</th>
            <th style="border:1px solid #94A3B8;padding:5px;">Niños Peso P3 / P50 / P97 (kg)</th>
            <th style="border:1px solid #94A3B8;padding:5px;">Niñas Peso P3 / P50 / P97 (kg)</th>
            <th style="border:1px solid #94A3B8;padding:5px;">Niños Talla P3 / P50 / P97 (cm)</th>
            <th style="border:1px solid #94A3B8;padding:5px;">Niñas Talla P3 / P50 / P97 (cm)</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="border:1px solid #CBD5E1;padding:4px;font-weight:bold;">Recién nacido</td><td style="border:1px solid #CBD5E1;padding:4px;">2.5 / 3.3 / 4.3</td><td style="border:1px solid #CBD5E1;padding:4px;">2.4 / 3.2 / 4.2</td><td style="border:1px solid #CBD5E1;padding:4px;">46.3 / 49.9 / 53.4</td><td style="border:1px solid #CBD5E1;padding:4px;">45.6 / 49.1 / 52.7</td></tr>
          <tr><td style="border:1px solid #CBD5E1;padding:4px;font-weight:bold;">3 meses</td><td style="border:1px solid #CBD5E1;padding:4px;">5.1 / 6.4 / 7.9</td><td style="border:1px solid #CBD5E1;padding:4px;">4.6 / 5.8 / 7.4</td><td style="border:1px solid #CBD5E1;padding:4px;">57.6 / 61.4 / 65.3</td><td style="border:1px solid #CBD5E1;padding:4px;">55.8 / 59.8 / 63.8</td></tr>
          <tr><td style="border:1px solid #CBD5E1;padding:4px;font-weight:bold;">6 meses</td><td style="border:1px solid #CBD5E1;padding:4px;">6.4 / 7.9 / 9.7</td><td style="border:1px solid #CBD5E1;padding:4px;">5.8 / 7.3 / 9.2</td><td style="border:1px solid #CBD5E1;padding:4px;">63.6 / 67.6 / 71.6</td><td style="border:1px solid #CBD5E1;padding:4px;">61.5 / 65.7 / 70.0</td></tr>
          <tr><td style="border:1px solid #CBD5E1;padding:4px;font-weight:bold;">12 meses (1 año)</td><td style="border:1px solid #CBD5E1;padding:4px;">7.8 / 9.6 / 11.8</td><td style="border:1px solid #CBD5E1;padding:4px;">7.1 / 8.9 / 11.3</td><td style="border:1px solid #CBD5E1;padding:4px;">71.3 / 75.7 / 80.2</td><td style="border:1px solid #CBD5E1;padding:4px;">69.2 / 74.0 / 78.9</td></tr>
          <tr><td style="border:1px solid #CBD5E1;padding:4px;font-weight:bold;">24 meses (2 años)</td><td style="border:1px solid #CBD5E1;padding:4px;">9.8 / 12.2 / 15.1</td><td style="border:1px solid #CBD5E1;padding:4px;">9.2 / 11.5 / 14.6</td><td style="border:1px solid #CBD5E1;padding:4px;">82.1 / 87.8 / 93.6</td><td style="border:1px solid #CBD5E1;padding:4px;">80.3 / 86.4 / 92.5</td></tr>
          <tr><td style="border:1px solid #CBD5E1;padding:4px;font-weight:bold;">3 años</td><td style="border:1px solid #CBD5E1;padding:4px;">11.4 / 14.3 / 18.0</td><td style="border:1px solid #CBD5E1;padding:4px;">11.0 / 13.9 / 17.8</td><td style="border:1px solid #CBD5E1;padding:4px;">89.1 / 96.1 / 103.1</td><td style="border:1px solid #CBD5E1;padding:4px;">87.9 / 95.1 / 102.2</td></tr>
          <tr><td style="border:1px solid #CBD5E1;padding:4px;font-weight:bold;">4 años</td><td style="border:1px solid #CBD5E1;padding:4px;">12.9 / 16.3 / 20.9</td><td style="border:1px solid #CBD5E1;padding:4px;">12.5 / 16.1 / 21.1</td><td style="border:1px solid #CBD5E1;padding:4px;">95.4 / 103.3 / 111.2</td><td style="border:1px solid #CBD5E1;padding:4px;">94.6 / 102.7 / 110.8</td></tr>
          <tr><td style="border:1px solid #CBD5E1;padding:4px;font-weight:bold;">5 años</td><td style="border:1px solid #CBD5E1;padding:4px;">14.3 / 18.3 / 23.8</td><td style="border:1px solid #CBD5E1;padding:4px;">14.0 / 18.2 / 24.4</td><td style="border:1px solid #CBD5E1;padding:4px;">101.2 / 110.0 / 118.7</td><td style="border:1px solid #CBD5E1;padding:4px;">100.5 / 109.4 / 118.4</td></tr>
        </tbody>
      </table>

      <h3 style="font-size:13px;background:#18A69A;color:white;padding:6px 10px;border-radius:6px;margin:10px 0 6px 0;">
        2. Percentiles de Peso, Talla e IMC por Edad — 6 a 16 Años (CDC NCHS)
      </h3>
      <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:12px;">
        <thead>
          <tr style="background:#E9F4F2;color:#123C50;">
            <th style="border:1px solid #94A3B8;padding:5px;">Edad</th>
            <th style="border:1px solid #94A3B8;padding:5px;">Peso P50 Niños / Niñas (kg)</th>
            <th style="border:1px solid #94A3B8;padding:5px;">Talla P50 Niños / Niñas (cm)</th>
            <th style="border:1px solid #94A3B8;padding:5px;">IMC Niños P50 / P85 / P95</th>
            <th style="border:1px solid #94A3B8;padding:5px;">IMC Niñas P50 / P85 / P95</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="border:1px solid #CBD5E1;padding:4px;font-weight:bold;">6 años</td><td style="border:1px solid #CBD5E1;padding:4px;">20.7 / 20.2 kg</td><td style="border:1px solid #CBD5E1;padding:4px;">115.5 / 115.0 cm</td><td style="border:1px solid #CBD5E1;padding:4px;">15.4 / 17.0 / 18.4</td><td style="border:1px solid #CBD5E1;padding:4px;">15.2 / 17.1 / 18.8</td></tr>
          <tr><td style="border:1px solid #CBD5E1;padding:4px;font-weight:bold;">8 años</td><td style="border:1px solid #CBD5E1;padding:4px;">25.6 / 25.4 kg</td><td style="border:1px solid #CBD5E1;padding:4px;">128.0 / 127.5 cm</td><td style="border:1px solid #CBD5E1;padding:4px;">15.8 / 17.9 / 20.0</td><td style="border:1px solid #CBD5E1;padding:4px;">15.8 / 18.3 / 20.6</td></tr>
          <tr><td style="border:1px solid #CBD5E1;padding:4px;font-weight:bold;">10 años</td><td style="border:1px solid #CBD5E1;padding:4px;">32.0 / 33.0 kg</td><td style="border:1px solid #CBD5E1;padding:4px;">138.8 / 138.6 cm</td><td style="border:1px solid #CBD5E1;padding:4px;">16.6 / 19.4 / 22.1</td><td style="border:1px solid #CBD5E1;padding:4px;">16.8 / 20.0 / 23.0</td></tr>
          <tr><td style="border:1px solid #CBD5E1;padding:4px;font-weight:bold;">12 años</td><td style="border:1px solid #CBD5E1;padding:4px;">40.5 / 41.6 kg</td><td style="border:1px solid #CBD5E1;padding:4px;">149.1 / 151.2 cm</td><td style="border:1px solid #CBD5E1;padding:4px;">17.8 / 21.0 / 24.2</td><td style="border:1px solid #CBD5E1;padding:4px;">18.1 / 21.7 / 25.2</td></tr>
          <tr><td style="border:1px solid #CBD5E1;padding:4px;font-weight:bold;">14 años</td><td style="border:1px solid #CBD5E1;padding:4px;">50.8 / 49.4 kg</td><td style="border:1px solid #CBD5E1;padding:4px;">163.8 / 160.4 cm</td><td style="border:1px solid #CBD5E1;padding:4px;">19.2 / 22.6 / 26.0</td><td style="border:1px solid #CBD5E1;padding:4px;">19.4 / 23.3 / 27.2</td></tr>
          <tr><td style="border:1px solid #CBD5E1;padding:4px;font-weight:bold;">16 años</td><td style="border:1px solid #CBD5E1;padding:4px;">60.8 / 53.9 kg</td><td style="border:1px solid #CBD5E1;padding:4px;">173.4 / 162.5 cm</td><td style="border:1px solid #CBD5E1;padding:4px;">20.5 / 24.2 / 27.5</td><td style="border:1px solid #CBD5E1;padding:4px;">20.4 / 24.6 / 28.9</td></tr>
        </tbody>
      </table>
      <p style="font-size:11px;color:#475569;">
        <strong>Registro del paciente en consulta:</strong> Edad actual: ________ · Peso: ________ kg (Percentil: ______) · Talla: ________ cm (Percentil: ______) · IMC: ________ kg/m² (Percentil: ______).
      </p>
    `,
  },
  {
    id: "bitacora-ta-casa",
    title: "Bitácora de Presión Arterial en Casa (AMPA)",
    source: "Protocolo Internacional AHA / ESC / Guías IMSS de Monitoreo Domiciliario",
    subtitle: "Formato imprimible para registro matutino y vespertino durante 7 a 14 días",
    htmlBody: `
      <div style="border:1px solid #18A69A;background:#F4F8F7;padding:10px;border-radius:8px;font-size:11px;margin-bottom:12px;">
        <strong>Instrucciones internacionales (AHA / ESC) para medir su presión arterial en casa:</strong><br/>
        1. Repose sentado durante <strong>5 minutos</strong> antes de la medición, con la espalda apoyada, pies sobre el piso sin cruzar las piernas y brazo apoyado a la altura del corazón.<br/>
        2. No fume, no tome café/refresco ni haga ejercicio 30 minutos antes; acuda al baño previamente.<br/>
        3. Realice <strong>2 mediciones por la mañana</strong> (antes del desayuno y de sus medicamentos) y <strong>2 por la noche</strong> (antes de la cena), separadas por 1 minuto. Meta habitual en casa: <strong>&lt;135/85 mmHg</strong> (en consultorio &lt;140/90 o &lt;130/80 mmHg según indicación médica).
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:11px;">
        <thead>
          <tr style="background:#123C50;color:white;">
            <th style="border:1px solid #64748B;padding:5px;">Día / Fecha</th>
            <th style="border:1px solid #64748B;padding:5px;">Mañana Toma 1 (TA)</th>
            <th style="border:1px solid #64748B;padding:5px;">Mañana Toma 2 (TA)</th>
            <th style="border:1px solid #64748B;padding:5px;">Pulso Matutino (lpm)</th>
            <th style="border:1px solid #64748B;padding:5px;">Noche Toma 1 (TA)</th>
            <th style="border:1px solid #64748B;padding:5px;">Noche Toma 2 (TA)</th>
            <th style="border:1px solid #64748B;padding:5px;">Pulso Nocturno (lpm)</th>
            <th style="border:1px solid #64748B;padding:5px;">Síntomas / Observaciones</th>
          </tr>
        </thead>
        <tbody>
          ${Array.from({ length: 14 })
            .map(
              (_, i) => `
            <tr>
              <td style="border:1px solid #94A3B8;padding:6px;font-weight:bold;">Día ${i + 1}: ____/____/____</td>
              <td style="border:1px solid #94A3B8;padding:6px;">_____ / _____</td>
              <td style="border:1px solid #94A3B8;padding:6px;">_____ / _____</td>
              <td style="border:1px solid #94A3B8;padding:6px;">______ lpm</td>
              <td style="border:1px solid #94A3B8;padding:6px;">_____ / _____</td>
              <td style="border:1px solid #94A3B8;padding:6px;">_____ / _____</td>
              <td style="border:1px solid #94A3B8;padding:6px;">______ lpm</td>
              <td style="border:1px solid #94A3B8;padding:6px;"></td>
            </tr>`,
            )
            .join("")}
        </tbody>
      </table>
      <p style="font-size:11px;color:#B91C1C;margin-top:8px;font-weight:bold;">
        ⚠ Si su presión es igual o mayor a 180/120 mmHg o presenta dolor de cabeza intenso, dolor en el pecho, falta de aire, zumbido de oídos o visión borrosa, acuda de inmediato a Urgencias.
      </p>
    `,
  },
  {
    id: "monitoreo-glucosa",
    title: "Monitoreo Ambulatorio de Glucosa Capilar",
    source: "Estándares Internacionales ADA (American Diabetes Association) / GPC IMSS",
    subtitle: "Bitácora imprimible de automonitoreo glucémico estructurado en casa",
    htmlBody: `
      <div style="border:1px solid #18A69A;background:#F4F8F7;padding:10px;border-radius:8px;font-size:11px;margin-bottom:12px;">
        <strong>Metas internacionales de control glucémico (ADA / GPC IMSS):</strong><br/>
        • <strong>Glucosa en ayuno o antes de las comidas (Preprandial):</strong> 80 a 130 mg/dL.<br/>
        • <strong>Glucosa 2 horas después de iniciar los alimentos (Posprandial):</strong> Menor a 180 mg/dL.<br/>
        • <strong>En embarazo (Diabetes Gestacional):</strong> Ayuno &lt;95 mg/dL · 1 hora posprandial &lt;140 mg/dL · 2 horas posprandial &lt;120 mg/dL.<br/>
        • <strong>Hipoglucemia (&lt;70 mg/dL):</strong> Si presenta temblor o sudoración fría, tome 15 g de carbohidrato simple y repita la toma en 15 minutos.
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:11px;">
        <thead>
          <tr style="background:#123C50;color:white;">
            <th style="border:1px solid #64748B;padding:5px;">Fecha</th>
            <th style="border:1px solid #64748B;padding:5px;">Ayuno (mg/dL)</th>
            <th style="border:1px solid #64748B;padding:5px;">2h Post-Desayuno</th>
            <th style="border:1px solid #64748B;padding:5px;">Antes Comida</th>
            <th style="border:1px solid #64748B;padding:5px;">2h Post-Comida</th>
            <th style="border:1px solid #64748B;padding:5px;">Antes Cena</th>
            <th style="border:1px solid #64748B;padding:5px;">2h Post-Cena / Nocturna</th>
            <th style="border:1px solid #64748B;padding:5px;">Dosis Insulina / Notas</th>
          </tr>
        </thead>
        <tbody>
          ${Array.from({ length: 14 })
            .map(
              (_, i) => `
            <tr>
              <td style="border:1px solid #94A3B8;padding:6px;font-weight:bold;">Día ${i + 1}: ____/____</td>
              <td style="border:1px solid #94A3B8;padding:6px;">_______</td>
              <td style="border:1px solid #94A3B8;padding:6px;">_______</td>
              <td style="border:1px solid #94A3B8;padding:6px;">_______</td>
              <td style="border:1px solid #94A3B8;padding:6px;">_______</td>
              <td style="border:1px solid #94A3B8;padding:6px;">_______</td>
              <td style="border:1px solid #94A3B8;padding:6px;">_______</td>
              <td style="border:1px solid #94A3B8;padding:6px;"></td>
            </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    `,
  },
];

// Catálogo local CIE-10 integrado de alta frecuencia en Primer Nivel (IMSS)
const LOCAL_CIE10_RECORDS: Cie10Entry[] = [
  { code: "E11.9", description: "Diabetes mellitus no insulinodependiente, sin mención de complicación" },
  { code: "E11.2", description: "Diabetes mellitus no insulinodependiente, con complicaciones renales" },
  { code: "E11.4", description: "Diabetes mellitus no insulinodependiente, con complicaciones neurológicas" },
  { code: "I10", description: "Hipertensión esencial (primaria)" },
  { code: "I11.9", description: "Enfermedad cardíaca hipertensiva sin insuficiencia cardíaca" },
  { code: "Z34.0", description: "Supervisión de primer embarazo normal (Control prenatal)" },
  { code: "Z34.8", description: "Supervisión de otros embarazos normales (Control prenatal subsecuente)" },
  { code: "Z35.9", description: "Supervisión de embarazo de alto riesgo, sin otra especificación" },
  { code: "E66.9", description: "Obesidad, no especificada" },
  { code: "E78.0", description: "Hipercolesterolemia pura" },
  { code: "E78.1", description: "Hipertrigliceridemia pura" },
  { code: "E78.2", description: "Hiperlipidemia mixta" },
  { code: "J02.9", description: "Faringitis aguda, no especificada" },
  { code: "J03.9", description: "Amigdalitis aguda, no especificada" },
  { code: "J06.9", description: "Infección aguda de las vías respiratorias superiores, no especificada" },
  { code: "J45.9", description: "Asma, no especificada" },
  { code: "J44.9", description: "Enfermedad pulmonar obstructiva crónica (EPOC), no especificada" },
  { code: "A09", description: "Diarrea y gastroenteritis de presunto origen infeccioso" },
  { code: "K21.9", description: "Enfermedad del reflujo gastroesofágico sin esofagitis" },
  { code: "K29.7", description: "Gastritis, no especificada" },
  { code: "K58.9", description: "Síndrome del colon irritable sin diarrea" },
  { code: "N39.0", description: "Infección de vías urinarias, sitio no especificado" },
  { code: "N18.3", description: "Enfermedad renal crónica, etapa 3 (moderada)" },
  { code: "M54.5", description: "Lumbago no especificado (Dolor lumbar bajo)" },
  { code: "M17.9", description: "Gonartrosis, no especificada" },
  { code: "G43.9", description: "Migraña, no especificada" },
  { code: "F41.1", description: "Trastorno de ansiedad generalizada" },
  { code: "F32.9", description: "Episodio depresivo, no especificado" },
  { code: "E03.9", description: "Hipotiroidismo, no especificado" },
  { code: "B35.9", description: "Dermatofitosis (Micosis superficial), no especificada" },
];

// Calculadoras exclusivas para Consulta Externa de Primer Nivel (sin escalas intrahospitalarias)
const SIDEBAR_CALCULATORS: Record<string, CalculatorConfig> = {
  gestograma: {
    title: "Gestograma (FPP y SDG por FUM o Ultrasonido)",
    fields: [
      {
        key: "metodo",
        label: "Método de cálculo obstétrico",
        kind: "select",
        options: [
          { value: "fum", label: "Por Fecha de Última Regla (FUM)" },
          { value: "usg", label: "Por Ultrasonido previo (Fecha y SDG reportadas)" },
        ],
      },
      {
        key: "fechaReferencia",
        label: "Fecha de FUM o Fecha en que se realizó el Ultrasonido",
        kind: "date",
      },
      {
        key: "usgSemanas",
        label: "Semanas en el USG (solo si eligió Ultrasonido, si es FUM ponga 0)",
        unit: "sem",
        step: "1",
      },
      {
        key: "usgDias",
        label: "Días en el USG (0 a 6, si es FUM ponga 0)",
        unit: "días",
        step: "1",
      },
    ],
    calculate: (inputs) => {
      const method = inputs.metodo;
      const refDateStr = inputs.fechaReferencia;
      if (!method || !refDateStr) return "";
      const refTime = Date.parse(refDateStr + "T00:00:00Z");
      if (Number.isNaN(refTime)) return "";
      const now = new Date();
      const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
      const elapsedDaysFromRef = Math.floor((todayUTC - refTime) / 86400000);

      let totalGestationDays = elapsedDaysFromRef;
      let effectiveFumTime = refTime;

      if (method === "usg") {
        const w = Number(inputs.usgSemanas || "0");
        const d = Number(inputs.usgDias || "0");
        const usgDaysAtScan = w * 7 + d;
        totalGestationDays = usgDaysAtScan + elapsedDaysFromRef;
        effectiveFumTime = refTime - usgDaysAtScan * 86400000;
      }

      if (totalGestationDays < 0 || totalGestationDays > 310) {
        return "Verifica la fecha ingresada (fuera de rango obstétrico).";
      }

      const currentWeeks = Math.floor(totalGestationDays / 7);
      const currentDays = totalGestationDays % 7;
      const fppDate = new Date(effectiveFumTime + 280 * 86400000)
        .toISOString()
        .slice(0, 10);
      const trimester =
        currentWeeks < 14
          ? "1er Trimestre"
          : currentWeeks < 28
            ? "2do Trimestre"
            : "3er Trimestre";

      return (
        "Gestograma (" +
        (method === "fum" ? "por FUM" : "por Ultrasonido") +
        "): SDG actual " +
        currentWeeks +
        "." +
        currentDays +
        " semanas (" +
        trimester +
        ") · FPP estimada: " +
        fppDate
      );
    },
  },
  "riesgo-obstetrico": {
    title: "Calculadora Automática de Riesgo Obstétrico (Primer Nivel)",
    fields: [
      { key: "edadExtrema", label: "Edad materna ≤ 15 años o ≥ 35 años (+2)", kind: "checkbox" },
      { key: "comorbilidad", label: "Hipertensión, Diabetes, Cardiopatía, Nefropatía o Enfermedad tiroidea (+3)", kind: "checkbox" },
      { key: "preeclampsiaPrevia", label: "Antecedente de Preeclampsia / Eclampsia o Óbito / Prematurez (+3)", kind: "checkbox" },
      { key: "cesareasAbortos", label: "≥ 2 Cesáreas previas o ≥ 2 Abortos consecutivos (+2)", kind: "checkbox" },
      { key: "embarazoMultiple", label: "Embarazo múltiple, Placenta previa o Polihidramnios/Oligohidramnios (+3)", kind: "checkbox" },
      { key: "anemiaInfeccion", label: "Hemoglobina < 10 g/dL, IVU recurrente o Rh negativo no sensibilizado (+1)", kind: "checkbox" },
      { key: "sangradoActual", label: "Sangrado transvaginal o Amenaza de parto pretérmino actual (+4)", kind: "checkbox" },
    ],
    calculate: (inputs) => {
      const score =
        (inputs.edadExtrema === "true" ? 2 : 0) +
        (inputs.comorbilidad === "true" ? 3 : 0) +
        (inputs.preeclampsiaPrevia === "true" ? 3 : 0) +
        (inputs.cesareasAbortos === "true" ? 2 : 0) +
        (inputs.embarazoMultiple === "true" ? 3 : 0) +
        (inputs.anemiaInfeccion === "true" ? 1 : 0) +
        (inputs.sangradoActual === "true" ? 4 : 0);
      const level =
        score >= 4
          ? "ALTO RIESGO OBSTÉTRICO (Valorar referencia a 2do Nivel Ginecología y Obstetricia)"
          : score >= 1
            ? "Riesgo Obstétrico Intermedio (Vigilancia prenatal estrecha)"
            : "Bajo Riesgo Obstétrico (Control prenatal habitual en 1er Nivel)";
      return "Riesgo Obstétrico: " + score + " puntos — " + level;
    },
  },
  "riesgo-trombotico-embarazo": {
    title: "Riesgo Trombótico en el Embarazo (RCOG / GPC)",
    fields: [
      { key: "tevPrevio", label: "Tromboembolismo venoso (TEV) previo o Trombofilia de alto riesgo (+4)", kind: "checkbox" },
      { key: "comorbilidadMedica", label: "Comorbilidad médica activa (Lupus, Cáncer, Síndrome nefrótico, Cardiopatía) (+3)", kind: "checkbox" },
      { key: "edad35", label: "Edad materna > 35 años (+1)", kind: "checkbox" },
      { key: "obesidad", label: "Obesidad materna IMC ≥ 30 kg/m² (+1)", kind: "checkbox" },
      { key: "paridad3", label: "Paridad ≥ 3 partos previos (+1)", kind: "checkbox" },
      { key: "tabaquismoVarices", label: "Tabaquismo activo o Várices venosas gruesas (+1)", kind: "checkbox" },
      { key: "preeclampsiaMultiple", label: "Preeclampsia actual o Embarazo múltiple (+1)", kind: "checkbox" },
      { key: "inmovilizacion", label: "Inmovilización, Hiperémesis/Deshidratación o Infección sistémica (+1)", kind: "checkbox" },
    ],
    calculate: (inputs) => {
      const score =
        (inputs.tevPrevio === "true" ? 4 : 0) +
        (inputs.comorbilidadMedica === "true" ? 3 : 0) +
        (inputs.edad35 === "true" ? 1 : 0) +
        (inputs.obesidad === "true" ? 1 : 0) +
        (inputs.paridad3 === "true" ? 1 : 0) +
        (inputs.tabaquismoVarices === "true" ? 1 : 0) +
        (inputs.preeclampsiaMultiple === "true" ? 1 : 0) +
        (inputs.inmovilizacion === "true" ? 1 : 0);
      const rec =
        score >= 4
          ? "Alto riesgo trombótico (≥4 pts): Indicación de tromboprofilaxis prenatal inmediata y envío a 2do Nivel"
          : score === 3
            ? "Riesgo intermedio-alto (3 pts): Valorar tromboprofilaxis desde semana 28 y en puerperio"
            : score === 2
              ? "Riesgo moderado (2 pts): Medidas mecánicas, hidratación y valorar profilaxis posparto"
              : "Bajo riesgo trombótico (<2 pts): Movilización temprana e hidratación";
      return "Riesgo Trombótico Obstétrico: " + score + " puntos — " + rec;
    },
  },
  "ckd-epi-2021": {
    title: "TFGe CKD-EPI 2021 (Función Renal)",
    fields: [
      { key: "creatinina", label: "Creatinina sérica", unit: "mg/dL", step: "0.01" },
      { key: "edad", label: "Edad", unit: "años", step: "1" },
      {
        key: "sexo",
        label: "Sexo biológico",
        kind: "select",
        options: [
          { value: "femenino", label: "Femenino" },
          { value: "masculino", label: "Masculino" },
        ],
      },
    ],
    calculate: (inputs) => {
      const cr = Number(inputs.creatinina);
      const age = Number(inputs.edad);
      const sex = inputs.sexo;
      if (!cr || cr <= 0 || !age || age <= 0 || !sex) return "";
      const isFemale = sex === "femenino";
      const kappa = isFemale ? 0.7 : 0.9;
      const alpha = isFemale ? -0.241 : -0.302;
      const factorSex = isFemale ? 1.012 : 1;
      const ratio = cr / kappa;
      const egfr =
        142 *
        Math.pow(Math.min(ratio, 1), alpha) *
        Math.pow(Math.max(ratio, 1), -1.2) *
        Math.pow(0.9938, age) *
        factorSex;
      const stage =
        egfr >= 90
          ? "G1 (Normal o alta)"
          : egfr >= 60
            ? "G2 (Ligeramente disminuida)"
            : egfr >= 45
              ? "G3a (Descenso ligero-moderado)"
              : egfr >= 30
                ? "G3b (Descenso moderado-grave)"
                : egfr >= 15
                  ? "G4 (Descenso grave)"
                  : "G5 (Falla renal)";
      return "TFGe CKD-EPI: " + egfr.toFixed(1) + " mL/min/1.73m² · Estadio KDIGO " + stage;
    },
  },
  "cockcroft-gault": {
    title: "Depuración Creatinina (Cockcroft-Gault)",
    fields: [
      { key: "edad", label: "Edad", unit: "años", step: "1" },
      { key: "peso", label: "Peso", unit: "kg", step: "0.1" },
      { key: "creatinina", label: "Creatinina sérica", unit: "mg/dL", step: "0.01" },
      {
        key: "sexo",
        label: "Sexo biológico",
        kind: "select",
        options: [
          { value: "femenino", label: "Femenino" },
          { value: "masculino", label: "Masculino" },
        ],
      },
    ],
    calculate: (inputs) => {
      const age = Number(inputs.edad);
      const wt = Number(inputs.peso);
      const cr = Number(inputs.creatinina);
      if (!age || !wt || !cr || cr <= 0 || !inputs.sexo) return "";
      const base = ((140 - age) * wt) / (72 * cr);
      const crCl = inputs.sexo === "femenino" ? base * 0.85 : base;
      return "Depuración Cockcroft-Gault: " + crCl.toFixed(1) + " mL/min";
    },
  },
  imc: {
    title: "Índice de Masa Corporal (IMC)",
    fields: [
      { key: "peso", label: "Peso", unit: "kg", step: "0.1" },
      { key: "talla", label: "Talla", unit: "cm", step: "0.1" },
    ],
    calculate: (inputs) => {
      const w = Number(inputs.peso);
      const h = Number(inputs.talla) / 100;
      if (!w || !h || h <= 0) return "";
      const v = w / (h * h);
      const cat =
        v < 18.5
          ? "Bajo peso"
          : v < 25
            ? "Normopeso"
            : v < 30
              ? "Sobrepeso"
              : v < 35
                ? "Obesidad grado I"
                : v < 40
                  ? "Obesidad grado II"
                  : "Obesidad grado III";
      return "IMC: " + v.toFixed(1) + " kg/m² (" + cat + ")";
    },
  },
  "fib-4": {
    title: "Índice FIB-4 (Fibrosis Hepática)",
    fields: [
      { key: "edad", label: "Edad", unit: "años", step: "1" },
      { key: "ast", label: "AST (TGO)", unit: "U/L", step: "1" },
      { key: "alt", label: "ALT (TGP)", unit: "U/L", step: "1" },
      { key: "plaquetas", label: "Plaquetas", unit: "10⁹/L (miles/mm³)", step: "1" },
    ],
    calculate: (inputs) => {
      const age = Number(inputs.edad);
      const ast = Number(inputs.ast);
      const alt = Number(inputs.alt);
      const plt = Number(inputs.plaquetas);
      if (!age || !ast || !alt || !plt) return "";
      const fib4 = (age * ast) / (plt * Math.sqrt(alt));
      const risk =
        fib4 < 1.3
          ? "Bajo riesgo de fibrosis avanzada"
          : fib4 <= 2.67
            ? "Riesgo indeterminado"
            : "Alto riesgo de fibrosis avanzada";
      return "FIB-4: " + fib4.toFixed(2) + " puntos (" + risk + ")";
    },
  },
  "cha2ds2-vasc": {
    title: "CHA₂DS₂-VASc (Fibrilación Auricular)",
    fields: [
      { key: "ic", label: "Insuficiencia cardiaca (+1)", kind: "checkbox" },
      { key: "hta", label: "Hipertensión arterial (+1)", kind: "checkbox" },
      { key: "edad75", label: "Edad ≥ 75 años (+2)", kind: "checkbox" },
      { key: "dm", label: "Diabetes mellitus (+1)", kind: "checkbox" },
      { key: "evc", label: "EVC / AIT previo (+2)", kind: "checkbox" },
      { key: "vasc", label: "Enfermedad vascular (+1)", kind: "checkbox" },
      { key: "edad65", label: "Edad 65 a 74 años (+1)", kind: "checkbox" },
      { key: "mujer", label: "Sexo femenino (+1)", kind: "checkbox" },
    ],
    calculate: (inputs) => {
      const score =
        (inputs.ic === "true" ? 1 : 0) +
        (inputs.hta === "true" ? 1 : 0) +
        (inputs.edad75 === "true" ? 2 : 0) +
        (inputs.dm === "true" ? 1 : 0) +
        (inputs.evc === "true" ? 2 : 0) +
        (inputs.vasc === "true" ? 1 : 0) +
        (inputs.edad65 === "true" ? 1 : 0) +
        (inputs.mujer === "true" ? 1 : 0);
      const note =
        score >= 2
          ? "Indicación de anticoagulación oral"
          : "Bajo/moderado riesgo embólico";
      return "CHA₂DS₂-VASc: " + score + " puntos (" + note + ")";
    },
  },
};

const inputClassName =
  "mt-1.5 w-full rounded-xl border border-[#DCE9E6] bg-white px-3.5 py-2 text-sm text-[#123C50] outline-none transition placeholder:text-slate-400 focus:border-[#18A69A] focus:ring-2 focus:ring-[#18A69A]/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

const sectionClassName =
  "overflow-hidden rounded-2xl border border-[#DCE9E6] bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5";

const defaultParaclinicos = "Sin paraclínicos que comentar";

const defaultRegisteredDoctor: ProfessionalDetails = {
  nombre: "Dr. Ángel de Dios",
  cedula: "12345678",
  matricula: "99887766",
  unidad: "UMF No. 1 · IMSS",
};

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

const imssMedicationsCatalog = [
  { code: "010.000.5165.00", name: "Metformina 850 mg", presentation: "Tableta 850 mg; envase con 30", dose: "1 tableta (850 mg) con los alimentos", route: "Oral", frequency: "Cada 12 o cada 8 horas", duration: "30 días", quantity: "1 a 2 envases" },
  { code: "010.000.1042.00", name: "Glibenclamida 5 mg", presentation: "Tableta 5 mg; envase con 50", dose: "2.5 a 5 mg antes del desayuno o comida principal", route: "Oral", frequency: "Cada 12 o 24 horas", duration: "30 días", quantity: "1 envase" },
  { code: "010.000.1050.00", name: "Insulina humana NPH 100 UI/mL", presentation: "Suspensión inyectable 100 UI/mL; frasco ámpula 10 mL", dose: "Ajustar UI según glucemia capilar y peso", route: "Subcutánea", frequency: "Cada 12 o 24 horas", duration: "30 días", quantity: "1 frasco ámpula" },
  { code: "010.000.4158.00", name: "Insulina glargina 100 UI/mL", presentation: "Solución inyectable 100 UI/mL; frasco ámpula 10 mL o pluma", dose: "Ajustar UI según meta de glucosa en ayuno", route: "Subcutánea", frequency: "Cada 24 horas a la misma hora", duration: "30 días", quantity: "1 envase" },
  { code: "010.000.2501.00", name: "Enalapril 10 mg", presentation: "Cápsula o tableta de 10 mg; envase con 30", dose: "10 mg inicial; mantenimiento 10 a 20 mg", route: "Oral", frequency: "Cada 12 o 24 horas", duration: "30 días", quantity: "1 a 2 envases" },
  { code: "010.000.2520.00", name: "Losartán 50 mg", presentation: "Gragea o comprimido recubierto 50 mg; envase con 30", dose: "50 mg (1 gragea)", route: "Oral", frequency: "Cada 12 o 24 horas", duration: "30 días", quantity: "1 a 2 envases" },
  { code: "010.000.2540.00", name: "Telmisartán 40 mg", presentation: "Tableta 40 mg; envase con 30", dose: "40 a 80 mg", route: "Oral", frequency: "Cada 24 horas", duration: "30 días", quantity: "1 a 2 envases" },
  { code: "010.000.2111.00", name: "Amlodipino 5 mg", presentation: "Tableta o cápsula 5 mg; envase con 10 o 30", dose: "5 a 10 mg", route: "Oral", frequency: "Cada 24 horas", duration: "30 días", quantity: "1 a 3 envases" },
  { code: "010.000.2301.00", name: "Hidroclorotiazida 25 mg", presentation: "Tableta 25 mg; envase con 20", dose: "12.5 a 25 mg por la mañana", route: "Oral", frequency: "Cada 24 horas", duration: "30 días", quantity: "1 a 2 envases" },
  { code: "010.000.5106.00", name: "Atorvastatina 20 mg", presentation: "Tableta 20 mg; envase con 10", dose: "1 a 2 tabletas (20 a 40 mg) por la noche", route: "Oral", frequency: "Cada 24 horas", duration: "30 días", quantity: "3 envases" },
  { code: "010.000.0657.00", name: "Pravastatina 10 mg", presentation: "Tableta 10 mg; envase con 30", dose: "10 a 40 mg por la noche", route: "Oral", frequency: "Cada 24 horas", duration: "30 días", quantity: "1 a 2 envases" },
  { code: "010.000.0655.00", name: "Bezafibrato 200 mg", presentation: "Tableta 200 mg; envase con 30", dose: "200 mg (1 tableta) después de los alimentos", route: "Oral", frequency: "Cada 8 o 12 horas", duration: "30 días", quantity: "2 envases" },
  { code: "010.000.0103.00", name: "Ácido acetilsalicílico 100 mg (Protect)", presentation: "Tableta soluble o con capa entérica 100 mg; envase con 30", dose: "100 mg (1 tableta)", route: "Oral", frequency: "Cada 24 horas después de los alimentos", duration: "30 días", quantity: "1 envase" },
  { code: "010.000.1706.00", name: "Ácido fólico 0.4 mg (400 mcg)", presentation: "Tableta 0.4 mg; envase con 90", dose: "1 tableta (0.4 mg)", route: "Oral", frequency: "Cada 24 horas", duration: "90 días", quantity: "1 envase" },
  { code: "010.000.1701.00", name: "Fumarato ferroso 200 mg", presentation: "Tableta 200 mg; envase con 50", dose: "1 tableta (200 mg)", route: "Oral", frequency: "Cada 24 horas lejos de lácteos", duration: "30 días", quantity: "1 envase" },
  { code: "010.000.0104.00", name: "Paracetamol 500 mg", presentation: "Tableta 500 mg; envase con 10", dose: "500 mg a 1 g (1 a 2 tabletas)", route: "Oral", frequency: "Cada 6 u 8 horas en caso de dolor o fiebre", duration: "3 a 5 días", quantity: "1 a 2 envases" },
  { code: "010.000.3407.00", name: "Naproxeno 250 mg", presentation: "Tableta 250 mg; envase con 30", dose: "250 a 500 mg con alimentos", route: "Oral", frequency: "Cada 12 horas", duration: "5 a 7 días", quantity: "1 envase" },
  { code: "010.000.3417.00", name: "Diclofenaco 100 mg", presentation: "Cápsula o gragea de liberación prolongada 100 mg; envase con 20", dose: "100 mg (1 gragea)", route: "Oral", frequency: "Cada 24 horas después de alimentos", duration: "5 días", quantity: "1 envase" },
  { code: "010.000.2128.00", name: "Amoxicilina 500 mg", presentation: "Cápsula 500 mg; envase con 12 o 15", dose: "500 mg (1 cápsula)", route: "Oral", frequency: "Cada 8 horas", duration: "7 días", quantity: "2 envases" },
  { code: "010.000.4255.00", name: "Ciprofloxacino 250 mg", presentation: "Cápsula o tableta 250 mg; envase con 8", dose: "250 a 500 mg", route: "Oral", frequency: "Cada 12 horas", duration: "7 días", quantity: "2 envases" },
  { code: "010.000.1903.00", name: "Trimetoprima con sulfametoxazol 160/800 mg", presentation: "Tableta 160/800 mg; envase con 14", dose: "1 tableta", route: "Oral", frequency: "Cada 12 horas", duration: "7 días", quantity: "1 envase" },
  { code: "010.000.5186.00", name: "Omeprazol 20 mg", presentation: "Cápsula o tableta 20 mg; envase con 14", dose: "20 mg (1 cápsula) en ayuno", route: "Oral", frequency: "Cada 24 horas", duration: "14 a 28 días", quantity: "1 a 2 envases" },
  { code: "010.000.1242.00", name: "Metoclopramida 10 mg", presentation: "Tableta 10 mg; envase con 20", dose: "10 mg 30 minutos antes de los alimentos", route: "Oral", frequency: "Cada 8 horas", duration: "3 a 5 días", quantity: "1 envase" },
  { code: "010.000.2144.00", name: "Loratadina 10 mg", presentation: "Tableta o gragea 10 mg; envase con 20", dose: "10 mg (1 tableta)", route: "Oral", frequency: "Cada 24 horas", duration: "5 a 10 días", quantity: "1 envase" },
  { code: "010.000.0429.00", name: "Salbutamol aerosol 100 mcg/dosis", presentation: "Suspensión en aerosol 200 dosis", dose: "1 a 2 inhalaciones", route: "Inhalada", frequency: "Cada 6 u 8 horas o rescate", duration: "Según respuesta clínica", quantity: "1 envase" },
];

function buildPatientIndications(
  diagnoses: SelectedDiagnosis[],
  format: ClinicalFormat,
) {
  const formatSpecific: Record<ClinicalFormat, string[]> = {
    general: [],
    diabetes: [
      "Plan de alimentación reducido en azúcares simples y harinas refinadas; fraccionar comidas y mantener hidratación con agua simple.",
      "Revisión diaria de ambos pies (coloración, temperatura, integridad de la piel y corte recto de uñas); usar calzado cómodo y cerrado.",
      "Automonitoreo de glucosa capilar y acudir a Urgencias ante hipoglucemia (<70 mg/dL, sudoración fría, temblor, confusión) o hiperglucemia severa (>300 mg/dL).",
    ],
    hipertension: [
      "Dieta hiposódica (<2 g de sodio al día: evitar sal de mesa, embutidos, enlatados y alimentos ultraprocesados) y actividad física aeróbica 30 min/día.",
      "Llevar bitácora de presión arterial matutina y vespertina tras 5 minutos de reposo.",
      "Acudir de inmediato a Urgencias ante datos de alarma: dolor de cabeza intenso, zumbido de oídos (acúfenos), visión de luces (fosfenos), dolor en el pecho o falta de aire.",
    ],
    prenatal: [
      "Continuar suplementación con ácido fólico y hierro según prescripción; alimentación balanceada rica en vegetales verdes y proteínas, e hidratación abundante.",
      "Vigilar movimientos fetales diariamente después de los alimentos.",
      "Acudir de inmediato a Urgencias Obstétricas ante signos de alarma: sangrado o salida de líquido transvaginal, dolor de cabeza intenso, zumbido de oídos, visión borrosa, hinchazón súbita de cara/manos, contracciones antes de tiempo o disminución de movimientos fetales.",
    ],
  };

  const diagnosisGuidance = diagnoses.map(
    (diagnosis) =>
      "Para " +
      diagnosis.description +
      ", sigue el plan acordado con tu médico y consulta antes de modificar tu tratamiento.",
  );
  const generalGuidance = [
    "Usa los medicamentos únicamente como fueron prescritos; no los ajustes ni suspendas por cuenta propia.",
    "Acude a revisión en la fecha indicada y lleva tus estudios o registros relacionados con estos diagnósticos.",
    "Busca atención urgente ante un empeoramiento súbito, dificultad para respirar, pérdida del conocimiento o síntomas intensos.",
  ];
  const combined = [
    ...(formatSpecific[format] || []),
    ...diagnosisGuidance,
    ...(diagnoses.length > 0 || format !== "general" ? generalGuidance : []),
  ];
  return Array.from(new Set(combined)).join("\n");
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

const defaultPhysicalExamText = [
  ...examTemplates.map((item) => item.title + ": " + item.text),
  "Resto de exploración en apariencia normal.",
].join("\n\n");

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-MX");
}

function BrandLogo({ size = "md" }: { size?: "md" | "lg" }) {
  const boxSize = size === "lg" ? "h-12 w-12 rounded-2xl" : "h-10 w-10 rounded-xl";
  const svgSize = size === "lg" ? "h-9 w-9" : "h-7 w-7";
  return (
    <div
      className={
        boxSize +
        " flex shrink-0 items-center justify-center bg-gradient-to-br from-[#123C50] via-[#156B70] to-[#18A69A] shadow-sm"
      }
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 64 64"
        className={svgSize}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M24 10C24 8.34315 25.3431 7 27 7H37C38.6569 7 40 8.34315 40 10V24H54C55.6569 24 57 25.3431 57 27V37C57 38.6569 55.6569 40 54 40H40V54C40 55.6569 38.6569 57 37 57H27C25.3431 57 24 55.6569 24 54V40H10C8.34315 40 7 38.6569 7 37V27C7 25.3431 8.34315 24 10 24H24V10Z"
          fill="white"
        />
        <path
          d="M14 35C22 35 25 27 33 27C39 27 42 22 47 22"
          stroke="#18A69A"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M23 41C29 41 33 34 40 34C45 34 48 31 51 31"
          stroke="#123C50"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <circle cx="14" cy="35" r="3" fill="#18A69A" />
        <circle cx="33" cy="27" r="2.8" fill="#18A69A" />
        <circle cx="47" cy="22" r="3" fill="#18A69A" />
        <circle cx="23" cy="41" r="2.8" fill="#123C50" />
        <circle cx="51" cy="31" r="3" fill="#123C50" />
      </svg>
    </div>
  );
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
      <input
        className={inputClassName}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={
          onChange ? (event) => onChange(event.target.value) : undefined
        }
      />
    </label>
  );
}

function SectionHeading({
  number,
  children,
  note,
  variant = "teal",
}: {
  number: string;
  children: React.ReactNode;
  note?: string;
  variant?: "teal" | "navy" | "blue";
}) {
  const headerStyles = {
    teal: "bg-[#18A69A] text-white",
    navy: "bg-[#123C50] text-white",
    blue: "bg-[#2456C7] text-white",
  }[variant];

  return (
    <div className="-mx-4 -mt-4 mb-4 border-b border-[#DCE9E6] sm:-mx-5 sm:-mt-5">
      <div
        className={`flex items-center justify-between gap-3 px-4 py-2.5 sm:px-5 ${headerStyles}`}
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 min-w-[1.75rem] items-center justify-center rounded-md bg-white/20 px-1.5 text-xs font-extrabold tracking-wider text-white">
            {number}
          </span>
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-white sm:text-base">
            {children}
          </h2>
        </div>
      </div>
      {note && (
        <div className="bg-[#F8FBFA] px-4 py-1.5 text-xs text-slate-600 sm:px-5">
          {note}
        </div>
      )}
    </div>
  );
}

export default function App() {
  // Estado de Autenticación (Inicio de Sesión y Registro)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("medico@imss.gob.mx");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Ventana emergente / Vista previa activa (Diabetes, HTA, Prenatal, Receta, Perfil, Herramientas)
  const [activeWindow, setActiveWindow] = useState<ActiveModalWindow>(null);
  const [enabledCalcIds, setEnabledCalcIds] = useState<string[]>(() =>
    Object.keys(SIDEBAR_CALCULATORS),
  );
  const [copyFeedback, setCopyFeedback] = useState("");
  const [activePrintableFormatId, setActivePrintableFormatId] =
    useState<string>("cdc-pediatria");

  const [clinicalFormat, setClinicalFormat] =
    useState<ClinicalFormat>("general");
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
    glucosaCapilar: "",
    perimetroAbdominal: "",
  });
  const [antecedentsText, setAntecedentsText] = useState(defaultAntecedents);
  const [gynecologicText, setGynecologicText] = useState(defaultGynecologic);
  const [motivoPadecimiento, setMotivoPadecimiento] = useState("");
  const [paraclinicosText, setParaclinicosText] =
    useState(defaultParaclinicos);
  const [exploracion, setExploracion] = useState(defaultPhysicalExamText);

  const [diabetesFields, setDiabetesFields] = useState({
    hba1c: "",
    glucosaAyuno: "",
    tfge: "",
    revisionPies:
      "Pulsos pedios presentes, sensibilidad conservada al monofilamento, sin úlceras ni hiperqueratosis.",
    fondoOjo: "Pendiente valoración anual por Oftalmología.",
    metaGlucemica: "En control metabólico / ajuste higiénico-dietético.",
  });
  const [htaFields, setHtaFields] = useState({
    taDomiciliaria: "",
    riesgoCardiovascular: "Moderado",
    danoOrganoBlanco:
      "Interrogado y negado (sin angina, disnea, déficit neurológico ni edema).",
    adherencia:
      "Buena adherencia farmacológica, sin efectos adversos reportados.",
  });
  const [prenatalFields, setPrenatalFields] = useState({
    fum: "",
    sdg: "",
    fpp: "",
    fcf: "",
    fondoUterino: "",
    movimientosFetales: "Presentes y normocinéticos",
    signosAlarmaObstetrica:
      "Interrogados y negados (sin cefalea, acúfenos, fosfenos, epigastralgia, edema ni pérdidas transvaginales).",
    riesgoObstetrico: "Bajo riesgo",
  });

  const [diagnosisQuery, setDiagnosisQuery] = useState("");
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<
    SelectedDiagnosis[]
  >([]);
  const [manualDiagnosisOpen, setManualDiagnosisOpen] = useState(false);
  const [manualDiagnosisCode, setManualDiagnosisCode] = useState("");
  const [manualDiagnosisDescription, setManualDiagnosisDescription] =
    useState("");

  const [medicationQuery, setMedicationQuery] = useState("");
  const [selectedMedication, setSelectedMedication] = useState("");
  const [selectedMedicationCode, setSelectedMedicationCode] = useState("");
  const [medicationFields, setMedicationFields] = useState({
    presentacion: "",
    dosis: "",
    via: "",
    frecuencia: "",
    duracion: "",
    cantidad: "",
    repeticiones: "",
  });
  const [prescribedMedications, setPrescribedMedications] = useState<
    PrescribedMedication[]
  >([]);

  const [seguimientoText, setSeguimientoText] = useState(
    "Cita abierta a Urgencias ante signos de alarma; control en Unidad de Medicina Familiar.",
  );
  const [prognosis, setPrognosis] = useState("Reservado a evolución");
  const [indicationsOverride, setIndicationsOverride] = useState<string | null>(
    null,
  );

  const formRef = useRef<HTMLFormElement | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSidebarCalcId, setActiveSidebarCalcId] =
    useState<string>("gestograma");
  const [sidebarCalcInputs, setSidebarCalcInputs] = useState<
    Record<string, string>
  >({});
  const [finalized, setFinalized] = useState(false);
  const [correctionMode, setCorrectionMode] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [professionalDetails, setProfessionalDetails] =
    useState<ProfessionalDetails>(defaultRegisteredDoctor);
  const [editingProfile, setEditingProfile] = useState(false);

  const [qrStatus, setQrStatus] = useState("");
  const [qrScanning, setQrScanning] = useState(false);
  const [manualQrCodeInput, setManualQrCodeInput] = useState("");
  const qrVideoRef = useRef<HTMLVideoElement | null>(null);
  const qrStreamRef = useRef<MediaStream | null>(null);
  const qrFrameRef = useRef<number | null>(null);
  const diagnosisSearchField = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      const savedSession = localStorage.getItem("esd_auth_session");
      if (savedSession === "logged_out") {
        setIsAuthenticated(false);
      }
      const savedProfile =
        localStorage.getItem("esd_registered_doctor_profile") ||
        localStorage.getItem("esd_professional_profile");
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile) as Partial<ProfessionalDetails>;
        setProfessionalDetails({
          nombre: parsed.nombre || defaultRegisteredDoctor.nombre,
          matricula: parsed.matricula || defaultRegisteredDoctor.matricula,
          cedula: parsed.cedula || defaultRegisteredDoctor.cedula,
          unidad: parsed.unidad || defaultRegisteredDoctor.unidad,
        });
      }
      const savedCalcs = localStorage.getItem("esd_enabled_calculators");
      if (savedCalcs) {
        const parsedCalcs = JSON.parse(savedCalcs) as string[];
        const validCalcs = Array.isArray(parsedCalcs)
          ? parsedCalcs.filter((id) => Boolean(SIDEBAR_CALCULATORS[id]))
          : [];
        if (validCalcs.length > 0) {
          setEnabledCalcIds(validCalcs);
        }
      }
    } catch {
      // Conservar datos registrados por defecto si localStorage no está disponible
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "esd_registered_doctor_profile",
        JSON.stringify(professionalDetails),
      );
    } catch {
      // Ignorar errores de almacenamiento local
    }
  }, [professionalDetails]);

  const toggleCalculatorTool = (calcId: string) => {
    setEnabledCalcIds((prev) => {
      const exists = prev.includes(calcId);
      const next = exists
        ? prev.filter((id) => id !== calcId)
        : [...prev, calcId];
      const safeNext = next.length > 0 ? next : [calcId];
      try {
        localStorage.setItem(
          "esd_enabled_calculators",
          JSON.stringify(safeNext),
        );
      } catch {
        // Ignorar
      }
      if (!safeNext.includes(activeSidebarCalcId)) {
        setActiveSidebarCalcId(safeNext[0]);
      }
      return safeNext;
    });
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim()) {
      setAuthError("Ingresa tu correo electrónico o matrícula.");
      return;
    }
    setAuthError("");
    setIsAuthenticated(true);
    try {
      localStorage.setItem("esd_auth_session", "active");
    } catch {
      // Ignorar
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!professionalDetails.nombre.trim() || !professionalDetails.cedula.trim()) {
      setAuthError("Completa tu nombre y cédula profesional para registrarte.");
      return;
    }
    setAuthError("");
    setIsAuthenticated(true);
    try {
      localStorage.setItem("esd_auth_session", "active");
      localStorage.setItem(
        "esd_registered_doctor_profile",
        JSON.stringify(professionalDetails),
      );
    } catch {
      // Ignorar
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveWindow(null);
    setSidebarOpen(false);
    try {
      localStorage.setItem("esd_auth_session", "logged_out");
    } catch {
      // Ignorar
    }
  };

  useEffect(
    () => () => {
      qrStreamRef.current?.getTracks().forEach((track) => track.stop());
      if (qrFrameRef.current !== null) cancelAnimationFrame(qrFrameRef.current);
    },
    [],
  );

  const handleFumChange = (fumValue: string) => {
    if (!fumValue) {
      setPrenatalFields((prev) => ({ ...prev, fum: "", sdg: "", fpp: "" }));
      return;
    }
    const fumTime = Date.parse(fumValue + "T00:00:00Z");
    if (Number.isNaN(fumTime)) {
      setPrenatalFields((prev) => ({ ...prev, fum: fumValue }));
      return;
    }
    const now = new Date();
    const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.floor((todayUTC - fumTime) / 86400000);
    const weeks = Math.floor(diffDays / 7);
    const days = diffDays % 7;
    const fppDate = new Date(fumTime + 280 * 86400000)
      .toISOString()
      .slice(0, 10);
    setPrenatalFields((prev) => ({
      ...prev,
      fum: fumValue,
      sdg: diffDays >= 0 ? weeks + " semanas, " + days + " días" : "",
      fpp: fppDate,
    }));
  };

  const normalizedDiagnosisQuery = normalizeSearchText(diagnosisQuery.trim());
  const diagnosisResults = !normalizedDiagnosisQuery
    ? null
    : LOCAL_CIE10_RECORDS.filter(
        (entry) =>
          normalizeSearchText(entry.code).includes(normalizedDiagnosisQuery) ||
          normalizeSearchText(entry.description).includes(
            normalizedDiagnosisQuery,
          ),
      );
  const diagnosisResultLimit = 15;
  const diagnosisResultCount = diagnosisResults?.length ?? 0;
  const visibleDiagnosisResults =
    diagnosisResults?.slice(0, diagnosisResultLimit) ?? null;

  const weight =
    measurements.peso === "" ? Number.NaN : Number(measurements.peso);
  const heightInMeters =
    measurements.talla === "" ? Number.NaN : Number(measurements.talla) / 100;
  const bmi =
    Number.isFinite(weight) &&
    weight > 0 &&
    Number.isFinite(heightInMeters) &&
    heightInMeters > 0
      ? (weight / (heightInMeters * heightInMeters)).toFixed(1)
      : "";

  const generatedIndications = buildPatientIndications(
    selectedDiagnoses,
    clinicalFormat,
  );

  // Bloques de texto concatenados para las ventanas de Diabetes, Hipertensión y Control Prenatal
  const vitalsConcatenated = [
    measurements.presionSistolica && measurements.presionDiastolica
      ? "TA: " +
        measurements.presionSistolica +
        "/" +
        measurements.presionDiastolica +
        " mmHg"
      : "",
    measurements.frecuenciaCardiaca
      ? "FC: " + measurements.frecuenciaCardiaca + " lpm"
      : "",
    measurements.frecuenciaRespiratoria
      ? "FR: " + measurements.frecuenciaRespiratoria + " rpm"
      : "",
    measurements.temperatura
      ? "Temp: " + measurements.temperatura + " °C"
      : "",
    measurements.saturacionOxigeno
      ? "SpO2: " + measurements.saturacionOxigeno + "%"
      : "",
    measurements.peso ? "Peso: " + measurements.peso + " kg" : "",
    measurements.talla ? "Talla: " + measurements.talla + " cm" : "",
    bmi ? "IMC: " + bmi + " kg/m²" : "",
    measurements.glucosaCapilar
      ? "Glucosa capilar: " + measurements.glucosaCapilar + " mg/dL"
      : "",
  ]
    .filter(Boolean)
    .join(" | ");

  const antecedentsConcatenated =
    sexo === "masculino"
      ? antecedentsText
      : antecedentsText +
        "\n\nANTECEDENTES GINECOOBSTÉTRICOS:\n" +
        gynecologicText;

  const diagnosesConcatenated =
    selectedDiagnoses.length > 0
      ? selectedDiagnoses
          .map(
            (d) =>
              "- [" +
              (d.principal ? "PRINCIPAL" : "SECUNDARIO") +
              (d.chronic ? " / CRÓNICO" : "") +
              "] " +
              (d.manual ? d.manualCode || "S/C" : d.code) +
              ": " +
              d.description,
          )
          .join("\n")
      : "- Sin diagnósticos CIE-10 seleccionados.";

  const medicationsConcatenated =
    prescribedMedications.length > 0
      ? prescribedMedications
          .map(
            (m, i) =>
              i +
              1 +
              ". " +
              m.name +
              " (" +
              m.presentacion +
              ") — " +
              m.dosis +
              ", vía " +
              m.via +
              ", " +
              m.frecuencia +
              ", por " +
              m.duracion +
              " (Surtir: " +
              m.cantidad +
              ").",
          )
          .join("\n")
      : "- Sin medicamentos agregados.";

  const finalIndicationsText =
    (indicationsOverride ?? generatedIndications) ||
    "Medidas higiénico-dietéticas generales y datos de alarma comentados en consulta.";

  const doctorFooterConcatenated =
    "MÉDICO TRATANTE: " +
    professionalDetails.nombre +
    " | Céd. Prof.: " +
    professionalDetails.cedula +
    " | Matrícula: " +
    professionalDetails.matricula +
    " | Unidad: " +
    professionalDetails.unidad;

  // 1) FORMATO DIABETES MELLITUS (2 cuadros no modificables)
  const diabetesBox1 = [
    "=== CUADRO 1: DATOS DEL PACIENTE, SIGNOS VITALES, ANTECEDENTES, PADECIMIENTO ACTUAL Y PARACLÍNICOS ===",
    "PACIENTE: " + (patientIdentity || "No especificado"),
    "SIGNOS VITALES Y SOMATOMETRÍA: " +
      (vitalsConcatenated || "Sin registro"),
    "\nANTECEDENTES:\n" + antecedentsConcatenated,
    "\nPADECIMIENTO ACTUAL:\n" +
      (motivoPadecimiento || "Acude a control metabólico de Diabetes Mellitus."),
    "\nPARACLÍNICOS:\n" + (paraclinicosText || defaultParaclinicos),
    diabetesFields.glucosaAyuno ||
    diabetesFields.hba1c ||
    diabetesFields.tfge
      ? "Control glucémico/renal: Glucosa ayuno " +
        (diabetesFields.glucosaAyuno || "S/D") +
        " mg/dL | HbA1c " +
        (diabetesFields.hba1c || "S/D") +
        "% | TFGe " +
        (diabetesFields.tfge || "S/D")
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const diabetesBox2 = [
    "=== CUADRO 2: EXPLORACIÓN FÍSICA, DIAGNÓSTICOS, TRATAMIENTO, INDICACIONES Y MÉDICO ===",
    "EXPLORACIÓN FÍSICA:\n" + exploracion,
    "Revisión integral de pies: " + diabetesFields.revisionPies,
    "\nDIAGNÓSTICOS CIE-10:\n" + diagnosesConcatenated,
    "\nTRATAMIENTO MÉDICO:\n" + medicationsConcatenated,
    "\nINDICACIONES Y SIGNOS DE ALARMA:\n" + finalIndicationsText,
    "\nPRONÓSTICO: " + prognosis + " | SEGUIMIENTO: " + seguimientoText,
    "\n" + doctorFooterConcatenated,
  ].join("\n");

  // 2) FORMATO HIPERTENSIÓN ARTERIAL (3 cuadros no modificables)
  const htaBox1 = [
    "=== CUADRO 1: INFORMACIÓN DEL PACIENTE, ANTECEDENTES, PADECIMIENTO ACTUAL Y PARACLÍNICOS ===",
    "PACIENTE: " + (patientIdentity || "No especificado"),
    "\nANTECEDENTES:\n" + antecedentsConcatenated,
    "\nPADECIMIENTO ACTUAL:\n" +
      (motivoPadecimiento ||
        "Acude a control y seguimiento de Hipertensión Arterial Sistémica."),
    "\nPARACLÍNICOS:\n" + (paraclinicosText || defaultParaclinicos),
  ].join("\n");

  const htaBox2 = [
    "=== CUADRO 2: SIGNOS VITALES Y EXPLORACIÓN FÍSICA ===",
    "SIGNOS VITALES Y SOMATOMETRÍA: " +
      (vitalsConcatenated || "Sin registro"),
    htaFields.taDomiciliaria
      ? "Promedio TA domiciliaria: " + htaFields.taDomiciliaria
      : "",
    "\nEXPLORACIÓN FÍSICA:\n" + exploracion,
  ]
    .filter(Boolean)
    .join("\n");

  const htaBox3 = [
    "=== CUADRO 3: RESTO DE LA INFORMACIÓN DE LA CONSULTA ===",
    "Riesgo cardiovascular: " +
      htaFields.riesgoCardiovascular +
      " | Daño a órgano blanco: " +
      htaFields.danoOrganoBlanco,
    "Adherencia terapéutica: " + htaFields.adherencia,
    "\nDIAGNÓSTICOS CIE-10:\n" + diagnosesConcatenated,
    "\nTRATAMIENTO MÉDICO:\n" + medicationsConcatenated,
    "\nINDICACIONES Y SIGNOS DE ALARMA:\n" + finalIndicationsText,
    "\nPRONÓSTICO: " + prognosis + " | SEGUIMIENTO: " + seguimientoText,
    "\n" + doctorFooterConcatenated,
  ].join("\n");

  // 3) FORMATO CONTROL PRENATAL (1 solo cuadro no modificable con toda la información en orden)
  const prenatalSingleBox = [
    "=== NOTA INTEGRAL DE VIGILANCIA Y CONTROL PRENATAL ===",
    "FECHA: " + new Date().toLocaleDateString("es-MX"),
    "PACIENTE: " + (patientIdentity || "No especificado"),
    "SIGNOS VITALES Y SOMATOMETRÍA: " +
      (vitalsConcatenated || "Sin registro"),
    "CONTROL OBSTÉTRICO: FUM: " +
      (prenatalFields.fum || "S/D") +
      " | SDG: " +
      (prenatalFields.sdg || "S/D") +
      " | FPP: " +
      (prenatalFields.fpp || "S/D") +
      " | FCF: " +
      (prenatalFields.fcf || "S/D") +
      " lpm | Fondo Uterino: " +
      (prenatalFields.fondoUterino || "S/D") +
      " cm | Movimientos fetales: " +
      prenatalFields.movimientosFetales,
    "SIGNOS DE ALARMA OBSTÉTRICA: " + prenatalFields.signosAlarmaObstetrica,
    "\nANTECEDENTES:\n" + antecedentsConcatenated,
    "\nPADECIMIENTO ACTUAL:\n" +
      (motivoPadecimiento || "Acude a consulta de control prenatal."),
    "\nPARACLÍNICOS:\n" + (paraclinicosText || defaultParaclinicos),
    "\nEXPLORACIÓN FÍSICA:\n" + exploracion,
    "\nDIAGNÓSTICOS CIE-10:\n" + diagnosesConcatenated,
    "\nTRATAMIENTO Y SUPLEMENTACIÓN:\n" + medicationsConcatenated,
    "\nINDICACIONES Y SIGNOS DE ALARMA:\n" + finalIndicationsText,
    "\nPRONÓSTICO: " + prognosis + " | SEGUIMIENTO: " + seguimientoText,
    "\n" + doctorFooterConcatenated,
  ].join("\n");

  const copyTextHelper = (text: string, label: string) => {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopyFeedback(label + " copiado al portapapeles.");
      setTimeout(() => setCopyFeedback(""), 3500);
    } catch {
      // Ignorar
    }
  };

  const downloadNoteAsFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const openStandaloneBrowserPrintWindow = (
    title: string,
    boxes: { heading: string; content: string }[],
  ) => {
    const popup = window.open("", "_blank", "width=920,height=780");
    if (!popup) return;
    const escapedBoxes = boxes
      .map(
        (b) =>
          `<div style="margin-bottom:18px;">
            <h3 style="font-size:13px;color:#123C50;margin:0 0 6px 0;text-transform:uppercase;">${b.heading}</h3>
            <textarea readonly style="width:100%;min-height:190px;padding:12px;border:1.5px solid #123C50;border-radius:10px;font-family:monospace;font-size:12px;color:#123C50;background:#F8FBFA;white-space:pre-wrap;">${b.content.replace(/</g, "&lt;")}</textarea>
          </div>`,
      )
      .join("");
    popup.document.write(`<!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; color: #123C50; background: #F4F8F7; }
          .toolbar { display: flex; gap: 10px; margin-bottom: 18px; }
          button { background: #123C50; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: bold; cursor: pointer; }
          button.secondary { background: #18A69A; }
          @media print { .toolbar { display: none; } body { background: white; margin: 0; } }
        </style>
      </head>
      <body>
        <div class="toolbar">
          <button onclick="window.print()">Imprimir / Guardar PDF</button>
          <button class="secondary" onclick="window.close()">Cerrar ventana</button>
        </div>
        <h2 style="margin-top:0;">${title}</h2>
        ${escapedBoxes}
      </body>
      </html>`);
    popup.document.close();
  };

  const openOfficialClinicalFormatPrintWindow = (
    fmt: PrintableClinicalFormat,
  ) => {
    const popup = window.open("", "_blank", "width=960,height=780");
    if (!popup) return;
    popup.document.write(`<!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>${fmt.title} - TU SALUD DIGITAL</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 22px; color: #123C50; }
          .toolbar { display: flex; gap: 10px; margin-bottom: 14px; }
          button { background: #123C50; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: bold; cursor: pointer; }
          button.secondary { background: #18A69A; }
          .header { border-bottom: 2px solid #123C50; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; }
          @media print { .toolbar { display: none; } body { margin: 8px; } }
        </style>
      </head>
      <body>
        <div class="toolbar">
          <button onclick="window.print()">🖨 Imprimir Formato Oficial / Guardar PDF</button>
          <button class="secondary" onclick="window.close()">Cerrar ventana</button>
        </div>
        <div class="header">
          <div>
            <h2 style="margin:0;font-size:17px;">TU SALUD DIGITAL · ${fmt.title}</h2>
            <p style="margin:2px 0 0 0;font-size:11px;color:#18A69A;font-weight:bold;">${fmt.source}</p>
          </div>
          <div style="text-align:right;font-size:11px;">
            <strong>${professionalDetails.nombre}</strong> · Céd. ${professionalDetails.cedula}<br/>
            ${professionalDetails.unidad} · Fecha: ${new Date().toLocaleDateString("es-MX")}
          </div>
        </div>
        <p style="font-size:12px;margin:0 0 10px 0;"><strong>Paciente:</strong> ${patientIdentity || "____________________________________________"}</p>
        ${fmt.htmlBody}
      </body>
      </html>`);
    popup.document.close();
  };

  const measurementField = (
    label: string,
    name: string,
    unit: string,
    value = measurements[name],
    readOnly = false,
  ) => (
    <label key={name} className="block text-sm font-semibold text-[#123C50]">
      {label}
      <span className="mt-2 flex items-center gap-2">
        <input
          className={
            inputClassName + " mt-0 min-w-0 flex-1 px-2 py-1.5 text-sm"
          }
          name={name}
          type="number"
          inputMode="decimal"
          min="0"
          step="any"
          value={value}
          readOnly={readOnly}
          onChange={
            readOnly
              ? undefined
              : (event) => {
                  const nextValue = event.target.value;
                  if (nextValue !== "" && Number(nextValue) < 0) return;
                  setMeasurements((current) => ({
                    ...current,
                    [name]: nextValue,
                  }));
                }
          }
          aria-label={label + ", " + unit}
        />
        <span className="shrink-0 whitespace-nowrap text-[11px] font-medium text-slate-500">
          {unit}
        </span>
      </span>
    </label>
  );

  const addDiagnosis = (entry: Cie10Entry) => {
    setSelectedDiagnoses((current) => {
      if (current.some((diagnosis) => diagnosis.code === entry.code))
        return current;
      const isFirst = current.length === 0;
      return [...current, { ...entry, principal: isFirst, chronic: false }];
    });
  };

  const addManualDiagnosis = () => {
    const description = manualDiagnosisDescription.trim();
    if (!description) return;
    setSelectedDiagnoses((current) => [
      ...current,
      {
        code: "MANUAL-" + Date.now(),
        description,
        manual: true,
        manualCode: manualDiagnosisCode.trim(),
        principal: current.length === 0,
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

  const addMedicationToList = () => {
    const medName = selectedMedication.trim() || medicationQuery.trim();
    if (!medName) return;
    const newMed: PrescribedMedication = {
      id: Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      code: selectedMedicationCode || "S/C",
      name: medName,
      presentacion: medicationFields.presentacion || "Tableta / Envase",
      dosis: medicationFields.dosis || "1 unidad",
      via: medicationFields.via || "Oral",
      frecuencia: medicationFields.frecuencia || "Cada 12 horas",
      duracion: medicationFields.duracion || "30 días",
      cantidad: medicationFields.cantidad || "1 envase",
      repeticiones: medicationFields.repeticiones || "0",
    };
    setPrescribedMedications((current) => [...current, newMed]);
    setMedicationQuery("");
    setSelectedMedication("");
    setSelectedMedicationCode("");
    setMedicationFields({
      presentacion: "",
      dosis: "",
      via: "",
      frecuencia: "",
      duracion: "",
      cantidad: "",
      repeticiones: "",
    });
  };

  const removeMedicationFromList = (id: string) => {
    setPrescribedMedications((current) =>
      current.filter((item) => item.id !== id),
    );
  };

  const finishAndClearConsultation = () => {
    setFinalized(false);
    setCorrectionMode(false);
    setPatientIdentity("");
    setSexo("");
    setMeasurements({
      presionSistolica: "",
      presionDiastolica: "",
      frecuenciaCardiaca: "",
      frecuenciaRespiratoria: "",
      temperatura: "",
      saturacionOxigeno: "",
      peso: "",
      talla: "",
      glucosaCapilar: "",
      perimetroAbdominal: "",
    });
    setAntecedentsText(defaultAntecedents);
    setGynecologicText(defaultGynecologic);
    setMotivoPadecimiento("");
    setParaclinicosText(defaultParaclinicos);
    setExploracion(defaultPhysicalExamText);
    setSelectedDiagnoses([]);
    setPrescribedMedications([]);
    setIndicationsOverride(null);
    setManualQrCodeInput("");
    setQrStatus("");
    setSaveMessage(
      "Consulta finalizada y limpiada. No se almacenó ningún dato del paciente; hoja lista para el siguiente paciente.",
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      setQrStatus(
        "El código ingresado no tiene el formato temporal ESD1 válido. Pídele al paciente que lo genere en /pacientes/qr.",
      );
      return;
    }
    setQrStatus("Consultando código temporal del paciente…");
    try {
      const response = await fetch("/api/temporary-transfers/consume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const result = (await response.json()) as {
        data?: PatientTransfer;
        error?: string;
      };
      if (!response.ok || !result.data)
        throw new Error(result.error ?? "No se pudo consultar el código.");
      const data = result.data;
      const born = new Date(data.fechaNacimiento + "T00:00:00");
      const today = new Date();
      let age = today.getFullYear() - born.getFullYear();
      if (
        today.getMonth() < born.getMonth() ||
        (today.getMonth() === born.getMonth() &&
          today.getDate() < born.getDate())
      )
        age -= 1;
      const sexLabel: Record<PatientTransfer["sexo"], string> = {
        femenino: "Femenino",
        masculino: "Masculino",
        otro: "Otro",
        "sin-especificar": "Sin especificar",
      };
      setPatientIdentity(
        [
          "Nombre: " + data.nombre,
          "Fecha de nacimiento: " + data.fechaNacimiento,
          "Edad: " + age + " años",
          "Sexo: " + sexLabel[data.sexo],
        ].join(", "),
      );
      setSexo(data.sexo);
      setMeasurements((current) => ({
        ...current,
        ...(data.pesoKg !== null ? { peso: String(data.pesoKg) } : {}),
        ...(data.tallaCm !== null ? { talla: String(data.tallaCm) } : {}),
      }));
      const defaultValue = "Interrogados y negados";
      setAntecedentsText(
        [
          "Antecedentes heredofamiliares: " + defaultValue,
          "Antecedentes personales patológicos: " +
            (data.enfermedadesCronicas || defaultValue),
          "Antecedentes personales no patológicos: " + defaultValue,
          "Alergias: " + (data.alergias || defaultValue),
          "Medicamentos actuales: " + (data.medicamentosActuales || defaultValue),
          "Antecedentes quirúrgicos: " + (data.cirugias || defaultValue),
          "Toxicomanías: " + defaultValue,
        ].join("\n"),
      );
      setGynecologicText(
        data.antecedentesGinecoobstetricos || defaultGynecologic,
      );
      setQrStatus(
        "Datos del paciente precargados con éxito (Presencial / Telemedicina). El código de un solo uso ya fue destruido por seguridad.",
      );
      stopQrReader();
    } catch (error) {
      setQrStatus(
        error instanceof Error
          ? error.message
          : "No se pudo leer el código temporal.",
      );
      stopQrReader();
    }
  };

  const startQrReader = async () => {
    const Detector = (
      window as Window & { BarcodeDetector?: QrDetectorConstructor }
    ).BarcodeDetector;
    if (!Detector) {
      setQrStatus(
        "Tu navegador actual no soporta escaneo directo por cámara; pega el código ESD1 del paciente en la casilla de Telemedicina a un lado.",
      );
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !qrVideoRef.current) {
      setQrStatus(
        "No se puede acceder a la cámara. Revisa el permiso del navegador o pega el código ESD1 manualmente.",
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      qrStreamRef.current = stream;
      qrVideoRef.current.srcObject = stream;
      await qrVideoRef.current.play();
      const detector = new Detector({ formats: ["qr_code"] });
      setQrScanning(true);
      setQrStatus("Apunta la cámara al QR temporal del paciente.");

      const scan = async () => {
        const video = qrVideoRef.current;
        if (!qrStreamRef.current || !video) return;
        try {
          const detected = await detector.detect(video);
          if (detected.length) {
            void applyMeasurementQr(detected[0].rawValue);
            return;
          }
          qrFrameRef.current = requestAnimationFrame(() => {
            void scan();
          });
        } catch {
          stopQrReader();
          setQrStatus(
            "No se pudo enfocar el QR. Intenta de nuevo o pega el código ESD1 manualmente.",
          );
        }
      };
      qrFrameRef.current = requestAnimationFrame(() => {
        void scan();
      });
    } catch {
      stopQrReader();
      setQrStatus("Permiso de cámara denegado o cámara no disponible.");
    }
  };

  const currentSidebarCalc = SIDEBAR_CALCULATORS[activeSidebarCalcId];
  const sidebarCalcResult = (() => {
    if (!currentSidebarCalc) return null;
    const allFilled = currentSidebarCalc.fields.every((f) => {
      if (f.kind === "checkbox") return true;
      const v = sidebarCalcInputs[f.key];
      return v !== undefined && v !== "";
    });
    if (!allFilled) return null;
    try {
      return currentSidebarCalc.calculate(sidebarCalcInputs);
    } catch {
      return null;
    }
  })();

  const filteredMedications = medicationQuery.trim()
    ? imssMedicationsCatalog.filter((item) =>
        normalizeSearchText(item.name + " " + item.code).includes(
          normalizeSearchText(medicationQuery.trim()),
        ),
      )
    : [];

  // PANTALLA 1: INICIO DE SESIÓN Y REGISTRO DE MÉDICO
  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-[#F4F8F7] p-4 text-[#123C50]">
        <div className="w-full max-w-md overflow-hidden rounded-3xl border border-[#DCE9E6] bg-white shadow-xl">
          <div className="bg-gradient-to-r from-[#123C50] to-[#18A69A] px-6 py-6 text-white">
            <div className="flex items-center gap-3.5">
              <BrandLogo size="lg" />
              <div>
                <h1 className="text-xl font-black tracking-tight text-white">
                  TU <span className="font-semibold text-[#A9F0E8]">SALUD DIGITAL</span>
                </h1>
                <p className="text-xs font-semibold text-white/90">
                  Versión para Profesionales · Consulta Externa
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-[#F4F8F7] p-1">
              <button
                type="button"
                onClick={() => {
                  setAuthTab("login");
                  setAuthError("");
                }}
                className={
                  "rounded-lg py-2 text-xs font-extrabold transition " +
                  (authTab === "login"
                    ? "bg-[#123C50] text-white shadow-sm"
                    : "text-[#123C50] hover:bg-[#E9F4F2]")
                }
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab("register");
                  setAuthError("");
                }}
                className={
                  "rounded-lg py-2 text-xs font-extrabold transition " +
                  (authTab === "register"
                    ? "bg-[#18A69A] text-white shadow-sm"
                    : "text-[#123C50] hover:bg-[#E9F4F2]")
                }
              >
                Registro de Médico
              </button>
            </div>

            {authError && (
              <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                {authError}
              </p>
            )}

            {authTab === "login" ? (
              <form onSubmit={handleLoginSubmit} className="mt-4 space-y-3.5">
                <Field
                  label="Correo electrónico o Matrícula IMSS"
                  name="loginEmail"
                  placeholder="medico@imss.gob.mx"
                  value={authEmail}
                  onChange={setAuthEmail}
                />
                <Field
                  label="Contraseña"
                  name="loginPassword"
                  type="password"
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={setAuthPassword}
                />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#18A69A] py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-[#123C50]"
                >
                  Entrar a Hoja de Consulta
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="mt-4 space-y-3">
                <p className="rounded-xl bg-[#F4F8F7] p-2.5 text-xs text-slate-600">
                  Tus datos se precargarán automáticamente en todas tus notas médicas y recetas:
                </p>
                {DOCTOR_PROFILE_FIELDS.map((item) => (
                  <Field
                    key={item.key}
                    label={item.label}
                    name={item.name}
                    placeholder={item.label}
                    value={professionalDetails[item.key]}
                    onChange={(val) =>
                      setProfessionalDetails((prev) => ({
                        ...prev,
                        [item.key]: val,
                      }))
                    }
                  />
                ))}
                <Field
                  label="Correo electrónico"
                  name="registerEmail"
                  type="email"
                  placeholder="medico@imss.gob.mx"
                  value={authEmail}
                  onChange={setAuthEmail}
                />
                <Field
                  label="Crear contraseña"
                  name="registerPassword"
                  type="password"
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={setAuthPassword}
                />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#123C50] py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-[#18A69A]"
                >
                  Registrarme y Precargar mis Datos
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#F4F8F7] text-[#123C50]">
      <header className="sticky top-0 z-20 border-b border-[#DCE9E6] bg-white/95 px-3 py-2.5 shadow-sm backdrop-blur print:hidden sm:px-5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <BrandLogo size="md" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-base font-black tracking-tight text-[#123C50] sm:text-lg">
                  TU <span className="text-[#18A69A]">SALUD DIGITAL</span>
                </h1>
                <span className="rounded-full bg-[#E9F4F2] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#16877F]">
                  Versión para Profesionales · Consulta Externa
                </span>
              </div>
              <p className="truncate text-xs font-medium text-slate-500">
                {professionalDetails.nombre} · Céd. {professionalDetails.cedula} ·{" "}
                {professionalDetails.unidad}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setSidebarOpen((open) => !open)}
              className="flex items-center gap-1.5 rounded-xl bg-[#18A69A] px-3.5 py-2 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#123C50]"
            >
              <span>{sidebarOpen ? "Ocultar Barra →" : "☰ Herramientas y Formatos"}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveWindow("herramientas")}
              title="Personalizar Herramientas"
              className="rounded-xl border border-[#DCE9E6] bg-[#F8FBFA] px-2.5 py-2 text-xs font-bold text-[#123C50] transition hover:border-[#18A69A] hover:bg-[#E9F4F2]"
            >
              ⚙ Herramientas
            </button>
            <button
              type="button"
              onClick={() => setActiveWindow("perfil")}
              title="Personalizar Perfil del Médico"
              className="rounded-xl border border-[#DCE9E6] bg-[#F8FBFA] px-2.5 py-2 text-xs font-bold text-[#123C50] transition hover:border-[#18A69A] hover:bg-[#E9F4F2]"
            >
              👤 Perfil
            </button>
            <button
              type="button"
              onClick={handleLogout}
              title="Cerrar Sesión"
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-2.5 py-3 sm:px-4 sm:py-5">
        <form
          ref={formRef}
          className="space-y-4"
          onSubmit={(event) => event.preventDefault()}
        >
          <fieldset
            disabled={finalized && !correctionMode}
            className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-12"
          >
            <section
              id="datos-paciente"
              className={sectionClassName + " xl:col-span-5"}
            >
              <SectionHeading
                number="01"
                variant="teal"
                note="Escanea el QR del paciente o pega su código ESD1 de Telemedicina."
              >
                Datos del Paciente y QR
              </SectionHeading>

              <div className="mb-3 space-y-2.5 rounded-xl border border-[#DCE9E6] bg-[#F4F8FD] p-3 print:hidden">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#2456C7]">
                    Conexión Paciente (QR / Remoto)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (qrScanning) {
                          stopQrReader();
                        } else {
                          startQrReader();
                        }
                      }}
                      className="rounded-lg bg-[#2456C7] px-2.5 py-1 text-[11px] font-bold text-white shadow-sm transition hover:bg-[#123C50]"
                    >
                      {qrScanning ? "Detener cámara" : "📷 Escanear QR"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        window.open("/pacientes/qr", "_blank", "noopener,noreferrer");
                      }}
                      className="rounded-lg border border-[#DCE9E6] bg-white px-2.5 py-1 text-[11px] font-bold text-[#16877F] hover:bg-[#E9F4F2]"
                    >
                      Link QR ↗
                    </button>
                  </div>
                </div>

                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={manualQrCodeInput}
                    onChange={(e) => setManualQrCodeInput(e.target.value)}
                    placeholder="Pegar código ESD1... (Telemedicina)"
                    className="min-w-0 flex-1 rounded-lg border border-[#DCE9E6] bg-white px-2.5 py-1.5 text-xs text-[#123C50] outline-none focus:border-[#18A69A]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      applyMeasurementQr(manualQrCodeInput);
                    }}
                    className="shrink-0 rounded-lg bg-[#123C50] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#18A69A]"
                  >
                    Cargar
                  </button>
                </div>

                <div id="qr-lectura" aria-live="polite">
                  <video
                    ref={qrVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={
                      "max-h-40 w-full rounded-lg bg-black object-contain " +
                      (qrScanning ? "block" : "hidden")
                    }
                  />
                  {qrStatus && (
                    <p
                      className="mt-1 text-xs font-semibold text-[#123C50]"
                      role="status"
                    >
                      {qrStatus}
                    </p>
                  )}
                </div>
              </div>

              <label
                className="block text-xs font-bold uppercase tracking-wide text-[#123C50]"
                htmlFor="identificacionPaciente"
              >
                Nombre, Edad, NSS / Folio y Sexo
                <textarea
                  id="identificacionPaciente"
                  className={inputClassName + " resize-y"}
                  name="identificacionPaciente"
                  rows={3}
                  value={patientIdentity}
                  onChange={(event) => {
                    const value = event.target.value;
                    setPatientIdentity(value);
                    const normalized = normalizeSearchText(value);
                    if (/\bmasculino\b|\bhombre\b/.test(normalized))
                      setSexo("masculino");
                    else if (/\bfemenino\b|\bmujer\b/.test(normalized))
                      setSexo("femenino");
                  }}
                  placeholder="Ej. María González Ruiz, 54 años, NSS 1234-56-7890-1, Femenino"
                />
              </label>
            </section>

            <section
              id="signos-vitales"
              className={sectionClassName + " xl:col-span-7"}
            >
              <SectionHeading
                number="02"
                variant="navy"
                note="El IMC se calcula automáticamente al ingresar Peso y Talla."
              >
                Signos Vitales y Somatometría
              </SectionHeading>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5">
                {measurementField("TA Sistólica", "presionSistolica", "mmHg")}
                {measurementField("TA Diastólica", "presionDiastolica", "mmHg")}
                {measurementField("Frec. Cardiaca", "frecuenciaCardiaca", "lpm")}
                {measurementField(
                  "Frec. Resp.",
                  "frecuenciaRespiratoria",
                  "rpm",
                )}
                {measurementField("Temperatura", "temperatura", "°C")}
                {measurementField("SpO2", "saturacionOxigeno", "%")}
                {measurementField("Peso", "peso", "kg")}
                {measurementField("Talla", "talla", "cm")}
                {measurementField("IMC (Auto)", "imc", "kg/m²", bmi, true)}
                {measurementField("Glucosa cap.", "glucosaCapilar", "mg/dL")}
              </div>
            </section>

            {clinicalFormat === "diabetes" && (
              <section className={sectionClassName + " xl:col-span-12"}>
                <SectionHeading
                  number="DM2"
                  variant="teal"
                  note="Parámetros adicionales para la Hoja de Control de Diabetes Mellitus."
                >
                  Control Metabólico: Diabetes Mellitus
                </SectionHeading>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  <Field
                    label="Glucosa plasmática en ayuno (mg/dL)"
                    name="dmGlucosaAyuno"
                    value={diabetesFields.glucosaAyuno}
                    onChange={(v) =>
                      setDiabetesFields((p) => ({ ...p, glucosaAyuno: v }))
                    }
                  />
                  <Field
                    label="Hemoglobina Glucosilada HbA1c (%)"
                    name="dmHba1c"
                    value={diabetesFields.hba1c}
                    onChange={(v) =>
                      setDiabetesFields((p) => ({ ...p, hba1c: v }))
                    }
                  />
                  <Field
                    label="TFGe CKD-EPI (mL/min/1.73m²)"
                    name="dmTfge"
                    value={diabetesFields.tfge}
                    onChange={(v) =>
                      setDiabetesFields((p) => ({ ...p, tfge: v }))
                    }
                  />
                  <div className="sm:col-span-3">
                    <Field
                      label="Exploración de pies (pulsos pedios, monofilamento, sensibilidad)"
                      name="dmPies"
                      value={diabetesFields.revisionPies}
                      onChange={(v) =>
                        setDiabetesFields((p) => ({ ...p, revisionPies: v }))
                      }
                    />
                  </div>
                </div>
              </section>
            )}

            {clinicalFormat === "hipertension" && (
              <section className={sectionClassName + " xl:col-span-12"}>
                <SectionHeading
                  number="HTA"
                  variant="navy"
                  note="Parámetros adicionales para la Hoja de Control de Hipertensión Arterial."
                >
                  Control Cardiovascular: Hipertensión Arterial
                </SectionHeading>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <Field
                    label="Promedio de bitácora de TA domiciliaria (mmHg)"
                    name="htaBitacora"
                    placeholder="Ej. 125/78 mmHg"
                    value={htaFields.taDomiciliaria}
                    onChange={(v) =>
                      setHtaFields((p) => ({ ...p, taDomiciliaria: v }))
                    }
                  />
                  <Field
                    label="Riesgo cardiovascular estimado"
                    name="htaRiesgo"
                    value={htaFields.riesgoCardiovascular}
                    onChange={(v) =>
                      setHtaFields((p) => ({ ...p, riesgoCardiovascular: v }))
                    }
                  />
                  <Field
                    label="Interrogatorio de daño a órgano blanco"
                    name="htaOrganoBlanco"
                    value={htaFields.danoOrganoBlanco}
                    onChange={(v) =>
                      setHtaFields((p) => ({ ...p, danoOrganoBlanco: v }))
                    }
                  />
                  <Field
                    label="Adherencia y tolerancia a antihipertensivos"
                    name="htaAdherencia"
                    value={htaFields.adherencia}
                    onChange={(v) =>
                      setHtaFields((p) => ({ ...p, adherencia: v }))
                    }
                  />
                </div>
              </section>
            )}

            {clinicalFormat === "prenatal" && (
              <section className={sectionClassName + " xl:col-span-12"}>
                <SectionHeading
                  number="CPN"
                  variant="blue"
                  note="Ingresa la FUM para calcular automáticamente Semanas de Gestación (SDG) y Fecha Probable de Parto (FPP)."
                >
                  Vigilancia Materno-Fetal: Control Prenatal
                </SectionHeading>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-4">
                  <Field
                    label="Fecha de Última Menstruación (FUM)"
                    name="cpnFum"
                    type="date"
                    value={prenatalFields.fum}
                    onChange={handleFumChange}
                  />
                  <Field
                    label="Semanas de Gestación (SDG)"
                    name="cpnSdg"
                    value={prenatalFields.sdg}
                    onChange={(v) =>
                      setPrenatalFields((p) => ({ ...p, sdg: v }))
                    }
                  />
                  <Field
                    label="Fecha Probable de Parto (FPP)"
                    name="cpnFpp"
                    value={prenatalFields.fpp}
                    onChange={(v) =>
                      setPrenatalFields((p) => ({ ...p, fpp: v }))
                    }
                  />
                  <Field
                    label="Frecuencia Cardiaca Fetal (lpm)"
                    name="cpnFcf"
                    placeholder="Ej. 145 lpm"
                    value={prenatalFields.fcf}
                    onChange={(v) =>
                      setPrenatalFields((p) => ({ ...p, fcf: v }))
                    }
                  />
                  <Field
                    label="Fondo Uterino AFU (cm)"
                    name="cpnAfu"
                    placeholder="Ej. 24 cm"
                    value={prenatalFields.fondoUterino}
                    onChange={(v) =>
                      setPrenatalFields((p) => ({ ...p, fondoUterino: v }))
                    }
                  />
                  <Field
                    label="Movimientos fetales"
                    name="cpnMovimientos"
                    value={prenatalFields.movimientosFetales}
                    onChange={(v) =>
                      setPrenatalFields((p) => ({
                        ...p,
                        movimientosFetales: v,
                      }))
                    }
                  />
                  <div className="sm:col-span-2">
                    <Field
                      label="Signos de alarma obstétrica"
                      name="cpnAlarma"
                      value={prenatalFields.signosAlarmaObstetrica}
                      onChange={(v) =>
                        setPrenatalFields((p) => ({
                          ...p,
                          signosAlarmaObstetrica: v,
                        }))
                      }
                    />
                  </div>
                </div>
              </section>
            )}

            <section
              id="antecedentes"
              className={sectionClassName + " xl:col-span-6"}
            >
              <SectionHeading
                number="03"
                variant="teal"
                note="Plantilla precargada editable; se actualiza automáticamente al leer el QR."
              >
                Antecedentes Personales y Familiares
              </SectionHeading>
              <textarea
                id="antecedentes-unificados"
                className={inputClassName + " resize-y"}
                name="antecedentes"
                rows={7}
                value={antecedentsText}
                onChange={(event) => setAntecedentsText(event.target.value)}
              />
            </section>

            <section
              id="antecedentes-gineco"
              className={sectionClassName + " xl:col-span-6"}
            >
              <SectionHeading
                number="03B"
                variant="teal"
                note="Se desactiva automáticamente cuando el paciente es masculino."
              >
                Antecedentes Ginecoobstétricos
              </SectionHeading>
              <textarea
                id="antecedentes-gineco-unificados"
                className={inputClassName + " resize-y"}
                name="antecedentesGinecoobstetricos"
                rows={7}
                value={gynecologicText}
                onChange={(event) => setGynecologicText(event.target.value)}
                disabled={sexo === "masculino"}
              />
            </section>

            <section
              id="motivo-consulta"
              className={sectionClassName + " xl:col-span-6"}
            >
              <SectionHeading
                number="04"
                variant="teal"
                note="Motivo de consulta, inicio, evolución y sintomatología actual."
              >
                Padecimiento Actual
              </SectionHeading>
              <textarea
                className={inputClassName + " resize-y"}
                name="motivoPadecimientoActual"
                rows={5}
                value={motivoPadecimiento}
                onChange={(e) => setMotivoPadecimiento(e.target.value)}
                placeholder="Describe el cuadro clínico y evolución del paciente..."
              />
            </section>

            <section
              id="paraclinicos"
              className={sectionClassName + " xl:col-span-6"}
            >
              <SectionHeading
                number="05"
                variant="teal"
                note="Precargado como «Sin paraclínicos que comentar»."
              >
                Paraclínicos y Escalas
              </SectionHeading>
              <textarea
                className={inputClassName + " resize-y"}
                name="paraclinicos"
                rows={5}
                value={paraclinicosText}
                onChange={(e) => setParaclinicosText(e.target.value)}
              />
            </section>

            <section
              id="exploracion-fisica"
              className={sectionClassName + " xl:col-span-12"}
            >
              <SectionHeading
                number="06"
                variant="teal"
                note="Incluye al final «Resto de exploración en apariencia normal.»"
              >
                Exploración Física
              </SectionHeading>
              <textarea
                id="exploracion-completa"
                name="exploracionFisica"
                rows={7}
                value={exploracion}
                onChange={(event) => setExploracion(event.target.value)}
                className={inputClassName + " resize-y"}
              />
            </section>

            <section
              id="diagnosticos"
              className={sectionClassName + " xl:col-span-6"}
            >
              <SectionHeading
                number="07"
                variant="navy"
                note="Busca por clave o padecimiento en el catálogo CIE-10 o agrégalo manualmente."
              >
                Diagnósticos CIE-10
              </SectionHeading>

              <label
                htmlFor="cie10-search"
                className="block text-sm font-semibold text-[#123C50]"
              >
                Buscar por código CIE-10 o nombre del padecimiento
                <input
                  ref={diagnosisSearchField}
                  id="cie10-search"
                  type="search"
                  value={diagnosisQuery}
                  onChange={(event) => setDiagnosisQuery(event.target.value)}
                  placeholder="Ej. E11, I10, diabetes, hipertensión, embarazo, faringitis..."
                  className={inputClassName}
                />
              </label>

              {normalizedDiagnosisQuery && diagnosisResults?.length === 0 && (
                <div className="mt-3 rounded-xl bg-[#F4F8F7] p-3">
                  <p className="text-xs text-slate-600">
                    Sin coincidencias exactas en CIE-10. Puedes agregarlo
                    manualmente:
                  </p>
                  {manualDiagnosisOpen && (
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <input
                        value={manualDiagnosisCode}
                        onChange={(e) => setManualDiagnosisCode(e.target.value)}
                        className={inputClassName}
                        placeholder="Código CIE-10 (opcional)"
                      />
                      <input
                        value={manualDiagnosisDescription}
                        onChange={(e) =>
                          setManualDiagnosisDescription(e.target.value)
                        }
                        className={inputClassName}
                        placeholder="Nombre del diagnóstico"
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (manualDiagnosisOpen) addManualDiagnosis();
                      else {
                        setManualDiagnosisDescription(diagnosisQuery.trim());
                        setManualDiagnosisOpen(true);
                      }
                    }}
                    className="mt-2 rounded-lg border border-[#18A69A] px-3 py-1.5 text-xs font-bold text-[#123C50]"
                  >
                    {manualDiagnosisOpen
                      ? "Confirmar diagnóstico manual"
                      : "+ Agregar como diagnóstico manual"}
                  </button>
                </div>
              )}

              {visibleDiagnosisResults && diagnosisResultCount > 0 && (
                <div className="mt-3 max-h-60 space-y-2 overflow-y-auto rounded-xl border border-[#DCE9E6] p-2">
                  {visibleDiagnosisResults.map((entry) => {
                    const alreadySelected = selectedDiagnoses.some(
                      (diagnosis) => diagnosis.code === entry.code,
                    );
                    return (
                      <div
                        key={entry.code}
                        className="flex items-center justify-between gap-2 rounded-lg border border-[#E9F4F2] px-3 py-2 text-xs sm:text-sm"
                      >
                        <span>
                          <strong>{entry.code}</strong> · {entry.description}
                        </span>
                        <button
                          type="button"
                          disabled={alreadySelected}
                          onClick={() => addDiagnosis(entry)}
                          className="shrink-0 rounded-lg bg-[#E9F4F2] px-3 py-1 font-bold text-[#123C50] hover:bg-[#18A69A] hover:text-white disabled:opacity-50"
                        >
                          {alreadySelected ? "Agregado" : "+ Agregar"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-4">
                <h3 className="text-sm font-bold text-[#123C50]">
                  Diagnósticos seleccionados ({selectedDiagnoses.length})
                </h3>
                {selectedDiagnoses.length === 0 ? (
                  <p className="mt-2 rounded-xl border border-dashed border-[#B8D2CE] bg-[#F8FBFA] p-3 text-xs text-slate-500">
                    Ningún diagnóstico seleccionado aún.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {selectedDiagnoses.map((diagnosis) => (
                      <li
                        key={diagnosis.code}
                        className="rounded-xl border border-[#DCE9E6] bg-[#F8FBFA] p-3 text-xs sm:text-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span>
                            <strong>
                              {diagnosis.manual
                                ? diagnosis.manualCode || "MANUAL"
                                : diagnosis.code}
                            </strong>{" "}
                            · {diagnosis.description}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeDiagnosis(diagnosis.code)}
                            className="font-bold text-rose-700 hover:underline"
                          >
                            Quitar ×
                          </button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-4 border-t border-[#DCE9E6] pt-2 text-xs">
                          <label className="flex items-center gap-1.5 font-semibold">
                            <input
                              type="radio"
                              name="diagnostico-principal"
                              checked={diagnosis.principal}
                              onChange={() =>
                                setPrincipalDiagnosis(diagnosis.code)
                              }
                            />
                            Principal
                          </label>
                          <label className="flex items-center gap-1.5">
                            <input
                              type="checkbox"
                              checked={diagnosis.chronic}
                              onChange={() =>
                                toggleChronicDiagnosis(diagnosis.code)
                              }
                            />
                            Crónico
                          </label>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <section
              id="tratamiento-farmacologico"
              className={sectionClassName + " xl:col-span-6"}
            >
              <SectionHeading
                number="08"
                variant="navy"
                note="Selecciona medicamentos del Cuadro Básico IMSS y agrégalos uno por uno."
              >
                Tratamiento Médico (Uno por Uno)
              </SectionHeading>

              <label
                htmlFor="buscar-medicamento"
                className="block text-sm font-semibold text-[#123C50]"
              >
                Buscar medicamento por nombre o clave IMSS
                <input
                  id="buscar-medicamento"
                  type="search"
                  value={medicationQuery}
                  onChange={(event) => {
                    setMedicationQuery(event.target.value);
                    setSelectedMedication(event.target.value);
                  }}
                  className={inputClassName}
                  placeholder="Ej. Metformina, Losartán, Enalapril, Insulina, Paracetamol, Ácido fólico..."
                />
              </label>

              {filteredMedications.length > 0 && (
                <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-[#DCE9E6] bg-white">
                  {filteredMedications.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => {
                        setSelectedMedication(item.name);
                        setSelectedMedicationCode(item.code);
                        setMedicationQuery(item.name);
                        setMedicationFields({
                          presentacion: item.presentation,
                          dosis: item.dose,
                          via: item.route,
                          frecuencia: item.frequency,
                          duracion: item.duration,
                          cantidad: item.quantity,
                          repeticiones: "0",
                        });
                      }}
                      className="block w-full border-b border-[#E9F4F2] px-3 py-2 text-left text-xs hover:bg-[#F4F8FD] sm:text-sm"
                    >
                      <strong>{item.name}</strong>
                      <span className="ml-2 text-slate-500">
                        Clave {item.code} · {item.presentation}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {(selectedMedication || medicationQuery.trim()) && (
                <div className="mt-3 space-y-3 rounded-xl border border-[#18A69A] bg-[#F8FBFA] p-3">
                  <p className="text-xs font-extrabold uppercase text-[#16877F]">
                    Configurar posología para:{" "}
                    {selectedMedication || medicationQuery}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Field
                      label="Presentación"
                      name="medPresentacion"
                      value={medicationFields.presentacion}
                      onChange={(v) =>
                        setMedicationFields((c) => ({ ...c, presentacion: v }))
                      }
                    />
                    <Field
                      label="Dosis / Posología"
                      name="medDosis"
                      value={medicationFields.dosis}
                      onChange={(v) =>
                        setMedicationFields((c) => ({ ...c, dosis: v }))
                      }
                    />
                    <Field
                      label="Vía de administración"
                      name="medVia"
                      value={medicationFields.via}
                      onChange={(v) =>
                        setMedicationFields((c) => ({ ...c, via: v }))
                      }
                    />
                    <Field
                      label="Frecuencia / Horario"
                      name="medFrecuencia"
                      value={medicationFields.frecuencia}
                      onChange={(v) =>
                        setMedicationFields((c) => ({ ...c, frecuencia: v }))
                      }
                    />
                    <Field
                      label="Duración del tratamiento"
                      name="medDuracion"
                      value={medicationFields.duracion}
                      onChange={(v) =>
                        setMedicationFields((c) => ({ ...c, duracion: v }))
                      }
                    />
                    <Field
                      label="Cantidad a surtir"
                      name="medCantidad"
                      value={medicationFields.cantidad}
                      onChange={(v) =>
                        setMedicationFields((c) => ({ ...c, cantidad: v }))
                      }
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addMedicationToList}
                    className="w-full rounded-xl bg-[#18A69A] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#123C50]"
                  >
                    + Agregar este medicamento a la Receta
                  </button>
                </div>
              )}

              <div className="mt-4">
                <h3 className="text-sm font-bold text-[#123C50]">
                  Medicamentos en la receta actual (
                  {prescribedMedications.length})
                </h3>
                {prescribedMedications.length === 0 ? (
                  <p className="mt-2 rounded-xl border border-dashed border-[#B8D2CE] bg-[#F8FBFA] p-3 text-xs text-slate-500">
                    Busca un medicamento arriba y presiona «+ Agregar este
                    medicamento a la Receta» para ir armando tu lista uno por
                    uno.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {prescribedMedications.map((med, idx) => (
                      <li
                        key={med.id}
                        className="flex flex-col justify-between gap-2 rounded-xl border border-[#DCE9E6] bg-white p-3 text-xs sm:flex-row sm:items-center sm:text-sm"
                      >
                        <div>
                          <p className="font-bold text-[#123C50]">
                            {idx + 1}. {med.name}{" "}
                            <span className="font-normal text-slate-500">
                              ({med.presentacion})
                            </span>
                          </p>
                          <p className="mt-0.5 text-slate-600">
                            <strong>Indicaciones:</strong> {med.dosis} · Vía{" "}
                            {med.via} · {med.frecuencia} · durante{" "}
                            {med.duracion} ({med.cantidad})
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMedicationFromList(med.id)}
                          className="self-start rounded-lg px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-50 sm:self-center"
                        >
                          Quitar ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <section
              id="indicaciones"
              className={sectionClassName + " xl:col-span-8"}
            >
              <SectionHeading
                number="09"
                variant="teal"
                note="Indicaciones higiénico-dietéticas y signos de alarma editables."
              >
                Indicaciones Médicas y Signos de Alarma
              </SectionHeading>
              <textarea
                id="indicaciones-paciente"
                name="indicaciones"
                rows={6}
                value={indicationsOverride ?? generatedIndications}
                onChange={(event) => setIndicationsOverride(event.target.value)}
                placeholder="Indicaciones higiénico-dietéticas, cuidados generales y datos de alarma..."
                className={inputClassName + " resize-y"}
              />
              {indicationsOverride !== null && (
                <button
                  type="button"
                  onClick={() => setIndicationsOverride(null)}
                  className="mt-2 text-xs font-semibold text-[#16877F] underline"
                >
                  Restablecer indicaciones automáticas del formato
                </button>
              )}
            </section>

            <section
              id="pronostico"
              className={sectionClassName + " xl:col-span-4"}
            >
              <SectionHeading
                number="10"
                variant="teal"
                note="Pronóstico clínico y próxima cita."
              >
                Pronóstico y Seguimiento
              </SectionHeading>
              <label className="block text-sm font-semibold text-[#123C50]">
                Pronóstico para la vida y la función
                <select
                  className={inputClassName}
                  name="pronostico"
                  value={prognosis}
                  onChange={(event) => setPrognosis(event.target.value)}
                >
                  {[
                    "Bueno para la vida y la función",
                    "Reservado a evolución",
                    "Favorable",
                    "Desfavorable",
                    "Malo",
                  ].map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
              <div className="mt-3">
                <Field
                  label="Próxima cita / Seguimiento"
                  name="seguimiento"
                  value={seguimientoText}
                  onChange={setSeguimientoText}
                />
              </div>
            </section>

            <section
              id="datos-medico"
              className={sectionClassName + " xl:col-span-12"}
            >
              <SectionHeading
                number="11"
                variant="navy"
                note="Datos precargados automáticamente desde tu registro profesional."
              >
                Datos del Médico Registrado
              </SectionHeading>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#DCE9E6] bg-[#F8FBFA] p-3.5 text-xs sm:text-sm">
                <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                  <div>
                    <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Médico Tratante
                    </span>
                    <strong className="text-[#123C50]">
                      {professionalDetails.nombre}
                    </strong>
                  </div>
                  <div>
                    <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Cédula Profesional
                    </span>
                    <strong className="text-[#123C50]">
                      {professionalDetails.cedula}
                    </strong>
                  </div>
                  <div>
                    <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Matrícula IMSS
                    </span>
                    <strong className="text-[#123C50]">
                      {professionalDetails.matricula}
                    </strong>
                  </div>
                  <div>
                    <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Unidad Médica
                    </span>
                    <strong className="text-[#123C50]">
                      {professionalDetails.unidad}
                    </strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveWindow("perfil")}
                  className="rounded-xl border border-[#18A69A] bg-white px-3 py-1.5 text-xs font-extrabold text-[#123C50] transition hover:bg-[#E9F4F2] print:hidden"
                >
                  Editar perfil
                </button>
              </div>
            </section>
          </fieldset>

          <div className="sticky bottom-2 z-10 rounded-2xl border border-[#DCE9E6] bg-white/95 p-3 shadow-lg backdrop-blur print:hidden sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveWindow("receta")}
                  className="rounded-full bg-[#18A69A] px-5 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#148B80] sm:text-sm"
                >
                  Generar Receta
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-full border-2 border-[#123C50] bg-white px-5 py-2 text-xs font-extrabold text-[#123C50] transition hover:bg-[#F4F8F7] sm:text-sm"
                >
                  Imprimir
                </button>
              </div>

              <button
                type="button"
                onClick={finishAndClearConsultation}
                className="rounded-full bg-[#123C50] px-5 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-rose-800 sm:text-sm"
              >
                Finalizar Consulta
              </button>
            </div>

            {saveMessage && (
              <p
                className="mt-2 text-xs font-semibold text-[#16877F]"
                role="status"
              >
                {saveMessage}
              </p>
            )}
          </div>
        </form>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 print:hidden" id="clinical-sidebar">
          <button
            type="button"
            aria-label="Cerrar barra lateral"
            onClick={() => setSidebarOpen(false)}
            className="absolute inset-0 bg-slate-900/25"
          />
          <aside
            className="absolute inset-y-0 right-0 w-[min(25rem,94vw)] overflow-y-auto border-l border-[#DCE9E6] bg-white p-4 shadow-2xl sm:p-5"
            aria-label="Barra lateral de herramientas y formatos clínicos"
          >
            <div className="mb-4 flex items-center justify-between border-b border-[#E9F4F2] pb-3">
              <div>
                <h2 className="text-base font-extrabold text-[#123C50] sm:text-lg">
                  Barra Lateral de Consulta
                </h2>
                <p className="text-xs text-slate-500">
                  Formatos para imprimir, calculadoras y biblioteca
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg bg-[#F4F8F7] px-3 py-1.5 text-xs font-bold text-[#123C50]"
              >
                Contraer ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-[#DCE9E6] bg-[#F8FBFA] p-3.5">
                <p className="text-xs font-extrabold uppercase tracking-wide text-[#123C50]">
                  Formatos de Exportación e Impresión
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Abre la ventana lista para imprimir o copiar por bloques según el programa institucional:
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setClinicalFormat("diabetes");
                      setActiveWindow("diabetes");
                    }}
                    className="flex w-full items-center justify-between rounded-xl bg-[#18A69A] px-3.5 py-2.5 text-left text-xs font-extrabold text-white shadow-sm transition hover:opacity-95"
                  >
                    <span>Diabetes Mellitus (2 cuadros)</span>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px]">
                      Abrir ↗
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setClinicalFormat("hipertension");
                      setActiveWindow("hipertension");
                    }}
                    className="flex w-full items-center justify-between rounded-xl bg-[#E05A6D] px-3.5 py-2.5 text-left text-xs font-extrabold text-white shadow-sm transition hover:opacity-95"
                  >
                    <span>Hipertensión Arterial (3 cuadros)</span>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px]">
                      Abrir ↗
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setClinicalFormat("prenatal");
                      setActiveWindow("prenatal");
                    }}
                    className="flex w-full items-center justify-between rounded-xl bg-[#F29D4B] px-3.5 py-2.5 text-left text-xs font-extrabold text-white shadow-sm transition hover:opacity-95"
                  >
                    <span>Control Prenatal (1 cuadro)</span>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px]">
                      Abrir ↗
                    </span>
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-[#18A69A] bg-[#F4F8F7] p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-[#16877F]">
                    Calculadora clínica rápida
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveWindow("herramientas")}
                    className="text-[11px] font-bold text-[#123C50] underline"
                  >
                    Personalizar lista
                  </button>
                </div>
                <select
                  value={activeSidebarCalcId}
                  onChange={(e) => {
                    setActiveSidebarCalcId(e.target.value);
                    setSidebarCalcInputs({});
                  }}
                  className="mt-1.5 w-full rounded-lg border border-[#DCE9E6] bg-white px-3 py-2 text-xs font-bold text-[#123C50]"
                >
                  {Object.entries(SIDEBAR_CALCULATORS)
                    .filter(([id]) => enabledCalcIds.includes(id))
                    .map(([id, calc]) => (
                      <option key={id} value={id}>
                        {calc.title}
                      </option>
                    ))}
                </select>

                {currentSidebarCalc && (
                  <div className="mt-3 space-y-2.5">
                    {currentSidebarCalc.fields.map((f) => {
                      if (f.kind === "select" && f.options) {
                        return (
                          <label
                            key={f.key}
                            className="block text-xs font-semibold text-[#123C50]"
                          >
                            {f.label}
                            <select
                              value={sidebarCalcInputs[f.key] || ""}
                              onChange={(e) =>
                                setSidebarCalcInputs((prev) => ({
                                  ...prev,
                                  [f.key]: e.target.value,
                                }))
                              }
                              className="mt-1 w-full rounded-lg border border-[#DCE9E6] bg-white px-2.5 py-1.5 text-xs"
                            >
                              <option value="">Selecciona...</option>
                              {f.options.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </label>
                        );
                      }
                      if (f.kind === "checkbox") {
                        return (
                          <label
                            key={f.key}
                            className="flex items-center gap-2 text-xs font-semibold text-[#123C50]"
                          >
                            <input
                              type="checkbox"
                              checked={sidebarCalcInputs[f.key] === "true"}
                              onChange={(e) =>
                                setSidebarCalcInputs((prev) => ({
                                  ...prev,
                                  [f.key]: e.target.checked ? "true" : "false",
                                }))
                              }
                            />
                            {f.label}
                          </label>
                        );
                      }
                      return (
                        <label
                          key={f.key}
                          className="block text-xs font-semibold text-[#123C50]"
                        >
                          {f.label} {f.unit ? "(" + f.unit + ")" : ""}
                          <input
                            type={f.kind === "date" ? "date" : "number"}
                            step={f.step ?? "any"}
                            value={sidebarCalcInputs[f.key] || ""}
                            onChange={(e) =>
                              setSidebarCalcInputs((prev) => ({
                                ...prev,
                                [f.key]: e.target.value,
                              }))
                            }
                            className="mt-1 w-full rounded-lg border border-[#DCE9E6] bg-white px-2.5 py-1.5 text-xs"
                          />
                        </label>
                      );
                    })}

                    {sidebarCalcResult && (
                      <div className="rounded-lg border border-[#18A69A] bg-white p-2.5">
                        <p className="text-xs font-extrabold text-[#123C50]">
                          Resultado: {sidebarCalcResult}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setParaclinicosText((prev) =>
                              !prev || prev.trim() === defaultParaclinicos
                                ? "• " + sidebarCalcResult
                                : prev + "\n• " + sidebarCalcResult,
                            );
                            if (activeSidebarCalcId === "ckd-epi-2021") {
                              setDiabetesFields((prev) => ({
                                ...prev,
                                tfge: sidebarCalcResult,
                              }));
                            }
                          }}
                          className="mt-2 w-full rounded-lg bg-[#123C50] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#18A69A]"
                        >
                          + Insertar resultado en Paraclínicos
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* FORMATOS OFICIALES IMPRIMIBLES: PERCENTILES CDC, BITÁCORA TA Y AUTOMONITOREO GLUCOSA */}
              <div className="rounded-2xl border border-[#DCE9E6] bg-[#F8FBFA] p-3.5">
                <p className="text-xs font-extrabold uppercase tracking-wide text-[#123C50]">
                  Formatos y Tablas Oficiales Imprimibles
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Estándares internacionales CDC/OMS, AHA/ESC y ADA listos para imprimir:
                </p>

                <select
                  value={activePrintableFormatId}
                  onChange={(e) => setActivePrintableFormatId(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-[#DCE9E6] bg-white px-3 py-2 text-xs font-bold text-[#123C50]"
                >
                  {PRINTABLE_CLINICAL_FORMATS.map((fmt) => (
                    <option key={fmt.id} value={fmt.id}>
                      {fmt.title}
                    </option>
                  ))}
                </select>

                {(() => {
                  const currentFormatDoc =
                    PRINTABLE_CLINICAL_FORMATS.find(
                      (f) => f.id === activePrintableFormatId,
                    ) || PRINTABLE_CLINICAL_FORMATS[0];
                  return (
                    <div className="mt-2.5 rounded-xl border border-[#DCE9E6] bg-white p-3">
                      <p className="text-xs font-extrabold text-[#123C50]">
                        {currentFormatDoc.title}
                      </p>
                      <p className="mt-0.5 text-[11px] font-semibold text-[#18A69A]">
                        Fuente: {currentFormatDoc.source}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-600">
                        {currentFormatDoc.subtitle}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          openOfficialClinicalFormatPrintWindow(
                            currentFormatDoc,
                          )
                        }
                        className="mt-2.5 w-full rounded-xl bg-[#123C50] px-3 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-[#18A69A]"
                      >
                        🖨 Abrir e Imprimir {currentFormatDoc.title} ↗
                      </button>
                    </div>
                  );
                })()}
              </div>

              <details
                open
                className="rounded-xl border border-[#DCE9E6] px-4 py-3"
              >
                <summary className="cursor-pointer text-sm font-bold text-[#123C50]">
                  Vademécum Cuadro Básico IMSS y Biblioteca
                </summary>
                <div className="mt-2 space-y-1.5 text-xs">
                  <a
                    href="https://www.imss.gob.mx/sites/all/statics/pdf/cuadros-basicos/Grupo-N5-Endocrinologia-y-Metabolismo-R.pdf"
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-lg px-2 py-1.5 font-semibold text-[#16877F] hover:bg-[#E9F4F2]"
                  >
                    Cuadro Básico IMSS · Endocrinología (Diabetes) ↗
                  </a>
                  <a
                    href="https://www.imss.gob.mx/sites/all/statics/pdf/cuadros-basicos/Grupo-N3-Cardiologia-R.pdf"
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-lg px-2 py-1.5 font-semibold text-[#16877F] hover:bg-[#E9F4F2]"
                  >
                    Cuadro Básico IMSS · Cardiología (Hipertensión) ↗
                  </a>
                  <a
                    href="https://www.imss.gob.mx/sites/all/statics/pdf/cuadros-basicos/Grupo-N9-Gineco-Obstetricia-R.pdf"
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-lg px-2 py-1.5 font-semibold text-[#16877F] hover:bg-[#E9F4F2]"
                  >
                    Cuadro Básico IMSS · Gineco-Obstetricia ↗
                  </a>
                </div>
              </details>
            </div>
          </aside>
        </div>
      )}

      {/* VENTANA EMERGENTE: VISTA PREVIA E IMPRESIÓN DE DIABETES (2 CUADROS NO MODIFICABLES) */}
      {activeWindow === "diabetes" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-6">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border-2 border-[#123C50] bg-white p-4 shadow-2xl sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DCE9E6] pb-3 print:hidden">
              <div>
                <h2 className="text-lg font-extrabold text-[#123C50]">
                  VISTA PREVIA DE IMPRESIÓN · FORMATO DIABETES MELLITUS
                </h2>
                <p className="text-xs text-slate-500">
                  Información concatenada en 2 cuadros de texto no modificables
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-xl bg-[#123C50] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#18A69A]"
                >
                  🖨 Imprimir
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadNoteAsFile(
                      "nota-diabetes.txt",
                      diabetesBox1 + "\n\n" + diabetesBox2,
                    )
                  }
                  className="rounded-xl bg-[#18A69A] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#148B80]"
                >
                  💾 Guardar archivo
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openStandaloneBrowserPrintWindow(
                      "Nota Médica - Diabetes Mellitus",
                      [
                        {
                          heading:
                            "Cuadro 1: Datos del Paciente, Signos Vitales, Antecedentes, Padecimiento Actual y Paraclínicos",
                          content: diabetesBox1,
                        },
                        {
                          heading:
                            "Cuadro 2: Exploración Física, Diagnósticos, Tratamiento, Indicaciones y Médico",
                          content: diabetesBox2,
                        },
                      ],
                    )
                  }
                  className="rounded-xl border border-[#2456C7] bg-white px-3 py-2 text-xs font-bold text-[#2456C7]"
                >
                  Abrir en pestaña independiente ↗
                </button>
                <button
                  type="button"
                  onClick={() => setActiveWindow(null)}
                  className="rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700"
                >
                  Cerrar ✕
                </button>
              </div>
            </div>

            {copyFeedback && (
              <p className="mt-3 rounded-lg bg-[#E9F4F2] px-3 py-1.5 text-xs font-bold text-[#16877F] print:hidden">
                {copyFeedback}
              </p>
            )}

            <div className="mt-4 space-y-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-extrabold uppercase text-[#123C50]">
                    Cuadro 1 (No modificable): Datos del paciente, Signos
                    vitales, Antecedentes, Padecimiento actual y Paraclínicos
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      copyTextHelper(diabetesBox1, "Cuadro 1 de Diabetes")
                    }
                    className="rounded-lg bg-[#E9F4F2] px-2.5 py-1 text-xs font-bold text-[#123C50] hover:bg-[#18A69A] hover:text-white print:hidden"
                  >
                    Copiar Cuadro 1
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={10}
                  value={diabetesBox1}
                  className="w-full rounded-xl border-2 border-[#123C50] bg-[#F8FBFA] p-3 font-mono text-xs leading-relaxed text-[#123C50] outline-none"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-extrabold uppercase text-[#123C50]">
                    Cuadro 2 (No modificable): Resto de los datos (Exploración
                    física, Diagnósticos, Tratamiento, Indicaciones y Médico)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      copyTextHelper(diabetesBox2, "Cuadro 2 de Diabetes")
                    }
                    className="rounded-lg bg-[#E9F4F2] px-2.5 py-1 text-xs font-bold text-[#123C50] hover:bg-[#18A69A] hover:text-white print:hidden"
                  >
                    Copiar Cuadro 2
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={10}
                  value={diabetesBox2}
                  className="w-full rounded-xl border-2 border-[#123C50] bg-[#F8FBFA] p-3 font-mono text-xs leading-relaxed text-[#123C50] outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VENTANA EMERGENTE: VISTA PREVIA E IMPRESIÓN DE HIPERTENSIÓN (3 CUADROS NO MODIFICABLES) */}
      {activeWindow === "hipertension" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-6">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border-2 border-[#123C50] bg-white p-4 shadow-2xl sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DCE9E6] pb-3 print:hidden">
              <div>
                <h2 className="text-lg font-extrabold text-[#123C50]">
                  VISTA PREVIA DE IMPRESIÓN · FORMATO HIPERTENSIÓN ARTERIAL
                </h2>
                <p className="text-xs text-slate-500">
                  Información dividida en 3 cuadros de texto no modificables
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-xl bg-[#123C50] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#18A69A]"
                >
                  🖨 Imprimir
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadNoteAsFile(
                      "nota-hipertension.txt",
                      htaBox1 + "\n\n" + htaBox2 + "\n\n" + htaBox3,
                    )
                  }
                  className="rounded-xl bg-[#18A69A] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#148B80]"
                >
                  💾 Guardar archivo
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openStandaloneBrowserPrintWindow(
                      "Nota Médica - Hipertensión Arterial",
                      [
                        {
                          heading:
                            "Cuadro 1: Información del Paciente, Antecedentes, Padecimiento Actual y Paraclínicos",
                          content: htaBox1,
                        },
                        {
                          heading:
                            "Cuadro 2: Signos Vitales y Exploración Física",
                          content: htaBox2,
                        },
                        {
                          heading:
                            "Cuadro 3: Resto de la Exploración, Diagnósticos, Tratamiento e Indicaciones",
                          content: htaBox3,
                        },
                      ],
                    )
                  }
                  className="rounded-xl border border-[#2456C7] bg-white px-3 py-2 text-xs font-bold text-[#2456C7]"
                >
                  Abrir en pestaña independiente ↗
                </button>
                <button
                  type="button"
                  onClick={() => setActiveWindow(null)}
                  className="rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700"
                >
                  Cerrar ✕
                </button>
              </div>
            </div>

            {copyFeedback && (
              <p className="mt-3 rounded-lg bg-[#E9F4F2] px-3 py-1.5 text-xs font-bold text-[#16877F] print:hidden">
                {copyFeedback}
              </p>
            )}

            <div className="mt-4 space-y-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-extrabold uppercase text-[#123C50]">
                    Cuadro 1 (No modificable): Información del paciente,
                    Antecedentes, Padecimiento actual y Paraclínicos
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      copyTextHelper(htaBox1, "Cuadro 1 de Hipertensión")
                    }
                    className="rounded-lg bg-[#E9F4F2] px-2.5 py-1 text-xs font-bold text-[#123C50] hover:bg-[#18A69A] hover:text-white print:hidden"
                  >
                    Copiar Cuadro 1
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={7}
                  value={htaBox1}
                  className="w-full rounded-xl border-2 border-[#123C50] bg-[#F8FBFA] p-3 font-mono text-xs leading-relaxed text-[#123C50] outline-none"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-extrabold uppercase text-[#123C50]">
                    Cuadro 2 (No modificable): Signos vitales y Exploración
                    física
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      copyTextHelper(htaBox2, "Cuadro 2 de Hipertensión")
                    }
                    className="rounded-lg bg-[#E9F4F2] px-2.5 py-1 text-xs font-bold text-[#123C50] hover:bg-[#18A69A] hover:text-white print:hidden"
                  >
                    Copiar Cuadro 2
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={8}
                  value={htaBox2}
                  className="w-full rounded-xl border-2 border-[#123C50] bg-[#F8FBFA] p-3 font-mono text-xs leading-relaxed text-[#123C50] outline-none"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-extrabold uppercase text-[#123C50]">
                    Cuadro 3 (No modificable): Resto de la información
                    (Diagnósticos, Tratamiento, Indicaciones y Médico)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      copyTextHelper(htaBox3, "Cuadro 3 de Hipertensión")
                    }
                    className="rounded-lg bg-[#E9F4F2] px-2.5 py-1 text-xs font-bold text-[#123C50] hover:bg-[#18A69A] hover:text-white print:hidden"
                  >
                    Copiar Cuadro 3
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={7}
                  value={htaBox3}
                  className="w-full rounded-xl border-2 border-[#123C50] bg-[#F8FBFA] p-3 font-mono text-xs leading-relaxed text-[#123C50] outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VENTANA EMERGENTE: VISTA PREVIA E IMPRESIÓN DE CONTROL PRENATAL (1 CUADRO NO MODIFICABLE) */}
      {activeWindow === "prenatal" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-6">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border-2 border-[#123C50] bg-white p-4 shadow-2xl sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DCE9E6] pb-3 print:hidden">
              <div>
                <h2 className="text-lg font-extrabold text-[#123C50]">
                  VISTA PREVIA DE IMPRESIÓN · HOJA DE CONTROL PRENATAL
                </h2>
                <p className="text-xs text-slate-500">
                  Toda la información en orden en un solo cuadro de texto no
                  modificable
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-xl bg-[#123C50] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#18A69A]"
                >
                  🖨 Imprimir
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadNoteAsFile(
                      "nota-control-prenatal.txt",
                      prenatalSingleBox,
                    )
                  }
                  className="rounded-xl bg-[#18A69A] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#148B80]"
                >
                  💾 Guardar archivo
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openStandaloneBrowserPrintWindow(
                      "Nota Médica - Control Prenatal",
                      [
                        {
                          heading:
                            "Cuadro Único: Nota Integral de Control Prenatal en Orden",
                          content: prenatalSingleBox,
                        },
                      ],
                    )
                  }
                  className="rounded-xl border border-[#2456C7] bg-white px-3 py-2 text-xs font-bold text-[#2456C7]"
                >
                  Abrir en pestaña independiente ↗
                </button>
                <button
                  type="button"
                  onClick={() => setActiveWindow(null)}
                  className="rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700"
                >
                  Cerrar ✕
                </button>
              </div>
            </div>

            {copyFeedback && (
              <p className="mt-3 rounded-lg bg-[#E9F4F2] px-3 py-1.5 text-xs font-bold text-[#16877F] print:hidden">
                {copyFeedback}
              </p>
            )}

            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-extrabold uppercase text-[#123C50]">
                  Cuadro Único (No modificable): Nota de Control Prenatal
                  Completa en Orden
                </label>
                <button
                  type="button"
                  onClick={() =>
                    copyTextHelper(prenatalSingleBox, "Nota Prenatal")
                  }
                  className="rounded-lg bg-[#E9F4F2] px-2.5 py-1 text-xs font-bold text-[#123C50] hover:bg-[#18A69A] hover:text-white print:hidden"
                >
                  Copiar Nota Completa
                </button>
              </div>
              <textarea
                readOnly
                rows={18}
                value={prenatalSingleBox}
                className="w-full rounded-xl border-2 border-[#123C50] bg-[#F8FBFA] p-3 font-mono text-xs leading-relaxed text-[#123C50] outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* VENTANA EMERGENTE EXCLUSIVA DE RECETA MÉDICA LISTA PARA IMPRIMIR O GUARDAR */}
      {activeWindow === "receta" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-6">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border-2 border-[#123C50] bg-white p-5 shadow-2xl sm:p-7">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#DCE9E6] pb-3 print:hidden">
              <div>
                <h2 className="text-lg font-extrabold text-[#123C50]">
                  VENTANA DE IMPRESIÓN · RECETA MÉDICA INDIVIDUAL
                </h2>
                <p className="text-xs text-slate-500">
                  Versión exclusiva de la receta con datos del paciente y del
                  médico precargados
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-xl bg-[#123C50] px-4 py-2 text-xs font-bold text-white hover:bg-[#18A69A]"
                >
                  🖨 Imprimir Receta / PDF
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadNoteAsFile(
                      "receta-medica.txt",
                      [
                        "RECETA MÉDICA - " + professionalDetails.unidad,
                        "Fecha: " + new Date().toLocaleDateString("es-MX"),
                        "Médico: " +
                          professionalDetails.nombre +
                          " | Céd. Prof.: " +
                          professionalDetails.cedula +
                          " | Matrícula: " +
                          professionalDetails.matricula,
                        "Paciente: " + (patientIdentity || "No especificado"),
                        "Signos Vitales: " +
                          (vitalsConcatenated || "Sin registro"),
                        "\nMEDICAMENTOS PRESCRITOS:\n" +
                          medicationsConcatenated,
                        "\nINDICACIONES PARA EL PACIENTE:\n" +
                          finalIndicationsText,
                      ].join("\n"),
                    )
                  }
                  className="rounded-xl bg-[#18A69A] px-4 py-2 text-xs font-bold text-white hover:bg-[#148B80]"
                >
                  💾 Guardar Receta
                </button>
                <button
                  type="button"
                  onClick={() => setActiveWindow(null)}
                  className="rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700"
                >
                  Cerrar ✕
                </button>
              </div>
            </div>

            <div className="rounded-xl border-2 border-[#123C50] bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-[#123C50] pb-3">
                <div>
                  <h3 className="text-xl font-extrabold text-[#123C50]">
                    RECETA MÉDICA
                  </h3>
                  <p className="text-xs font-semibold text-[#16877F]">
                    {professionalDetails.unidad}
                  </p>
                  <p className="text-xs text-slate-500">
                    Fecha de expedición:{" "}
                    {new Date().toLocaleDateString("es-MX")}
                  </p>
                </div>
                <div className="text-right text-xs text-[#123C50]">
                  <p className="text-sm font-extrabold">
                    {professionalDetails.nombre}
                  </p>
                  <p>
                    <strong>Cédula Profesional:</strong>{" "}
                    {professionalDetails.cedula}
                  </p>
                  <p>
                    <strong>Matrícula:</strong> {professionalDetails.matricula}
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-lg bg-[#F8FBFA] p-3 text-xs sm:text-sm">
                <p>
                  <strong>Datos del Paciente:</strong>{" "}
                  {patientIdentity || "________________________________"}
                </p>
                <p className="mt-1">
                  <strong>Somatometría y Signos Vitales:</strong>{" "}
                  {vitalsConcatenated || "Sin signos vitales registrados"}
                </p>
                {selectedDiagnoses.length > 0 && (
                  <p className="mt-1">
                    <strong>Diagnóstico(s):</strong>{" "}
                    {selectedDiagnoses
                      .map((d) => d.code + " " + d.description)
                      .join("; ")}
                  </p>
                )}
              </div>

              <div className="mt-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#123C50]">
                  Rp. Prescripción Farmacológica:
                </h4>
                {prescribedMedications.length === 0 ? (
                  <p className="mt-2 text-xs italic text-slate-500">
                    No se han agregado medicamentos a la receta.
                  </p>
                ) : (
                  <ol className="mt-2 list-decimal space-y-2 pl-5 text-xs sm:text-sm">
                    {prescribedMedications.map((m) => (
                      <li key={m.id} className="border-b border-[#E9F4F2] pb-1.5">
                        <strong>{m.name}</strong> ({m.presentacion})
                        <br />
                        <span>
                          Dosis: {m.dosis} · Vía: {m.via} · Frecuencia:{" "}
                          {m.frecuencia} · Duración: {m.duracion} · Cantidad a
                          surtir: {m.cantidad}.
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              <div className="mt-4 border-t border-[#DCE9E6] pt-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#123C50]">
                  Indicaciones no farmacológicas y signos de alarma:
                </h4>
                <p className="mt-1 whitespace-pre-wrap text-xs sm:text-sm">
                  {finalIndicationsText}
                </p>
              </div>

              <div className="mt-8 border-t border-[#DCE9E6] pt-4 text-center text-xs text-[#123C50]">
                <p className="font-bold">
                  __________________________________________
                </p>
                <p className="font-extrabold">{professionalDetails.nombre}</p>
                <p>
                  Céd. Prof. {professionalDetails.cedula} · Matrícula{" "}
                  {professionalDetails.matricula}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA PERSONALIZAR EL PERFIL DEL MÉDICO */}
      {activeWindow === "perfil" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#A9CFF0] bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E9F4F2] pb-3">
              <h2 className="text-base font-extrabold text-[#123C50]">
                Personalizar Perfil del Médico
              </h2>
              <button
                type="button"
                onClick={() => setActiveWindow(null)}
                className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold"
              >
                Cerrar ✕
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Tus datos quedan guardados en tu sesión y aparecen precargados en
              la Hoja de Consulta y en la Receta Médica:
            </p>
            <div className="mt-3 space-y-3">
              {DOCTOR_PROFILE_FIELDS.map((fieldItem) => (
                <Field
                  key={fieldItem.key}
                  label={fieldItem.label}
                  name={fieldItem.name}
                  value={professionalDetails[fieldItem.key]}
                  onChange={(val) =>
                    setProfessionalDetails((prev) => ({
                      ...prev,
                      [fieldItem.key]: val,
                    }))
                  }
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setActiveWindow(null)}
              className="mt-4 w-full rounded-xl bg-[#18A69A] py-2.5 text-sm font-extrabold text-white hover:bg-[#123C50]"
            >
              Guardar y Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MODAL PARA PERSONALIZAR LAS HERRAMIENTAS DE LA BARRA LATERAL */}
      {activeWindow === "herramientas" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#A9CFF0] bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E9F4F2] pb-3">
              <h2 className="text-base font-extrabold text-[#123C50]">
                Personalizar Herramientas de la Barra Lateral
              </h2>
              <button
                type="button"
                onClick={() => setActiveWindow(null)}
                className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold"
              >
                Cerrar ✕
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Marca las calculadoras médicas que utilizas en tu consulta para
              que aparezcan en tu barra lateral:
            </p>
            <div className="mt-3 space-y-2">
              {Object.entries(SIDEBAR_CALCULATORS).map(([id, calc]) => (
                <label
                  key={id}
                  className="flex cursor-pointer items-center justify-between rounded-xl border border-[#DCE9E6] bg-[#F8FBFA] px-3 py-2 text-xs font-bold text-[#123C50]"
                >
                  <span>{calc.title}</span>
                  <input
                    type="checkbox"
                    checked={enabledCalcIds.includes(id)}
                    onChange={() => toggleCalculatorTool(id)}
                  />
                </label>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setActiveWindow(null)}
              className="mt-4 w-full rounded-xl bg-[#123C50] py-2.5 text-sm font-extrabold text-white hover:bg-[#18A69A]"
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
