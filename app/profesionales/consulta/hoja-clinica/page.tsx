"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "../../../../components/BrandLogo";
import {
  imssMedicationsCatalog,
  RECETA_DRAFT_STORAGE_KEY,
  type ImssMedication,
  type RecetaDraft,
} from "../../../../lib/imss-medications";
import {
  readProfessionalProfile,
  saveProfessionalProfile,
} from "../../../../lib/professional-profile";

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
  exploracionPersonalizada: string;
  pacientePlantilla: string;
  padecimientoPlantilla: string;
  ginecoPlantilla: string;
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
  historialTemporal?: {
    fecha: string;
    diagnostico: string;
    tratamiento: string;
    atendidoPor: string;
  }[];
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
  | "general"
  | "receta"
  | "perfil"
  | "herramientas"
  | "qr";

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
      <h3 style="font-size:13px;background:#0F2D3D;color:white;padding:6px 10px;border-radius:6px;margin:10px 0 6px 0;">
        1. Referencia Rápida de Peso (kg) y Longitud/Talla (cm) — 0 a 5 Años (OMS / CDC)
      </h3>
      <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:12px;">
        <thead>
          <tr style="background:#EAF4F1;color:#0F2D3D;">
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

      <h3 style="font-size:13px;background:#0D9488;color:white;padding:6px 10px;border-radius:6px;margin:10px 0 6px 0;">
        2. Percentiles de Peso, Talla e IMC por Edad — 6 a 16 Años (CDC NCHS)
      </h3>
      <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:12px;">
        <thead>
          <tr style="background:#EAF4F1;color:#0F2D3D;">
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
      <div style="border:1px solid #0D9488;background:#F6FAF8;padding:10px;border-radius:8px;font-size:11px;margin-bottom:12px;">
        <strong>Instrucciones internacionales (AHA / ESC) para medir su presión arterial en casa:</strong><br/>
        1. Repose sentado durante <strong>5 minutos</strong> antes de la medición, con la espalda apoyada, pies sobre el piso sin cruzar las piernas y brazo apoyado a la altura del corazón.<br/>
        2. No fume, no tome café/refresco ni haga ejercicio 30 minutos antes; acuda al baño previamente.<br/>
        3. Realice <strong>2 mediciones por la mañana</strong> (antes del desayuno y de sus medicamentos) y <strong>2 por la noche</strong> (antes de la cena), separadas por 1 minuto. Meta habitual en casa: <strong>&lt;135/85 mmHg</strong> (en consultorio &lt;140/90 o &lt;130/80 mmHg según indicación médica).
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:11px;">
        <thead>
          <tr style="background:#0F2D3D;color:white;">
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
      <div style="border:1px solid #0D9488;background:#F6FAF8;padding:10px;border-radius:8px;font-size:11px;margin-bottom:12px;">
        <strong>Metas internacionales de control glucémico (ADA / GPC IMSS):</strong><br/>
        • <strong>Glucosa en ayuno o antes de las comidas (Preprandial):</strong> 80 a 130 mg/dL.<br/>
        • <strong>Glucosa 2 horas después de iniciar los alimentos (Posprandial):</strong> Menor a 180 mg/dL.<br/>
        • <strong>En embarazo (Diabetes Gestacional):</strong> Ayuno &lt;95 mg/dL · 1 hora posprandial &lt;140 mg/dL · 2 horas posprandial &lt;120 mg/dL.<br/>
        • <strong>Hipoglucemia (&lt;70 mg/dL):</strong> Si presenta temblor o sudoración fría, tome 15 g de carbohidrato simple y repita la toma en 15 minutos.
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:11px;">
        <thead>
          <tr style="background:#0F2D3D;color:white;">
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
  "mt-1.5 w-full rounded-xl border border-[#D6E6E1] bg-white px-3.5 py-2 text-sm text-[#0F2D3D] outline-none transition placeholder:text-slate-400 focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

const sectionClassName =
  "overflow-hidden rounded-2xl border border-[#D6E6E1] bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5";

const defaultParaclinicos = "Sin paraclínicos que comentar";

const defaultRegisteredDoctor: ProfessionalDetails = {
  nombre: "Dr. Ángel de Dios",
  cedula: "12345678",
  matricula: "99887766",
  unidad: "UMF No. 1 · IMSS",
  exploracionPersonalizada: "",
  pacientePlantilla: "",
  padecimientoPlantilla: "",
  ginecoPlantilla: "",
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

// Catálogo de medicamentos importado desde lib/imss-medications.ts

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
    <label className="block text-sm font-semibold text-[#0F2D3D]">
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
    teal: "bg-[#0D9488] text-white",
    navy: "bg-[#0F2D3D] text-white",
    blue: "bg-[#0284C7] text-white",
  }[variant];

  return (
    <div className="-mx-4 -mt-4 mb-4 border-b border-[#D6E6E1] sm:-mx-5 sm:-mt-5">
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
  const router = useRouter();
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
  const [vademecumQuery, setVademecumQuery] = useState("");
  const [selectedVademecumMed, setSelectedVademecumMed] =
    useState<ImssMedication | null>(null);
  const [enabledPrintableFormatIds, setEnabledPrintableFormatIds] = useState<
    string[]
  >(() => PRINTABLE_CLINICAL_FORMATS.map((f) => f.id));
  const [customPrintableLinks, setCustomPrintableLinks] = useState<
    { id: string; title: string; url: string }[]
  >([]);
  const [editingPrintableTables, setEditingPrintableTables] = useState(false);
  const [newTableTitle, setNewTableTitle] = useState("");
  const [newTableUrl, setNewTableUrl] = useState("");
  const [copyFeedback, setCopyFeedback] = useState("");

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
  const [gynecologicText, setGynecologicText] = useState("");
  const [ginecoDisabled, setGinecoDisabled] = useState(false);
  const [activeSidebarSection, setActiveSidebarSection] = useState<
    "formatos" | "calculadoras" | "vademecum" | "tablas" | null
  >(null);
  const [activeSheetTab, setActiveSheetTab] = useState<
    "paciente" | "gineco" | "exploracion" | "cie10" | "recomendaciones"
  >("paciente");
  const [diabetesBox1Override, setDiabetesBox1Override] = useState<
    string | null
  >(null);
  const [diabetesBox2Override, setDiabetesBox2Override] = useState<
    string | null
  >(null);
  const [htaBox1Override, setHtaBox1Override] = useState<string | null>(null);
  const [htaBox2Override, setHtaBox2Override] = useState<string | null>(null);
  const [htaBox3Override, setHtaBox3Override] = useState<string | null>(null);
  const [prenatalBoxOverride, setPrenatalBoxOverride] = useState<string | null>(
    null,
  );
  const [generalBox1Override, setGeneralBox1Override] = useState<string | null>(
    null,
  );
  const [generalBox2Override, setGeneralBox2Override] = useState<string | null>(
    null,
  );
  const [currentDateStr, setCurrentDateStr] = useState("");
  const [motivoPadecimiento, setMotivoPadecimiento] = useState("");
  const [patientNoteOverride, setPatientNoteOverride] = useState<string | null>(
    null,
  );
  const [, setParaclinicosText] =
    useState(defaultParaclinicos);
  const [exploracion, setExploracion] = useState(defaultPhysicalExamText);
  const [exploracionEdited, setExploracionEdited] = useState(false);

  const [diabetesFields, setDiabetesFields] = useState({
    hba1c: "",
    glucosaAyuno: "",
    tfge: "",
    revisionPies:
      "Pulsos pedios presentes, sensibilidad conservada al monofilamento, sin úlceras ni hiperqueratosis.",
    fondoOjo: "Pendiente valoración anual por Oftalmología.",
    metaGlucemica: "En control metabólico / ajuste higiénico-dietético.",
  });
  const [htaFields] = useState({
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

  const [qrStatus, setQrStatus] = useState("");
  const [temporaryPatientHistory, setTemporaryPatientHistory] = useState<
    NonNullable<PatientTransfer["historialTemporal"]>
  >([]);
  const [qrScanning, setQrScanning] = useState(false);
  const [manualQrCodeInput, setManualQrCodeInput] = useState("");
  const qrVideoRef = useRef<HTMLVideoElement | null>(null);
  const qrStreamRef = useRef<MediaStream | null>(null);
  const qrFrameRef = useRef<number | null>(null);
  const diagnosisSearchField = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setCurrentDateStr(new Date().toLocaleDateString("es-MX"));
      try {
        const savedSession = localStorage.getItem("esd_auth_session");
        if (savedSession === "logged_out") {
          setIsAuthenticated(false);
        }
        const sharedProfile = readProfessionalProfile();
        const savedProfile =
          localStorage.getItem("esd_registered_doctor_profile") ||
          localStorage.getItem("esd_professional_profile");
        const parsed = savedProfile
          ? (JSON.parse(savedProfile) as Partial<ProfessionalDetails>)
          : {};
        const customExam =
          sharedProfile?.exploracionPersonalizada ||
          parsed.exploracionPersonalizada ||
          "";
        const mergedProfile: ProfessionalDetails = {
          nombre:
            sharedProfile?.nombre ||
            parsed.nombre ||
            defaultRegisteredDoctor.nombre,
          matricula:
            sharedProfile?.matricula ||
            parsed.matricula ||
            defaultRegisteredDoctor.matricula,
          cedula:
            sharedProfile?.cedula ||
            parsed.cedula ||
            defaultRegisteredDoctor.cedula,
          unidad:
            sharedProfile?.unidad ||
            parsed.unidad ||
            defaultRegisteredDoctor.unidad,
          exploracionPersonalizada: customExam,
          pacientePlantilla:
            sharedProfile?.pacientePlantilla || parsed.pacientePlantilla || "",
          padecimientoPlantilla:
            sharedProfile?.padecimientoPlantilla ||
            parsed.padecimientoPlantilla ||
            "",
          ginecoPlantilla:
            sharedProfile?.ginecoPlantilla || parsed.ginecoPlantilla || "",
        };
        setProfessionalDetails(mergedProfile);
        if (customExam.trim()) {
          setExploracion(customExam.trim());
        }
        if (mergedProfile.ginecoPlantilla.trim()) {
          setGynecologicText(mergedProfile.ginecoPlantilla.trim());
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
        const savedPrintableIds = localStorage.getItem(
          "esd_enabled_printable_formats",
        );
        if (savedPrintableIds) {
          const parsedIds = JSON.parse(savedPrintableIds) as string[];
          if (Array.isArray(parsedIds)) {
            setEnabledPrintableFormatIds(parsedIds);
          }
        }
        const savedCustomLinks = localStorage.getItem(
          "esd_custom_printable_links",
        );
        if (savedCustomLinks) {
          const parsedLinks = JSON.parse(savedCustomLinks) as {
            id: string;
            title: string;
            url: string;
          }[];
          if (Array.isArray(parsedLinks)) {
            setCustomPrintableLinks(parsedLinks);
          }
        }
      } catch {
        // Conservar datos registrados por defecto si localStorage no está disponible
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "esd_registered_doctor_profile",
        JSON.stringify(professionalDetails),
      );
      saveProfessionalProfile({
        nombre: professionalDetails.nombre,
        matricula: professionalDetails.matricula,
        cedula: professionalDetails.cedula,
        unidad: professionalDetails.unidad,
        exploracionPersonalizada:
          professionalDetails.exploracionPersonalizada || "",
        pacientePlantilla: professionalDetails.pacientePlantilla || "",
        padecimientoPlantilla: professionalDetails.padecimientoPlantilla || "",
        ginecoPlantilla: professionalDetails.ginecoPlantilla || "",
      });
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

  const patientTextForNote = patientIdentity.trim()
    ? patientIdentity.trim()
    : professionalDetails.pacientePlantilla.trim();

  const padecimientoTextForNote = motivoPadecimiento.trim()
    ? motivoPadecimiento.trim()
    : professionalDetails.padecimientoPlantilla.trim();

  const generatedPatientNote = [
    patientTextForNote ? "PACIENTE: " + patientTextForNote : "",
    vitalsConcatenated ? "SIGNOS VITALES: " + vitalsConcatenated : "",
    padecimientoTextForNote
      ? "PADECIMIENTO ACTUAL: " + padecimientoTextForNote
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const effectivePatientNote = patientNoteOverride ?? generatedPatientNote;

  const handlePatientNoteChange = (value: string) => {
    setPatientNoteOverride(value);
    const padecimientoMatch = value.match(/PADECIMIENTO ACTUAL:\s*([\s\S]*)$/i);
    if (padecimientoMatch) {
      setMotivoPadecimiento(padecimientoMatch[1].trim());
    }
  };

  const effectiveExploracion = vitalsConcatenated
    ? exploracion.startsWith("SIGNOS VITALES:")
      ? exploracion
      : `SIGNOS VITALES: ${vitalsConcatenated}\n\n${exploracion}`
    : exploracion;

  const handleExploracionChange = (value: string) => {
    setExploracionEdited(true);
    setExploracion(value);
  };

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

  const ginecoSectionForExport =
    !ginecoDisabled && gynecologicText.trim()
      ? "\nANTECEDENTES GINECOOBSTÉTRICOS:\n" + gynecologicText.trim()
      : "";

  // 1) FORMATO DIABETES MELLITUS (2 secciones modificables con la información de la página inicial)
  const diabetesBox1 = [
    "=== SECCIÓN 1: PACIENTE, SIGNOS VITALES Y PADECIMIENTO ACTUAL ===",
    effectivePatientNote,
    ginecoSectionForExport,
    diabetesFields.glucosaAyuno ||
    diabetesFields.hba1c ||
    diabetesFields.tfge
      ? "\nControl glucémico/renal: Glucosa ayuno " +
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
    "=== SECCIÓN 2: EXPLORACIÓN FÍSICA, DIAGNÓSTICOS Y RECOMENDACIONES ===",
    "EXPLORACIÓN FÍSICA:\n" + effectiveExploracion,
    "\nRevisión integral de pies: " + diabetesFields.revisionPies,
    "\nDIAGNÓSTICOS CIE-10:\n" + diagnosesConcatenated,
    "\nRECOMENDACIONES Y TRATAMIENTO NO FARMACOLÓGICO:\n" +
      finalIndicationsText,
    "\n" + doctorFooterConcatenated,
  ].join("\n");

  const effectiveDiabetesBox1 = diabetesBox1Override ?? diabetesBox1;
  const effectiveDiabetesBox2 = diabetesBox2Override ?? diabetesBox2;

  // 2) FORMATO HIPERTENSIÓN ARTERIAL (3 secciones modificables e imprimibles con la información de la página inicial)
  const htaBox1 = [
    "=== SECCIÓN 1: PACIENTE, SIGNOS VITALES Y PADECIMIENTO ACTUAL ===",
    effectivePatientNote,
    ginecoSectionForExport,
    htaFields.taDomiciliaria
      ? "\nPromedio TA domiciliaria: " + htaFields.taDomiciliaria
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const htaBox2 = [
    "=== SECCIÓN 2: EXPLORACIÓN FÍSICA ===",
    effectiveExploracion,
  ].join("\n");

  const htaBox3 = [
    "=== SECCIÓN 3: DIAGNÓSTICOS, RECOMENDACIONES Y SEGUIMIENTO ===",
    "Riesgo cardiovascular: " +
      htaFields.riesgoCardiovascular +
      " | Daño a órgano blanco: " +
      htaFields.danoOrganoBlanco,
    "\nDIAGNÓSTICOS CIE-10:\n" + diagnosesConcatenated,
    "\nRECOMENDACIONES Y TRATAMIENTO NO FARMACOLÓGICO:\n" +
      finalIndicationsText,
    "\n" + doctorFooterConcatenated,
  ].join("\n");

  const effectiveHtaBox1 = htaBox1Override ?? htaBox1;
  const effectiveHtaBox2 = htaBox2Override ?? htaBox2;
  const effectiveHtaBox3 = htaBox3Override ?? htaBox3;

  // 3) FORMATO CONTROL PRENATAL (1 sola nota modificable e imprimible con toda la información concatenada)
  const prenatalSingleBox = [
    "=== NOTA INTEGRAL DE CONTROL PRENATAL ===",
    "FECHA: " + currentDateStr,
    "\n" + effectivePatientNote,
    ginecoSectionForExport,
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
    "\nEXPLORACIÓN FÍSICA:\n" + effectiveExploracion,
    "\nDIAGNÓSTICOS CIE-10:\n" + diagnosesConcatenated,
    "\nRECOMENDACIONES Y TRATAMIENTO NO FARMACOLÓGICO:\n" +
      finalIndicationsText,
    "\n" + doctorFooterConcatenated,
  ]
    .filter(Boolean)
    .join("\n");

  const effectivePrenatalBox = prenatalBoxOverride ?? prenatalSingleBox;

  // 4) FORMATO CONSULTA GENERAL (2 secciones modificables e imprimibles como Diabetes)
  const generalBox1 = [
    "=== SECCIÓN 1: PACIENTE, SIGNOS VITALES Y PADECIMIENTO ACTUAL ===",
    effectivePatientNote,
    ginecoSectionForExport,
  ]
    .filter(Boolean)
    .join("\n");

  const generalBox2 = [
    "=== SECCIÓN 2: EXPLORACIÓN FÍSICA, DIAGNÓSTICOS Y RECOMENDACIONES ===",
    "EXPLORACIÓN FÍSICA:\n" + effectiveExploracion,
    "\nDIAGNÓSTICOS CIE-10:\n" + diagnosesConcatenated,
    "\nRECOMENDACIONES Y TRATAMIENTO NO FARMACOLÓGICO:\n" +
      finalIndicationsText,
    "\n" + doctorFooterConcatenated,
  ].join("\n");

  const effectiveGeneralBox1 = generalBox1Override ?? generalBox1;
  const effectiveGeneralBox2 = generalBox2Override ?? generalBox2;

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
            <h3 style="font-size:13px;color:#0F2D3D;margin:0 0 6px 0;text-transform:uppercase;">${b.heading}</h3>
            <textarea readonly style="width:100%;min-height:190px;padding:12px;border:1.5px solid #0F2D3D;border-radius:10px;font-family:monospace;font-size:12px;color:#0F2D3D;background:#F8FBFA;white-space:pre-wrap;">${b.content.replace(/</g, "&lt;")}</textarea>
          </div>`,
      )
      .join("");
    popup.document.write(`<!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; color: #0F2D3D; background: #F6FAF8; }
          .toolbar { display: flex; gap: 10px; margin-bottom: 18px; }
          button { background: #0F2D3D; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: bold; cursor: pointer; }
          button.secondary { background: #0D9488; }
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
          body { font-family: Arial, sans-serif; margin: 22px; color: #0F2D3D; }
          .toolbar { display: flex; gap: 10px; margin-bottom: 14px; }
          button { background: #0F2D3D; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: bold; cursor: pointer; }
          button.secondary { background: #0D9488; }
          .header { border-bottom: 2px solid #0F2D3D; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; }
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
            <p style="margin:2px 0 0 0;font-size:11px;color:#0D9488;font-weight:bold;">${fmt.source}</p>
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
    setGynecologicText(professionalDetails.ginecoPlantilla.trim() || "");
    setGinecoDisabled(false);
    setMotivoPadecimiento("");
    setPatientNoteOverride(null);
    setParaclinicosText(defaultParaclinicos);
    setExploracion(
      professionalDetails.exploracionPersonalizada.trim() ||
        defaultPhysicalExamText,
    );
    setExploracionEdited(false);
    setSelectedDiagnoses([]);
    setPrescribedMedications([]);
    setIndicationsOverride(null);
    setDiabetesBox1Override(null);
    setDiabetesBox2Override(null);
    setHtaBox1Override(null);
    setHtaBox2Override(null);
    setHtaBox3Override(null);
    setPrenatalBoxOverride(null);
    setGeneralBox1Override(null);
    setGeneralBox2Override(null);
    setActiveSheetTab("paciente");
    setManualQrCodeInput("");
    setQrStatus("");
    setTemporaryPatientHistory([]);
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
        `${data.nombre}, sexo ${sexLabel[data.sexo]}, ${age} años de edad`,
      );
      setSexo(data.sexo);
      setGinecoDisabled(data.sexo === "masculino");
      setPatientNoteOverride(null);
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
        data.antecedentesGinecoobstetricos ||
          professionalDetails.ginecoPlantilla.trim() ||
          "",
      );
      setTemporaryPatientHistory(data.historialTemporal ?? []);
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

  // PANTALLA 1: INICIO DE SESIÓN Y REGISTRO DE MÉDICO
  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-[#F6FAF8] p-4 text-[#0F2D3D]">
        <div className="w-full max-w-md overflow-hidden rounded-3xl border border-[#D6E6E1] bg-white shadow-xl">
          <div className="bg-gradient-to-r from-[#0F2D3D] to-[#0D9488] px-6 py-6 text-white">
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
            <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-[#F6FAF8] p-1">
              <button
                type="button"
                onClick={() => {
                  setAuthTab("login");
                  setAuthError("");
                }}
                className={
                  "rounded-lg py-2 text-xs font-extrabold transition " +
                  (authTab === "login"
                    ? "bg-[#0F2D3D] text-white shadow-sm"
                    : "text-[#0F2D3D] hover:bg-[#EAF4F1]")
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
                    ? "bg-[#0D9488] text-white shadow-sm"
                    : "text-[#0F2D3D] hover:bg-[#EAF4F1]")
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
                  className="w-full rounded-xl bg-[#0D9488] py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-[#0F2D3D]"
                >
                  Entrar a Hoja de Consulta
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="mt-4 space-y-3">
                <p className="rounded-xl bg-[#F6FAF8] p-2.5 text-xs text-slate-600">
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
                  className="w-full rounded-xl bg-[#0F2D3D] py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-[#0D9488]"
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
    <main className="min-h-dvh w-full overflow-x-hidden text-[#0F2D3D]">
      <header className="sticky top-0 z-20 border-b border-[#D6E6E1] bg-white/95 px-2.5 py-2 shadow-sm backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <BrandLogo size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h1 className="truncate text-sm font-black tracking-tight text-[#0F2D3D]">
                  ECO <span className="text-[#0D9488]">SALUD DIGITAL</span>
                </h1>
                <span className="rounded-full bg-[#EAF4F1] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#0F766E]">
                  Profesionales
                </span>
              </div>
              <p className="truncate text-[11px] font-medium text-slate-500">
                {professionalDetails.nombre} · Céd. {professionalDetails.cedula} ·{" "}
                {professionalDetails.unidad}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveWindow("qr")}
              title="Identificación del paciente por QR"
              className="rounded-lg bg-[#0284C7] px-2.5 py-1.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-[#0F2D3D]"
            >
              📷 QR Paciente
            </button>
            <button
              type="button"
              onClick={() => setActiveWindow("perfil")}
              title="Personalizar Perfil y Herramientas"
              className="rounded-lg border border-[#D6E6E1] bg-[#F8FBFA] px-2.5 py-1.5 text-[11px] font-bold text-[#0F2D3D] transition hover:border-[#0D9488] hover:bg-[#EAF4F1]"
            >
              👤 Perfil
            </button>
            <button
              type="button"
              onClick={handleLogout}
              title="Cerrar Sesión"
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* PESTAÑA LATERAL DERECHA PARA DESPLEGAR BARRA DE HERRAMIENTAS */}
      {!sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Abrir barra de herramientas"
          className="fixed right-0 top-1/2 z-30 -translate-y-1/2 rounded-l-2xl border border-r-0 border-[#0D9488] bg-[#0F2D3D] px-2 py-4 text-[11px] font-extrabold tracking-wide text-white shadow-lg transition hover:bg-[#0D9488] print:hidden [writing-mode:vertical-rl] rotate-180"
        >
          ☰ Herramientas
        </button>
      )}

      <div className="mx-auto w-full max-w-5xl px-2 py-2">
        <form
          ref={formRef}
          className="space-y-2"
          onSubmit={(event) => event.preventDefault()}
        >
          <fieldset
            disabled={finalized && !correctionMode}
            className="min-w-0 space-y-2"
          >
            {/* BARRA DE PESTAÑAS COMPACTA */}
            <div
              role="tablist"
              aria-label="Secciones de la nota clínica"
              className="grid grid-cols-2 gap-1 rounded-xl border border-[#D6E6E1] bg-white p-1 shadow-sm sm:grid-cols-5 print:hidden"
            >
              {(
                [
                  { id: "paciente", label: "1. Paciente y Padecimiento" },
                  {
                    id: "gineco",
                    label: ginecoDisabled
                      ? "2. Gineco (Inactivo)"
                      : "2. Antec. Ginecoobstétricos",
                  },
                  { id: "exploracion", label: "3. Exploración Física" },
                  {
                    id: "cie10",
                    label:
                      selectedDiagnoses.length > 0
                        ? `4. CIE-10 (${selectedDiagnoses.length})`
                        : "4. Diagnóstico CIE-10",
                  },
                  { id: "recomendaciones", label: "5. Recomendaciones" },
                ] as const
              ).map((tab) => {
                const isActive = activeSheetTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveSheetTab(tab.id)}
                    className={
                      "truncate rounded-lg px-2 py-1.5 text-[11px] font-extrabold transition " +
                      (isActive
                        ? "bg-[#0F2D3D] text-white shadow-sm"
                        : "bg-[#F6FAF8] text-[#0F2D3D] hover:bg-[#EAF4F1]")
                    }
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* PESTAÑA 1: Información del paciente + Padecimiento actual */}
            {activeSheetTab === "paciente" && (
              <section id="datos-paciente" className="rounded-xl border border-[#D6E6E1] bg-white p-3 shadow-sm">
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-xs font-extrabold uppercase tracking-wide text-[#0F2D3D]">
                    01 · Paciente y Padecimiento Actual
                  </h2>
                  <div className="flex flex-wrap gap-1.5 print:hidden">
                    <button
                      type="button"
                      onClick={() =>
                        copyTextHelper(effectivePatientNote, "Paciente y Padecimiento")
                      }
                      className="rounded-lg border border-[#D6E6E1] bg-[#F8FBFA] px-2 py-1 text-[11px] font-bold text-[#0F2D3D] hover:border-[#0D9488] hover:bg-[#EAF4F1]"
                    >
                      📋 Copiar texto
                    </button>
                    {patientNoteOverride !== null && (
                      <button
                        type="button"
                        onClick={() => setPatientNoteOverride(null)}
                        className="rounded-lg border border-[#0D9488] bg-white px-2 py-1 text-[11px] font-bold text-[#0F766E] hover:bg-[#EAF4F1]"
                      >
                        ↻ Sincronizar perfil/QR
                      </button>
                    )}
                  </div>
                </div>

                {qrStatus && (
                  <p
                    className="mb-1.5 rounded-lg bg-[#EAF4F1] px-2.5 py-1 text-[11px] font-semibold text-[#0F766E]"
                    role="status"
                  >
                    {qrStatus}
                  </p>
                )}

                {temporaryPatientHistory.length > 0 && (
                  <details className="mb-2 rounded-xl border border-[#0284C7]/40 bg-[#F0F9FF] p-2.5 text-xs print:hidden">
                    <summary className="cursor-pointer font-extrabold text-[#0F2D3D]">
                      📋 Historial temporal del paciente ({temporaryPatientHistory.length} consulta{temporaryPatientHistory.length === 1 ? "" : "s"} · visible solo durante esta consulta)
                    </summary>
                    <ul className="mt-2 max-h-36 space-y-1.5 overflow-y-auto">
                      {temporaryPatientHistory.map((item, idx) => (
                        <li
                          key={`${item.fecha}-${idx}`}
                          className="rounded-lg border border-[#BAE6FD] bg-white p-2 text-[11px]"
                        >
                          <p className="font-bold text-[#0F2D3D]">
                            {item.fecha} · {item.diagnostico}
                          </p>
                          <p className="text-slate-600">
                            <strong>Tratamiento:</strong> {item.tratamiento}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Atendido por: {item.atendidoPor}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}

                <textarea
                  id="cuadro-paciente-padecimiento"
                  name="cuadroPacientePadecimiento"
                  rows={9}
                  value={effectivePatientNote}
                  onChange={(event) => handlePatientNoteChange(event.target.value)}
                  placeholder="Escribe aquí los datos del paciente y su padecimiento actual (o configúralos como plantilla en Perfil / conéctate por QR)..."
                  className={inputClassName + " resize-y font-sans text-xs"}
                />
              </section>
            )}

            {/* PESTAÑA 2: Antecedentes Ginecoobstétricos */}
            {activeSheetTab === "gineco" && (
              <section id="antecedentes-gineco" className="rounded-xl border border-[#D6E6E1] bg-white p-3 shadow-sm">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-xs font-extrabold uppercase tracking-wide text-[#0F2D3D]">
                    02 · Antecedentes Ginecoobstétricos
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 print:hidden">
                    <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#D6E6E1] bg-[#F8FBFA] px-2.5 py-1 text-[11px] font-bold text-[#0F2D3D]">
                      <input
                        type="checkbox"
                        checked={ginecoDisabled}
                        onChange={(e) => setGinecoDisabled(e.target.checked)}
                      />
                      Desactivar (paciente masculino)
                    </label>
                    <button
                      type="button"
                      disabled={ginecoDisabled}
                      onClick={() =>
                        copyTextHelper(gynecologicText, "Antecedentes Ginecoobstétricos")
                      }
                      className="rounded-lg border border-[#D6E6E1] bg-[#F8FBFA] px-2 py-1 text-[11px] font-bold text-[#0F2D3D] hover:border-[#0D9488] hover:bg-[#EAF4F1] disabled:opacity-50"
                    >
                      📋 Copiar texto
                    </button>
                  </div>
                </div>
                <textarea
                  id="antecedentes-gineco-unificados"
                  name="antecedentesGinecoobstetricos"
                  rows={9}
                  disabled={ginecoDisabled}
                  value={ginecoDisabled ? "" : gynecologicText}
                  onChange={(event) => setGynecologicText(event.target.value)}
                  placeholder={
                    ginecoDisabled
                      ? "Desactivado para paciente masculino."
                      : "Escribe aquí los antecedentes ginecoobstétricos (o configúralos en Perfil / conéctate por QR)..."
                  }
                  className={
                    inputClassName +
                    " resize-y text-xs disabled:bg-slate-100 disabled:text-slate-400"
                  }
                />
              </section>
            )}

            {/* PESTAÑA 2: Exploración física (incluyendo signos vitales si los hay) */}
            {activeSheetTab === "exploracion" && (
              <section id="exploracion-fisica" className="rounded-xl border border-[#D6E6E1] bg-white p-3 shadow-sm">
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-xs font-extrabold uppercase tracking-wide text-[#0F2D3D]">
                    03 · Exploración Física
                  </h2>
                  <div className="flex flex-wrap gap-1.5 print:hidden">
                    <button
                      type="button"
                      onClick={() =>
                        copyTextHelper(effectiveExploracion, "Exploración física")
                      }
                      className="rounded-lg border border-[#D6E6E1] bg-[#F8FBFA] px-2 py-1 text-[11px] font-bold text-[#0F2D3D] hover:border-[#0D9488] hover:bg-[#EAF4F1]"
                    >
                      📋 Copiar cuadro
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setExploracion(
                          professionalDetails.exploracionPersonalizada.trim() ||
                            defaultPhysicalExamText,
                        );
                        setExploracionEdited(false);
                      }}
                      className="rounded-lg border border-[#D6E6E1] bg-white px-2 py-1 text-[11px] font-bold text-[#0F766E] hover:bg-[#EAF4F1]"
                    >
                      ↻ Aplicar formato del perfil
                    </button>
                  </div>
                </div>
                <textarea
                  id="exploracion-completa"
                  name="exploracionFisica"
                  rows={9}
                  value={effectiveExploracion}
                  onChange={(event) => handleExploracionChange(event.target.value)}
                  className={inputClassName + " resize-y text-xs"}
                />
              </section>
            )}

            {/* PESTAÑA 3: Barra CIE-10 */}
            {activeSheetTab === "cie10" && (
              <section id="diagnosticos" className={sectionClassName}>
                <SectionHeading
                  number="04"
                  variant="navy"
                  note="Busca por clave o padecimiento en el catálogo CIE-10 o agrégalo manualmente."
                >
                  Diagnósticos CIE-10
                </SectionHeading>

                <label
                  htmlFor="cie10-search"
                  className="block text-sm font-semibold text-[#0F2D3D]"
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
                  <div className="mt-3 rounded-xl bg-[#F6FAF8] p-3">
                    <p className="text-xs text-slate-600">
                      Sin coincidencias exactas en CIE-10. Puedes agregarlo
                      manualmente:
                    </p>
                    {manualDiagnosisOpen && (
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <input
                          value={manualDiagnosisCode}
                          onChange={(e) =>
                            setManualDiagnosisCode(e.target.value)
                          }
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
                      className="mt-2 rounded-lg border border-[#0D9488] px-3 py-1.5 text-xs font-bold text-[#0F2D3D]"
                    >
                      {manualDiagnosisOpen
                        ? "Confirmar diagnóstico manual"
                        : "+ Agregar como diagnóstico manual"}
                    </button>
                  </div>
                )}

                {visibleDiagnosisResults && diagnosisResultCount > 0 && (
                  <div className="mt-3 max-h-56 space-y-2 overflow-y-auto rounded-xl border border-[#D6E6E1] p-2">
                    {visibleDiagnosisResults.map((entry) => {
                      const alreadySelected = selectedDiagnoses.some(
                        (diagnosis) => diagnosis.code === entry.code,
                      );
                      return (
                        <div
                          key={entry.code}
                          className="flex items-center justify-between gap-2 rounded-lg border border-[#EAF4F1] px-3 py-2 text-xs sm:text-sm"
                        >
                          <span>
                            <strong>{entry.code}</strong> · {entry.description}
                          </span>
                          <button
                            type="button"
                            disabled={alreadySelected}
                            onClick={() => addDiagnosis(entry)}
                            className="shrink-0 rounded-lg bg-[#EAF4F1] px-3 py-1 font-bold text-[#0F2D3D] hover:bg-[#0D9488] hover:text-white disabled:opacity-50"
                          >
                            {alreadySelected ? "Agregado" : "+ Agregar"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-4">
                  <h3 className="text-sm font-bold text-[#0F2D3D]">
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
                          className="rounded-xl border border-[#D6E6E1] bg-[#F8FBFA] p-3 text-xs sm:text-sm"
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
                          <div className="mt-2 flex flex-wrap gap-4 border-t border-[#D6E6E1] pt-2 text-xs">
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
            )}

            {/* PESTAÑA 4: Recomendaciones y tratamiento no farmacológico */}
            {activeSheetTab === "recomendaciones" && (
              <section id="indicaciones" className="rounded-xl border border-[#D6E6E1] bg-white p-3 shadow-sm">
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-xs font-extrabold uppercase tracking-wide text-[#0F2D3D]">
                    05 · Recomendaciones y Tratamiento No Farmacológico
                  </h2>
                  <div className="flex flex-wrap gap-1.5 print:hidden">
                    <button
                      type="button"
                      onClick={() =>
                        copyTextHelper(
                          indicationsOverride ?? generatedIndications,
                          "Recomendaciones",
                        )
                      }
                      className="rounded-lg border border-[#D6E6E1] bg-[#F8FBFA] px-2 py-1 text-[11px] font-bold text-[#0F2D3D] hover:border-[#0D9488] hover:bg-[#EAF4F1]"
                    >
                      📋 Copiar cuadro
                    </button>
                    {indicationsOverride !== null && (
                      <button
                        type="button"
                        onClick={() => setIndicationsOverride(null)}
                        className="rounded-lg border border-[#D6E6E1] bg-white px-2 py-1 text-[11px] font-bold text-[#0F766E] hover:bg-[#EAF4F1]"
                      >
                        ↻ Restablecer recomendaciones
                      </button>
                    )}
                  </div>
                </div>
                <textarea
                  id="indicaciones-paciente"
                  name="indicaciones"
                  rows={9}
                  value={indicationsOverride ?? generatedIndications}
                  onChange={(event) =>
                    setIndicationsOverride(event.target.value)
                  }
                  placeholder="Recomendaciones higiénico-dietéticas, actividad física, tratamiento no farmacológico y datos de alarma..."
                  className={inputClassName + " resize-y text-xs"}
                />
              </section>
            )}
          </fieldset>

          <div className="sticky bottom-1 z-10 rounded-xl border border-[#D6E6E1] bg-white/95 px-2.5 py-2 shadow-md backdrop-blur print:hidden sm:px-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:items-center">
                <button
                  type="button"
                  onClick={() => {
                    try {
                      const draft: RecetaDraft = {
                        doctor: {
                          nombre: professionalDetails.nombre,
                          cedula: professionalDetails.cedula,
                          matricula: professionalDetails.matricula,
                          unidad: professionalDetails.unidad,
                        },
                        patientNote: effectivePatientNote,
                        diagnosesText: diagnosesConcatenated,
                        indicationsText: finalIndicationsText,
                      };
                      window.sessionStorage.setItem(
                        RECETA_DRAFT_STORAGE_KEY,
                        JSON.stringify(draft),
                      );
                    } catch {
                      // Continuar a la pantalla de receta aunque sessionStorage no esté disponible
                    }
                    router.push("/profesionales/consulta/receta");
                  }}
                  className="col-span-3 rounded-full bg-[#0D9488] px-3.5 py-1.5 text-center text-xs font-extrabold text-white shadow-sm transition hover:bg-[#0F766E] sm:col-span-1"
                >
                  Agregar Receta →
                </button>
                <button
                  type="button"
                  onClick={() => setActiveWindow("receta")}
                  className="col-span-2 rounded-full border border-[#0D9488] bg-white px-3 py-1.5 text-xs font-extrabold text-[#0F2D3D] transition hover:bg-[#EAF4F1] sm:col-span-1"
                >
                  Vista rápida
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openStandaloneBrowserPrintWindow(
                      "Archivo Médico - Nota de Consulta",
                      [
                        {
                          heading: "1. Paciente, Signos Vitales y Padecimiento Actual",
                          content: effectivePatientNote,
                        },
                        {
                          heading: "2. Exploración Física",
                          content: effectiveExploracion,
                        },
                        {
                          heading: "3. Diagnósticos CIE-10",
                          content: diagnosesConcatenated,
                        },
                        {
                          heading: "4. Recomendaciones y Tratamiento No Farmacológico",
                          content: finalIndicationsText,
                        },
                        {
                          heading: "Médico Tratante",
                          content: doctorFooterConcatenated,
                        },
                      ],
                    )
                  }
                  className="rounded-full border border-[#0F2D3D] bg-white px-3 py-1.5 text-xs font-extrabold text-[#0F2D3D] transition hover:bg-[#EAF4F1]"
                >
                  📄 Descargar PDF
                </button>
              </div>

              <button
                type="button"
                onClick={finishAndClearConsultation}
                className="w-full rounded-full bg-[#0F2D3D] px-3.5 py-1.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-rose-800 sm:w-auto"
              >
                Finalizar Consulta
              </button>
            </div>

            {saveMessage && (
              <p
                className="mt-2 text-xs font-semibold text-[#0F766E]"
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
            className="absolute inset-y-0 right-0 w-[min(25rem,94vw)] overflow-y-auto border-l border-[#D6E6E1] bg-white p-4 shadow-2xl sm:p-5"
            aria-label="Barra lateral de herramientas y formatos clínicos"
          >
            <div className="mb-4 flex items-center justify-between border-b border-[#EAF4F1] pb-3">
              <div>
                <h2 className="text-base font-extrabold text-[#0F2D3D] sm:text-lg">
                  Barra Lateral de Consulta
                </h2>
                <p className="text-xs text-slate-500">
                  Formatos para imprimir, calculadoras y biblioteca
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg bg-[#F6FAF8] px-3 py-1.5 text-xs font-bold text-[#0F2D3D]"
              >
                Contraer ✕
              </button>
            </div>

            <div className="space-y-4">
              <div
                onClick={() => setActiveSidebarSection("formatos")}
                onFocus={() => setActiveSidebarSection("formatos")}
                className={
                  "rounded-2xl border-2 p-3.5 transition " +
                  (activeSidebarSection === "formatos"
                    ? "border-[#0D9488] bg-white shadow-sm ring-2 ring-[#0D9488]/15"
                    : "border-[#D6E6E1] bg-[#F8FBFA]")
                }
              >
                <p className="text-xs font-extrabold uppercase tracking-wide text-[#0F2D3D]">
                  Formatos de Exportación e Impresión
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Abre la ventana lista para imprimir o copiar por bloques según el programa institucional:
                </p>
                <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setClinicalFormat("diabetes");
                      setActiveWindow("diabetes");
                    }}
                    className="rounded-lg bg-[#0D9488] px-2.5 py-1.5 text-center text-[11px] font-bold text-white shadow-sm transition hover:opacity-95"
                  >
                    Diabetes Mellitus
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setClinicalFormat("hipertension");
                      setActiveWindow("hipertension");
                    }}
                    className="rounded-lg bg-[#E05A6D] px-2.5 py-1.5 text-center text-[11px] font-bold text-white shadow-sm transition hover:opacity-95"
                  >
                    Hipertensión
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setClinicalFormat("prenatal");
                      setActiveWindow("prenatal");
                    }}
                    className="rounded-lg bg-[#F29D4B] px-2.5 py-1.5 text-center text-[11px] font-bold text-white shadow-sm transition hover:opacity-95"
                  >
                    Control Prenatal
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setClinicalFormat("general");
                      setActiveWindow("general");
                    }}
                    className="rounded-lg bg-[#0F2D3D] px-2.5 py-1.5 text-center text-[11px] font-bold text-white shadow-sm transition hover:opacity-95"
                  >
                    Consulta General
                  </button>
                </div>
              </div>

              <div
                onClick={() => setActiveSidebarSection("calculadoras")}
                onFocus={() => setActiveSidebarSection("calculadoras")}
                className={
                  "rounded-2xl border-2 p-3.5 transition " +
                  (activeSidebarSection === "calculadoras"
                    ? "border-[#0D9488] bg-white shadow-sm ring-2 ring-[#0D9488]/15"
                    : "border-[#D6E6E1] bg-[#F8FBFA]")
                }
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-[#0F766E]">
                    Calculadora clínica rápida
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveWindow("herramientas")}
                    className="text-[11px] font-bold text-[#0F2D3D] underline"
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
                  className="mt-1.5 w-full rounded-lg border border-[#D6E6E1] bg-white px-3 py-2 text-xs font-bold text-[#0F2D3D]"
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
                            className="block text-xs font-semibold text-[#0F2D3D]"
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
                              className="mt-1 w-full rounded-lg border border-[#D6E6E1] bg-white px-2.5 py-1.5 text-xs"
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
                            className="flex items-center gap-2 text-xs font-semibold text-[#0F2D3D]"
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
                          className="block text-xs font-semibold text-[#0F2D3D]"
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
                            className="mt-1 w-full rounded-lg border border-[#D6E6E1] bg-white px-2.5 py-1.5 text-xs"
                          />
                        </label>
                      );
                    })}

                    {sidebarCalcResult && (
                      <div className="rounded-lg border border-[#0D9488] bg-white p-2.5">
                        <p className="text-xs font-extrabold text-[#0F2D3D]">
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
                          className="mt-2 w-full rounded-lg bg-[#0F2D3D] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#0D9488]"
                        >
                          + Insertar resultado en Paraclínicos
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3) VADEMÉCUM DEL CUADRO BÁSICO DE MEDICAMENTOS */}
              <div
                onClick={() => setActiveSidebarSection("vademecum")}
                onFocus={() => setActiveSidebarSection("vademecum")}
                className={
                  "rounded-2xl border-2 p-3.5 transition " +
                  (activeSidebarSection === "vademecum"
                    ? "border-[#0D9488] bg-white shadow-sm ring-2 ring-[#0D9488]/15"
                    : "border-[#D6E6E1] bg-[#F8FBFA]")
                }
              >
                <p className="text-xs font-extrabold uppercase tracking-wide text-[#0F2D3D]">
                  Vademécum Cuadro Básico IMSS
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Busca un medicamento para consultar especificaciones, posología, contraindicaciones e interacciones:
                </p>
                <input
                  type="search"
                  value={vademecumQuery}
                  onChange={(e) => {
                    setVademecumQuery(e.target.value);
                    if (!e.target.value.trim()) setSelectedVademecumMed(null);
                  }}
                  placeholder="Buscar por nombre o clave IMSS..."
                  className="mt-2 w-full rounded-lg border border-[#D6E6E1] bg-white px-2.5 py-1.5 text-xs text-[#0F2D3D] outline-none focus:border-[#0D9488]"
                />
                {vademecumQuery.trim() && (
                  <div className="mt-1.5 max-h-36 space-y-1 overflow-y-auto rounded-lg border border-[#D6E6E1] bg-white p-1.5">
                    {imssMedicationsCatalog
                      .filter((med) => {
                        const q = normalizeSearchText(vademecumQuery.trim());
                        return (
                          normalizeSearchText(med.name).includes(q) ||
                          normalizeSearchText(med.code).includes(q)
                        );
                      })
                      .map((med) => (
                        <button
                          key={med.code}
                          type="button"
                          onClick={() => {
                            setSelectedVademecumMed(med);
                            setVademecumQuery(med.name);
                          }}
                          className="block w-full rounded-md px-2 py-1 text-left text-[11px] hover:bg-[#EAF4F1]"
                        >
                          <strong className="text-[#0F2D3D]">{med.name}</strong>{" "}
                          <span className="font-mono text-[10px] text-[#0F766E]">
                            ({med.code})
                          </span>
                        </button>
                      ))}
                  </div>
                )}

                {selectedVademecumMed && (
                  <div className="mt-2.5 space-y-1.5 rounded-xl border border-[#0D9488] bg-white p-3 text-[11px] leading-relaxed text-[#0F2D3D]">
                    <div className="flex items-start justify-between gap-2 border-b border-[#EAF4F1] pb-1.5">
                      <div>
                        <p className="text-xs font-extrabold">
                          {selectedVademecumMed.name}
                        </p>
                        <p className="font-mono text-[10px] font-bold text-[#0F766E]">
                          Clave IMSS: {selectedVademecumMed.code}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedVademecumMed(null)}
                        className="text-[11px] font-bold text-slate-400 hover:text-rose-700"
                      >
                        ✕
                      </button>
                    </div>
                    <p>
                      <strong>Presentación:</strong>{" "}
                      {selectedVademecumMed.presentation}
                    </p>
                    <p>
                      <strong>Especificaciones / Indicaciones:</strong>{" "}
                      {selectedVademecumMed.indications}
                    </p>
                    <p>
                      <strong>Posología habitual:</strong>{" "}
                      {selectedVademecumMed.dose} · Vía{" "}
                      {selectedVademecumMed.route} ·{" "}
                      {selectedVademecumMed.frequency}
                    </p>
                    <p>
                      <strong>Contraindicaciones:</strong>{" "}
                      {selectedVademecumMed.contraindications}
                    </p>
                    <p>
                      <strong>Interacciones:</strong>{" "}
                      {selectedVademecumMed.interactions}
                    </p>
                    <p>
                      <strong>Precauciones:</strong>{" "}
                      {selectedVademecumMed.precautions}
                    </p>
                  </div>
                )}
              </div>

              {/* 4) FORMATOS Y TABLAS: SOLO LINKS PARA ABRIR E IMPRIMIR EN OTRA PESTAÑA (PERSONALIZABLES) */}
              <div
                onClick={() => setActiveSidebarSection("tablas")}
                onFocus={() => setActiveSidebarSection("tablas")}
                className={
                  "rounded-2xl border-2 p-3.5 transition " +
                  (activeSidebarSection === "tablas"
                    ? "border-[#0D9488] bg-white shadow-sm ring-2 ring-[#0D9488]/15"
                    : "border-[#D6E6E1] bg-[#F8FBFA]")
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-[#0F2D3D]">
                    Formatos y Tablas (Imprimir)
                  </p>
                  <button
                    type="button"
                    onClick={() => setEditingPrintableTables((v) => !v)}
                    className="text-[11px] font-bold text-[#0F766E] underline"
                  >
                    {editingPrintableTables ? "Listo" : "Personalizar"}
                  </button>
                </div>

                {editingPrintableTables ? (
                  <div className="mt-2.5 space-y-2 rounded-xl border border-[#D6E6E1] bg-white p-2.5 text-xs">
                    <p className="text-[11px] font-bold text-slate-500">
                      Activa o quita las tablas que usas en consulta:
                    </p>
                    {PRINTABLE_CLINICAL_FORMATS.map((fmt) => {
                      const checked = enabledPrintableFormatIds.includes(fmt.id);
                      return (
                        <label
                          key={fmt.id}
                          className="flex cursor-pointer items-center justify-between gap-2 rounded-lg bg-[#F6FAF8] px-2.5 py-1.5 text-[11px] font-semibold"
                        >
                          <span>{fmt.title}</span>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setEnabledPrintableFormatIds((prev) => {
                                const next = checked
                                  ? prev.filter((id) => id !== fmt.id)
                                  : [...prev, fmt.id];
                                try {
                                  localStorage.setItem(
                                    "esd_enabled_printable_formats",
                                    JSON.stringify(next),
                                  );
                                } catch {
                                  // Ignorar
                                }
                                return next;
                              });
                            }}
                          />
                        </label>
                      );
                    })}

                    {customPrintableLinks.map((link) => (
                      <div
                        key={link.id}
                        className="flex items-center justify-between gap-2 rounded-lg bg-[#F6FAF8] px-2.5 py-1.5 text-[11px]"
                      >
                        <span className="truncate font-semibold">
                          {link.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomPrintableLinks((prev) => {
                              const next = prev.filter(
                                (item) => item.id !== link.id,
                              );
                              try {
                                localStorage.setItem(
                                  "esd_custom_printable_links",
                                  JSON.stringify(next),
                                );
                              } catch {
                                // Ignorar
                              }
                              return next;
                            });
                          }}
                          className="font-bold text-rose-700"
                        >
                          Quitar ×
                        </button>
                      </div>
                    ))}

                    <div className="space-y-1.5 border-t border-[#EAF4F1] pt-2">
                      <p className="text-[11px] font-bold text-[#0F2D3D]">
                        + Agregar tabla / enlace propio:
                      </p>
                      <input
                        type="text"
                        value={newTableTitle}
                        onChange={(e) => setNewTableTitle(e.target.value)}
                        placeholder="Nombre (ej. Escala Hamilton)"
                        className="w-full rounded-lg border border-[#D6E6E1] px-2 py-1 text-[11px]"
                      />
                      <input
                        type="url"
                        value={newTableUrl}
                        onChange={(e) => setNewTableUrl(e.target.value)}
                        placeholder="https://... (URL imprimible)"
                        className="w-full rounded-lg border border-[#D6E6E1] px-2 py-1 text-[11px]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newTableTitle.trim() || !newTableUrl.trim())
                            return;
                          const item = {
                            id: `custom-${Date.now()}`,
                            title: newTableTitle.trim(),
                            url: newTableUrl.trim(),
                          };
                          setCustomPrintableLinks((prev) => {
                            const next = [...prev, item];
                            try {
                              localStorage.setItem(
                                "esd_custom_printable_links",
                                JSON.stringify(next),
                              );
                            } catch {
                              // Ignorar
                            }
                            return next;
                          });
                          setNewTableTitle("");
                          setNewTableUrl("");
                        }}
                        className="w-full rounded-lg bg-[#0D9488] py-1 text-[11px] font-bold text-white"
                      >
                        Agregar link
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 space-y-1">
                    {PRINTABLE_CLINICAL_FORMATS.filter((fmt) =>
                      enabledPrintableFormatIds.includes(fmt.id),
                    ).map((fmt) => (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => openOfficialClinicalFormatPrintWindow(fmt)}
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-[#0F766E] transition hover:bg-[#EAF4F1]"
                      >
                        <span className="truncate">{fmt.title}</span>
                        <span className="shrink-0 font-bold">↗</span>
                      </button>
                    ))}
                    {customPrintableLinks.map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-[#0F766E] transition hover:bg-[#EAF4F1]"
                      >
                        <span className="truncate">{link.title}</span>
                        <span className="shrink-0 font-bold">↗</span>
                      </a>
                    ))}
                    {enabledPrintableFormatIds.length === 0 &&
                      customPrintableLinks.length === 0 && (
                        <p className="text-[11px] text-slate-500">
                          Sin tablas activas. Usa «Personalizar» para agregar.
                        </p>
                      )}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* VENTANA EMERGENTE: FORMATO DIABETES MELLITUS (2 VERSIONES MODIFICABLES) */}
      {activeWindow === "diabetes" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-6">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border-2 border-[#0F2D3D] bg-white p-4 shadow-2xl sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D6E6E1] pb-3 print:hidden">
              <div>
                <h2 className="text-lg font-extrabold text-[#0F2D3D]">
                  FORMATO DIABETES MELLITUS · 2 VERSIONES MODIFICABLES
                </h2>
                <p className="text-xs text-slate-500">
                  Información de la página inicial adaptada en 2 bloques editables para copiar al SIMF
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-xl bg-[#0F2D3D] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#0D9488]"
                >
                  🖨 Imprimir
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadNoteAsFile(
                      "nota-diabetes.txt",
                      effectiveDiabetesBox1 + "\n\n" + effectiveDiabetesBox2,
                    )
                  }
                  className="rounded-xl bg-[#0D9488] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#0F766E]"
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
                            "Versión 1: Paciente, Signos Vitales y Padecimiento Actual",
                          content: effectiveDiabetesBox1,
                        },
                        {
                          heading:
                            "Versión 2: Exploración Física, Diagnósticos CIE-10 y Recomendaciones",
                          content: effectiveDiabetesBox2,
                        },
                      ],
                    )
                  }
                  className="rounded-xl border border-[#0284C7] bg-white px-3 py-2 text-xs font-bold text-[#0284C7]"
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
              <p className="mt-3 rounded-lg bg-[#EAF4F1] px-3 py-1.5 text-xs font-bold text-[#0F766E] print:hidden">
                {copyFeedback}
              </p>
            )}

            <div className="mt-4 space-y-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-extrabold uppercase text-[#0F2D3D]">
                    Versión 1 (Modificable): Paciente, Signos vitales y Padecimiento actual
                  </label>
                  <div className="flex gap-1.5 print:hidden">
                    {diabetesBox1Override !== null && (
                      <button
                        type="button"
                        onClick={() => setDiabetesBox1Override(null)}
                        className="rounded-lg border border-[#D6E6E1] bg-white px-2.5 py-1 text-xs font-bold text-[#0F766E]"
                      >
                        ↻ Restablecer
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        copyTextHelper(effectiveDiabetesBox1, "Versión 1 de Diabetes")
                      }
                      className="rounded-lg bg-[#EAF4F1] px-2.5 py-1 text-xs font-bold text-[#0F2D3D] hover:bg-[#0D9488] hover:text-white"
                    >
                      Copiar Versión 1
                    </button>
                  </div>
                </div>
                <textarea
                  rows={9}
                  value={effectiveDiabetesBox1}
                  onChange={(e) => setDiabetesBox1Override(e.target.value)}
                  className="w-full rounded-xl border-2 border-[#0F2D3D] bg-white p-3 font-mono text-xs leading-relaxed text-[#0F2D3D] outline-none focus:border-[#0D9488]"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-extrabold uppercase text-[#0F2D3D]">
                    Versión 2 (Modificable): Exploración física, Diagnósticos y Recomendaciones
                  </label>
                  <div className="flex gap-1.5 print:hidden">
                    {diabetesBox2Override !== null && (
                      <button
                        type="button"
                        onClick={() => setDiabetesBox2Override(null)}
                        className="rounded-lg border border-[#D6E6E1] bg-white px-2.5 py-1 text-xs font-bold text-[#0F766E]"
                      >
                        ↻ Restablecer
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        copyTextHelper(effectiveDiabetesBox2, "Versión 2 de Diabetes")
                      }
                      className="rounded-lg bg-[#EAF4F1] px-2.5 py-1 text-xs font-bold text-[#0F2D3D] hover:bg-[#0D9488] hover:text-white"
                    >
                      Copiar Versión 2
                    </button>
                  </div>
                </div>
                <textarea
                  rows={9}
                  value={effectiveDiabetesBox2}
                  onChange={(e) => setDiabetesBox2Override(e.target.value)}
                  className="w-full rounded-xl border-2 border-[#0F2D3D] bg-white p-3 font-mono text-xs leading-relaxed text-[#0F2D3D] outline-none focus:border-[#0D9488]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VENTANA EMERGENTE: FORMATO HIPERTENSIÓN (3 SECCIONES MODIFICABLES E IMPRIMIBLES) */}
      {activeWindow === "hipertension" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-6">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border-2 border-[#0F2D3D] bg-white p-4 shadow-2xl sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D6E6E1] pb-3 print:hidden">
              <div>
                <h2 className="text-lg font-extrabold text-[#0F2D3D]">
                  FORMATO HIPERTENSIÓN ARTERIAL · 3 SECCIONES MODIFICABLES
                </h2>
                <p className="text-xs text-slate-500">
                  Información de la página inicial en 3 bloques editables e imprimibles para el SIMF
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-xl bg-[#0F2D3D] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#0D9488]"
                >
                  🖨 Imprimir
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadNoteAsFile(
                      "nota-hipertension.txt",
                      effectiveHtaBox1 +
                        "\n\n" +
                        effectiveHtaBox2 +
                        "\n\n" +
                        effectiveHtaBox3,
                    )
                  }
                  className="rounded-xl bg-[#0D9488] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#0F766E]"
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
                            "Sección 1: Paciente, Signos Vitales y Padecimiento Actual",
                          content: effectiveHtaBox1,
                        },
                        {
                          heading: "Sección 2: Exploración Física",
                          content: effectiveHtaBox2,
                        },
                        {
                          heading:
                            "Sección 3: Diagnósticos CIE-10 y Recomendaciones",
                          content: effectiveHtaBox3,
                        },
                      ],
                    )
                  }
                  className="rounded-xl border border-[#0284C7] bg-white px-3 py-2 text-xs font-bold text-[#0284C7]"
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
              <p className="mt-3 rounded-lg bg-[#EAF4F1] px-3 py-1.5 text-xs font-bold text-[#0F766E] print:hidden">
                {copyFeedback}
              </p>
            )}

            <div className="mt-4 space-y-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-extrabold uppercase text-[#0F2D3D]">
                    Sección 1 (Modificable): Paciente, Signos vitales y Padecimiento actual
                  </label>
                  <div className="flex gap-1.5 print:hidden">
                    {htaBox1Override !== null && (
                      <button
                        type="button"
                        onClick={() => setHtaBox1Override(null)}
                        className="rounded-lg border border-[#D6E6E1] bg-white px-2.5 py-1 text-xs font-bold text-[#0F766E]"
                      >
                        ↻ Restablecer
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        copyTextHelper(effectiveHtaBox1, "Sección 1 de Hipertensión")
                      }
                      className="rounded-lg bg-[#EAF4F1] px-2.5 py-1 text-xs font-bold text-[#0F2D3D] hover:bg-[#0D9488] hover:text-white"
                    >
                      Copiar Sección 1
                    </button>
                  </div>
                </div>
                <textarea
                  rows={7}
                  value={effectiveHtaBox1}
                  onChange={(e) => setHtaBox1Override(e.target.value)}
                  className="w-full rounded-xl border-2 border-[#0F2D3D] bg-white p-3 font-mono text-xs leading-relaxed text-[#0F2D3D] outline-none focus:border-[#0D9488]"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-extrabold uppercase text-[#0F2D3D]">
                    Sección 2 (Modificable): Exploración física
                  </label>
                  <div className="flex gap-1.5 print:hidden">
                    {htaBox2Override !== null && (
                      <button
                        type="button"
                        onClick={() => setHtaBox2Override(null)}
                        className="rounded-lg border border-[#D6E6E1] bg-white px-2.5 py-1 text-xs font-bold text-[#0F766E]"
                      >
                        ↻ Restablecer
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        copyTextHelper(effectiveHtaBox2, "Sección 2 de Hipertensión")
                      }
                      className="rounded-lg bg-[#EAF4F1] px-2.5 py-1 text-xs font-bold text-[#0F2D3D] hover:bg-[#0D9488] hover:text-white"
                    >
                      Copiar Sección 2
                    </button>
                  </div>
                </div>
                <textarea
                  rows={7}
                  value={effectiveHtaBox2}
                  onChange={(e) => setHtaBox2Override(e.target.value)}
                  className="w-full rounded-xl border-2 border-[#0F2D3D] bg-white p-3 font-mono text-xs leading-relaxed text-[#0F2D3D] outline-none focus:border-[#0D9488]"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-extrabold uppercase text-[#0F2D3D]">
                    Sección 3 (Modificable): Diagnósticos, Recomendaciones y Seguimiento
                  </label>
                  <div className="flex gap-1.5 print:hidden">
                    {htaBox3Override !== null && (
                      <button
                        type="button"
                        onClick={() => setHtaBox3Override(null)}
                        className="rounded-lg border border-[#D6E6E1] bg-white px-2.5 py-1 text-xs font-bold text-[#0F766E]"
                      >
                        ↻ Restablecer
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        copyTextHelper(effectiveHtaBox3, "Sección 3 de Hipertensión")
                      }
                      className="rounded-lg bg-[#EAF4F1] px-2.5 py-1 text-xs font-bold text-[#0F2D3D] hover:bg-[#0D9488] hover:text-white"
                    >
                      Copiar Sección 3
                    </button>
                  </div>
                </div>
                <textarea
                  rows={7}
                  value={effectiveHtaBox3}
                  onChange={(e) => setHtaBox3Override(e.target.value)}
                  className="w-full rounded-xl border-2 border-[#0F2D3D] bg-white p-3 font-mono text-xs leading-relaxed text-[#0F2D3D] outline-none focus:border-[#0D9488]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VENTANA EMERGENTE: CONTROL PRENATAL (NOTA ÚNICA MODIFICABLE E IMPRIMIBLE) */}
      {activeWindow === "prenatal" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-6">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border-2 border-[#0F2D3D] bg-white p-4 shadow-2xl sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D6E6E1] pb-3 print:hidden">
              <div>
                <h2 className="text-lg font-extrabold text-[#0F2D3D]">
                  HOJA DE CONTROL PRENATAL · NOTA ÚNICA MODIFICABLE
                </h2>
                <p className="text-xs text-slate-500">
                  Toda la información concatenada en una sola nota editable e imprimible
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-xl bg-[#0F2D3D] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#0D9488]"
                >
                  🖨 Imprimir
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadNoteAsFile(
                      "nota-control-prenatal.txt",
                      effectivePrenatalBox,
                    )
                  }
                  className="rounded-xl bg-[#0D9488] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#0F766E]"
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
                            "Nota Única: Nota Integral de Control Prenatal",
                          content: effectivePrenatalBox,
                        },
                      ],
                    )
                  }
                  className="rounded-xl border border-[#0284C7] bg-white px-3 py-2 text-xs font-bold text-[#0284C7]"
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
              <p className="mt-3 rounded-lg bg-[#EAF4F1] px-3 py-1.5 text-xs font-bold text-[#0F766E] print:hidden">
                {copyFeedback}
              </p>
            )}

            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-extrabold uppercase text-[#0F2D3D]">
                  Nota Única (Modificable): Nota de Control Prenatal Completa
                </label>
                <div className="flex gap-1.5 print:hidden">
                  {prenatalBoxOverride !== null && (
                    <button
                      type="button"
                      onClick={() => setPrenatalBoxOverride(null)}
                      className="rounded-lg border border-[#D6E6E1] bg-white px-2.5 py-1 text-xs font-bold text-[#0F766E]"
                    >
                      ↻ Restablecer
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      copyTextHelper(effectivePrenatalBox, "Nota Prenatal")
                    }
                    className="rounded-lg bg-[#EAF4F1] px-2.5 py-1 text-xs font-bold text-[#0F2D3D] hover:bg-[#0D9488] hover:text-white"
                  >
                    Copiar Nota Completa
                  </button>
                </div>
              </div>
              <textarea
                rows={18}
                value={effectivePrenatalBox}
                onChange={(e) => setPrenatalBoxOverride(e.target.value)}
                className="w-full rounded-xl border-2 border-[#0F2D3D] bg-white p-3 font-mono text-xs leading-relaxed text-[#0F2D3D] outline-none focus:border-[#0D9488]"
              />
            </div>
          </div>
        </div>
      )}

      {/* VENTANA EMERGENTE: CONSULTA GENERAL (2 SECCIONES MODIFICABLES E IMPRIMIBLES COMO DIABETES) */}
      {activeWindow === "general" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-6">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border-2 border-[#0F2D3D] bg-white p-4 shadow-2xl sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D6E6E1] pb-3 print:hidden">
              <div>
                <h2 className="text-lg font-extrabold text-[#0F2D3D]">
                  FORMATO CONSULTA GENERAL · 2 VERSIONES MODIFICABLES
                </h2>
                <p className="text-xs text-slate-500">
                  Información de la página inicial en 2 bloques editables e imprimibles para el SIMF
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-xl bg-[#0F2D3D] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#0D9488]"
                >
                  🖨 Imprimir
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadNoteAsFile(
                      "nota-consulta-general.txt",
                      effectiveGeneralBox1 + "\n\n" + effectiveGeneralBox2,
                    )
                  }
                  className="rounded-xl bg-[#0D9488] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#0F766E]"
                >
                  💾 Guardar archivo
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openStandaloneBrowserPrintWindow(
                      "Nota Médica - Consulta General",
                      [
                        {
                          heading:
                            "Sección 1: Paciente, Signos Vitales y Padecimiento Actual",
                          content: effectiveGeneralBox1,
                        },
                        {
                          heading:
                            "Sección 2: Exploración Física, Diagnósticos CIE-10 y Recomendaciones",
                          content: effectiveGeneralBox2,
                        },
                      ],
                    )
                  }
                  className="rounded-xl border border-[#0284C7] bg-white px-3 py-2 text-xs font-bold text-[#0284C7]"
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
              <p className="mt-3 rounded-lg bg-[#EAF4F1] px-3 py-1.5 text-xs font-bold text-[#0F766E] print:hidden">
                {copyFeedback}
              </p>
            )}

            <div className="mt-4 space-y-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-extrabold uppercase text-[#0F2D3D]">
                    Sección 1 (Modificable): Paciente, Signos vitales y Padecimiento actual
                  </label>
                  <div className="flex gap-1.5 print:hidden">
                    {generalBox1Override !== null && (
                      <button
                        type="button"
                        onClick={() => setGeneralBox1Override(null)}
                        className="rounded-lg border border-[#D6E6E1] bg-white px-2.5 py-1 text-xs font-bold text-[#0F766E]"
                      >
                        ↻ Restablecer
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        copyTextHelper(effectiveGeneralBox1, "Sección 1 Consulta General")
                      }
                      className="rounded-lg bg-[#EAF4F1] px-2.5 py-1 text-xs font-bold text-[#0F2D3D] hover:bg-[#0D9488] hover:text-white"
                    >
                      Copiar Sección 1
                    </button>
                  </div>
                </div>
                <textarea
                  rows={9}
                  value={effectiveGeneralBox1}
                  onChange={(e) => setGeneralBox1Override(e.target.value)}
                  className="w-full rounded-xl border-2 border-[#0F2D3D] bg-white p-3 font-mono text-xs leading-relaxed text-[#0F2D3D] outline-none focus:border-[#0D9488]"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-extrabold uppercase text-[#0F2D3D]">
                    Sección 2 (Modificable): Exploración física, Diagnósticos y Recomendaciones
                  </label>
                  <div className="flex gap-1.5 print:hidden">
                    {generalBox2Override !== null && (
                      <button
                        type="button"
                        onClick={() => setGeneralBox2Override(null)}
                        className="rounded-lg border border-[#D6E6E1] bg-white px-2.5 py-1 text-xs font-bold text-[#0F766E]"
                      >
                        ↻ Restablecer
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        copyTextHelper(effectiveGeneralBox2, "Sección 2 Consulta General")
                      }
                      className="rounded-lg bg-[#EAF4F1] px-2.5 py-1 text-xs font-bold text-[#0F2D3D] hover:bg-[#0D9488] hover:text-white"
                    >
                      Copiar Sección 2
                    </button>
                  </div>
                </div>
                <textarea
                  rows={9}
                  value={effectiveGeneralBox2}
                  onChange={(e) => setGeneralBox2Override(e.target.value)}
                  className="w-full rounded-xl border-2 border-[#0F2D3D] bg-white p-3 font-mono text-xs leading-relaxed text-[#0F2D3D] outline-none focus:border-[#0D9488]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VENTANA EMERGENTE EXCLUSIVA DE RECETA MÉDICA LISTA PARA IMPRIMIR O GUARDAR */}
      {activeWindow === "receta" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-6">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border-2 border-[#0F2D3D] bg-white p-5 shadow-2xl sm:p-7">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#D6E6E1] pb-3 print:hidden">
              <div>
                <h2 className="text-lg font-extrabold text-[#0F2D3D]">
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
                  className="rounded-xl bg-[#0F2D3D] px-4 py-2 text-xs font-bold text-white hover:bg-[#0D9488]"
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
                  className="rounded-xl bg-[#0D9488] px-4 py-2 text-xs font-bold text-white hover:bg-[#0F766E]"
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

            <div className="rounded-xl border-2 border-[#0F2D3D] bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-[#0F2D3D] pb-3">
                <div>
                  <h3 className="text-xl font-extrabold text-[#0F2D3D]">
                    RECETA MÉDICA
                  </h3>
                  <p className="text-xs font-semibold text-[#0F766E]">
                    {professionalDetails.unidad}
                  </p>
                  <p className="text-xs text-slate-500">
                    Fecha de expedición:{" "}
                    {currentDateStr}
                  </p>
                </div>
                <div className="text-right text-xs text-[#0F2D3D]">
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
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0F2D3D]">
                  Rp. Prescripción Farmacológica:
                </h4>
                {prescribedMedications.length === 0 ? (
                  <p className="mt-2 text-xs italic text-slate-500">
                    No se han agregado medicamentos a la receta.
                  </p>
                ) : (
                  <ol className="mt-2 list-decimal space-y-2 pl-5 text-xs sm:text-sm">
                    {prescribedMedications.map((m) => (
                      <li key={m.id} className="border-b border-[#EAF4F1] pb-1.5">
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

              <div className="mt-4 border-t border-[#D6E6E1] pt-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0F2D3D]">
                  Indicaciones no farmacológicas y signos de alarma:
                </h4>
                <p className="mt-1 whitespace-pre-wrap text-xs sm:text-sm">
                  {finalIndicationsText}
                </p>
              </div>

              <div className="mt-8 border-t border-[#D6E6E1] pt-4 text-center text-xs text-[#0F2D3D]">
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

      {/* MODAL PARA PERSONALIZAR EL PERFIL DEL MÉDICO Y HERRAMIENTAS */}
      {activeWindow === "perfil" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4">
          <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#A9CFF0] bg-white p-4 shadow-2xl sm:p-5">
            <div className="flex items-center justify-between border-b border-[#EAF4F1] pb-3">
              <h2 className="text-base font-extrabold text-[#0F2D3D]">
                Personalizar Perfil y Herramientas
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
              Tus datos y plantillas quedan guardados en tu sesión y aparecen precargados en tus notas y recetas:
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
              <label className="block text-xs font-semibold text-[#0F2D3D]">
                Plantilla de ficha de paciente (opcional)
                <textarea
                  name="pacientePlantilla"
                  rows={2}
                  value={professionalDetails.pacientePlantilla}
                  onChange={(event) => {
                    const nextVal = event.target.value;
                    setProfessionalDetails((prev) => ({
                      ...prev,
                      pacientePlantilla: nextVal,
                    }));
                  }}
                  placeholder="Si la dejas vacía, iniciará en blanco en la nota."
                  className={inputClassName + " resize-y"}
                />
              </label>
              <label className="block text-xs font-semibold text-[#0F2D3D]">
                Plantilla de padecimiento actual (opcional)
                <textarea
                  name="padecimientoPlantilla"
                  rows={2}
                  value={professionalDetails.padecimientoPlantilla}
                  onChange={(event) => {
                    const nextVal = event.target.value;
                    setProfessionalDetails((prev) => ({
                      ...prev,
                      padecimientoPlantilla: nextVal,
                    }));
                  }}
                  placeholder="Si la dejas vacía, iniciará en blanco en la nota."
                  className={inputClassName + " resize-y"}
                />
              </label>
              <label className="block text-xs font-semibold text-[#0F2D3D]">
                Plantilla de antecedentes ginecoobstétricos (opcional)
                <textarea
                  name="ginecoPlantilla"
                  rows={2}
                  value={professionalDetails.ginecoPlantilla}
                  onChange={(event) => {
                    const nextVal = event.target.value;
                    setProfessionalDetails((prev) => ({
                      ...prev,
                      ginecoPlantilla: nextVal,
                    }));
                  }}
                  placeholder="Si la dejas vacía, iniciará en blanco en la pestaña de Gineco."
                  className={inputClassName + " resize-y"}
                />
              </label>
              <label className="block text-xs font-semibold text-[#0F2D3D]">
                Exploración física o formato propio (aparecerá siempre en tus notas)
                <textarea
                  name="exploracionPersonalizada"
                  rows={4}
                  value={professionalDetails.exploracionPersonalizada}
                  onChange={(event) => {
                    const nextVal = event.target.value;
                    setProfessionalDetails((prev) => ({
                      ...prev,
                      exploracionPersonalizada: nextVal,
                    }));
                  }}
                  placeholder="Escribe aquí tu formato personalizado de exploración física. Si lo dejas vacío, se usará el formato estándar."
                  className={inputClassName + " resize-y"}
                />
              </label>

              <div className="border-t border-[#EAF4F1] pt-3">
                <p className="text-xs font-extrabold uppercase tracking-wide text-[#0F2D3D]">
                  Herramientas / Calculadoras de la Barra Lateral
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Marca las calculadoras que utilizas en consulta:
                </p>
                <div className="mt-2 space-y-1.5">
                  {Object.entries(SIDEBAR_CALCULATORS).map(([id, calc]) => (
                    <label
                      key={id}
                      className="flex cursor-pointer items-center justify-between rounded-xl border border-[#D6E6E1] bg-[#F8FBFA] px-3 py-2 text-xs font-bold text-[#0F2D3D]"
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
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!exploracionEdited) {
                  setExploracion(
                    professionalDetails.exploracionPersonalizada.trim() ||
                      defaultPhysicalExamText,
                  );
                }
                if (!gynecologicText.trim() && professionalDetails.ginecoPlantilla.trim()) {
                  setGynecologicText(professionalDetails.ginecoPlantilla.trim());
                }
                setActiveWindow(null);
              }}
              className="mt-4 w-full rounded-xl bg-[#0D9488] py-2.5 text-sm font-extrabold text-white hover:bg-[#0F2D3D]"
            >
              Guardar y Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MODAL PARA IDENTIFICACIÓN DEL PACIENTE POR QR / APP */}
      {activeWindow === "qr" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#A9CFF0] bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EAF4F1] pb-3">
              <h2 className="text-base font-extrabold text-[#0F2D3D]">
                Identificación del Paciente (QR / App)
              </h2>
              <button
                type="button"
                onClick={() => {
                  stopQrReader();
                  setActiveWindow(null);
                }}
                className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold"
              >
                Cerrar ✕
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Escanea el código QR del paciente o pega su código temporal ESD1 para precargar sus datos y signos vitales en la nota.
            </p>
            <div className="mt-3 space-y-2.5">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (qrScanning) stopQrReader();
                    else startQrReader();
                  }}
                  className="rounded-lg bg-[#0284C7] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#0F2D3D]"
                >
                  {qrScanning ? "Detener cámara" : "📷 Escanear QR"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.open("/pacientes/qr", "_blank", "noopener,noreferrer");
                  }}
                  className="rounded-lg border border-[#D6E6E1] bg-white px-3 py-1.5 text-xs font-bold text-[#0F766E] hover:bg-[#EAF4F1]"
                >
                  Abrir Link QR ↗
                </button>
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={manualQrCodeInput}
                  onChange={(e) => setManualQrCodeInput(e.target.value)}
                  placeholder="Pegar código ESD1..."
                  className="min-w-0 flex-1 rounded-lg border border-[#D6E6E1] bg-white px-2.5 py-1.5 text-xs text-[#0F2D3D] outline-none focus:border-[#0D9488]"
                />
                <button
                  type="button"
                  onClick={() => {
                    applyMeasurementQr(manualQrCodeInput);
                  }}
                  className="shrink-0 rounded-lg bg-[#0F2D3D] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#0D9488]"
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
                    "max-h-48 w-full rounded-lg bg-black object-contain " +
                    (qrScanning ? "block" : "hidden")
                  }
                />
                {qrStatus && (
                  <p className="mt-1 text-xs font-semibold text-[#0F766E]" role="status">
                    {qrStatus}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA PERSONALIZAR LAS HERRAMIENTAS DE LA BARRA LATERAL */}
      {activeWindow === "herramientas" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#A9CFF0] bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EAF4F1] pb-3">
              <h2 className="text-base font-extrabold text-[#0F2D3D]">
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
                  className="flex cursor-pointer items-center justify-between rounded-xl border border-[#D6E6E1] bg-[#F8FBFA] px-3 py-2 text-xs font-bold text-[#0F2D3D]"
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
              className="mt-4 w-full rounded-xl bg-[#0F2D3D] py-2.5 text-sm font-extrabold text-white hover:bg-[#0D9488]"
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
