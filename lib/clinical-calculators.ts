export type CalculatorField = {
  key: string;
  label: string;
  unit?: string;
  kind?: "number" | "select" | "checkbox" | "date";
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
};

export type CalculatorDefinition = {
  fields: CalculatorField[];
  sourceLabel: string;
  source: string;
  note: string;
  calculate: (values: Record<string, string>) => string;
};

type Values = Record<string, string>;
const number = (values: Values, key: string) => Number(values[key]);
const yes = (values: Values, key: string) => values[key] === "true";
const sexOptions = [
  { value: "female", label: "Femenina" },
  { value: "male", label: "Masculina" },
];
const adultAge: CalculatorField = { key: "age", label: "Edad", unit: "años", min: 18, max: 120, step: 1 };
const creatinine: CalculatorField = { key: "creatinine", label: "Creatinina sérica", unit: "mg/dL", min: 0.01, max: 30, step: 0.01 };

const egfr = (values: Values) => {
  const age = number(values, "age");
  const scr = number(values, "creatinine");
  const female = values.sex === "female";
  const k = female ? 0.7 : 0.9;
  const alpha = female ? -0.241 : -0.302;
  const ratio = scr / k;
  const result = 142 * Math.pow(Math.min(ratio, 1), alpha) * Math.pow(Math.max(ratio, 1), -1.2) * Math.pow(0.9938, age) * (female ? 1.012 : 1);
  return `${result.toFixed(0)} mL/min/1.73 m² (estimación CKD-EPI 2021)`;
};

const creatinineClearance = (values: Values) => {
  const result = ((140 - number(values, "age")) * number(values, "weight")) / (72 * number(values, "creatinine")) * (values.sex === "female" ? 0.85 : 1);
  return `${result.toFixed(1)} mL/min (estimación Cockcroft-Gault)`;
};

const bmi = (values: Values) => `${(number(values, "weight") / Math.pow(number(values, "height") / 100, 2)).toFixed(1)} kg/m²`;

const pediatricWeightFields: CalculatorField[] = [
  { key: "weight", label: "Peso", unit: "kg", min: 0.3, max: 300, step: 0.01 },
];

const apgarOptions = (label: string, options: { value: string; label: string }[]): CalculatorField => ({ key: label, label, kind: "select", options });

const apgarOptionSets = [
  [{ value: "0", label: "Ausente" }, { value: "1", label: "Menor de 100 latidos/min" }, { value: "2", label: "100 latidos/min o más" }],
  [{ value: "0", label: "Ausente" }, { value: "1", label: "Lenta o irregular" }, { value: "2", label: "Llanto vigoroso" }],
  [{ value: "0", label: "Flácido" }, { value: "1", label: "Flexión de extremidades" }, { value: "2", label: "Movimiento activo" }],
  [{ value: "0", label: "Sin respuesta" }, { value: "1", label: "Mueca" }, { value: "2", label: "Tos, estornudo o llanto" }],
  [{ value: "0", label: "Pálido o cianótico" }, { value: "1", label: "Acrocianosis" }, { value: "2", label: "Completamente rosado" }],
];
const dateInput = (key: string, label: string): CalculatorField => ({ key, label, kind: "date" });
const choices = (key: string, label: string, options: { value: string; label: string }[]): CalculatorField => ({ key, label, kind: "select", options });
const dateUTC = (value: string) => Date.parse(`${value}T00:00:00Z`);

export const clinicalCalculators: Record<string, CalculatorDefinition> = {
  imc: {
    fields: [
      { key: "weight", label: "Peso", unit: "kg", min: 1, max: 500, step: 0.1 },
      { key: "height", label: "Talla", unit: "cm", min: 30, max: 250, step: 0.1 },
    ],
    sourceLabel: "CDC · Fórmula del IMC",
    source: "https://www.cdc.gov/growth-chart-training/hcp/using-bmi/calculating-bmi.html",
    note: "El IMC es una medida de tamizaje y no sustituye la valoración clínica. Para menores de 20 años se requiere interpretar el IMC por edad y sexo; esta herramienta solo devuelve el valor numérico.",
    calculate: bmi,
  },
  "peds-imc": {
    fields: pediatricWeightFields.concat([{ key: "height", label: "Talla", unit: "cm", min: 30, max: 250, step: 0.1 }]),
    sourceLabel: "CDC · IMC pediátrico por edad y sexo",
    source: "https://www.cdc.gov/growth-chart-training/hcp/using-bmi/calculating-bmi.html",
    note: "Este resultado es solo el IMC numérico. En niñas, niños y adolescentes debe interpretarse por edad y sexo mediante curvas de crecimiento; no se muestran percentiles ni categorías pediátricas aquí.",
    calculate: bmi,
  },
  mosteller: {
    fields: pediatricWeightFields.concat([{ key: "height", label: "Talla", unit: "cm", min: 30, max: 250, step: 0.1 }]),
    sourceLabel: "Mosteller · NEJM",
    source: "https://pubmed.ncbi.nlm.nih.gov/3657876/",
    note: "Estimación de superficie corporal con peso y talla; no sustituye la valoración clínica ni las instrucciones específicas de dosificación de un medicamento.",
    calculate: (values) => `${Math.sqrt((number(values, "weight") * number(values, "height")) / 3600).toFixed(2)} m²`,
  },
  "holliday-segar": {
    fields: pediatricWeightFields,
    sourceLabel: "AAP · Guía de líquidos intravenosos de mantenimiento",
    source: "https://publications.aap.org/pediatrics/article/142/6/e20183083/37529/Clinical-Practice-Guideline-Maintenance",
    note: "Estimación inicial de requerimiento de mantenimiento, no de reanimación ni reposición de pérdidas. La guía AAP citada aplica a la mayoría de pacientes de 28 días a 18 años y excluye condiciones como cardiopatía, enfermedad renal o hepática, diabetes insípida, quemaduras graves y neonatos. Individualizar composición y volumen.",
    calculate: (values) => {
      const weight = number(values, "weight");
      const hourly = weight <= 10 ? weight * 4 : weight <= 20 ? 40 + (weight - 10) * 2 : 60 + (weight - 20);
      const daily = weight <= 10 ? weight * 100 : weight <= 20 ? 1000 + (weight - 10) * 50 : 1500 + (weight - 20) * 20;
      return `${hourly.toFixed(1)} mL/h (4-2-1); ${daily.toFixed(0)} mL/día (100-50-20)`;
    },
  },
  "edad-corregida": {
    fields: [
      { key: "birthDate", label: "Fecha de nacimiento", kind: "date" },
      { key: "assessmentDate", label: "Fecha de valoración", kind: "date" },
      { key: "gestationWeeks", label: "Edad gestacional al nacer", unit: "semanas completas", min: 20, max: 36, step: 1 },
      { key: "gestationDays", label: "Días adicionales", unit: "días", min: 0, max: 6, step: 1 },
    ],
    sourceLabel: "OMS · Pocket Book of Primary Health Care for Children and Adolescents",
    source: "https://iris.who.int/bitstream/handle/10665/352485/9789289057622-eng.pdf?sequence=2",
    note: "La OMS recomienda usar edad corregida para valorar desarrollo de prematuros hasta los 2 años. Se resta de la edad cronológica el tiempo que faltó para 40 semanas de gestación.",
    calculate: (values) => {
      const birth = Date.parse(`${values.birthDate}T00:00:00Z`);
      const assessment = Date.parse(`${values.assessmentDate}T00:00:00Z`);
      const chronologicalDays = Math.floor((assessment - birth) / 86400000);
      const weeksPremature = 40 - number(values, "gestationWeeks") - number(values, "gestationDays") / 7;
      const correctedDays = chronologicalDays - weeksPremature * 7;
      if (correctedDays < 0) {
        const untilTermDays = Math.ceil(-correctedDays);
        return `Aún no alcanza las 40 semanas de edad posmenstrual; faltan ${Math.floor(untilTermDays / 7)} semanas y ${untilTermDays % 7} días.`;
      }
      const weeks = Math.floor(correctedDays / 7);
      return `${(weeks / 4.345).toFixed(1)} meses (aprox. ${weeks} semanas corregidas)`;
    },
  },
  apgar: {
    fields: [
      choices("recordMinute", "Minuto de registro", [{ value: "1", label: "1 minuto" }, { value: "5", label: "5 minutos" }, { value: "10", label: "10 minutos" }, { value: "15", label: "15 minutos" }, { value: "20", label: "20 minutos" }]),
      apgarOptions("Frecuencia cardiaca", apgarOptionSets[0]),
      apgarOptions("Respiración", apgarOptionSets[1]),
      apgarOptions("Tono muscular", apgarOptionSets[2]),
      apgarOptions("Respuesta refleja", apgarOptionSets[3]),
      apgarOptions("Coloración", apgarOptionSets[4]),
    ],
    sourceLabel: "ACOG/AAP · The Apgar Score",
    source: "https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2015/10/the-apgar-score",
    note: "Registrar a 1 y 5 minutos y continuar cada 5 minutos hasta 20 minutos si el puntaje permanece por debajo de 7. La reanimación se inicia antes de asignar el minuto 1; Apgar no determina el inicio de reanimación ni predice por sí solo el resultado neurológico individual.",
    calculate: (values) => `${["Frecuencia cardiaca", "Respiración", "Tono muscular", "Respuesta refleja", "Coloración"].reduce((sum, key) => sum + number(values, key), 0)} puntos Apgar a los ${values.recordMinute} minutos (0–10)`,
  },
  "edad-gestacional-fum": {
    fields: [dateInput("lmp", "Fecha de última menstruación (FUM)"), dateInput("assessmentDate", "Fecha de valoración")],
    sourceLabel: "ACOG · Methods for Estimating the Due Date",
    source: "https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/05/methods-for-estimating-the-due-date",
    note: "Estimación basada en FUM regular y confiable. La ecografía temprana puede cambiar la datación; documenta la mejor estimación obstétrica y no uses esta cifra aislada para decisiones clínicas.",
    calculate: (values) => {
      const days = Math.floor((dateUTC(values.assessmentDate) - dateUTC(values.lmp)) / 86400000);
      if (!Number.isFinite(days) || days < 0) return "Revisa que la FUM sea una fecha válida anterior a la valoración.";
      return `${Math.floor(days / 7)} semanas y ${days % 7} días por FUM`;
    },
  },
  "fecha-probable-parto": {
    fields: [dateInput("lmp", "Fecha de última menstruación (FUM)")],
    sourceLabel: "ACOG · Methods for Estimating the Due Date",
    source: "https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/05/methods-for-estimating-the-due-date",
    note: "Cálculo estimado de 280 días desde la FUM. La datación por ultrasonido puede ajustar la fecha; confirma y documenta la mejor estimación obstétrica.",
    calculate: (values) => {
      const lmp = dateUTC(values.lmp);
      if (!Number.isFinite(lmp)) return "Ingresa una FUM válida.";
      const dueDate = new Date(lmp + 280 * 86400000);
      return new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeZone: "UTC" }).format(dueDate);
    },
  },
  bishop: {
    fields: [
      choices("dilation", "Dilatación cervical", [{ value: "0", label: "Cerrado · 0" }, { value: "1", label: "1–2 cm · 1" }, { value: "2", label: "3–4 cm · 2" }, { value: "3", label: "≥5 cm · 3" }]),
      choices("effacement", "Borramiento cervical", [{ value: "0", label: "0–30% · 0" }, { value: "1", label: "40–50% · 1" }, { value: "2", label: "60–70% · 2" }, { value: "3", label: "≥80% · 3" }]),
      choices("station", "Estación fetal", [{ value: "0", label: "−3 · 0" }, { value: "1", label: "−2 · 1" }, { value: "2", label: "−1 o 0 · 2" }, { value: "3", label: "+1 o +2 · 3" }]),
      choices("consistency", "Consistencia cervical", [{ value: "0", label: "Firme · 0" }, { value: "1", label: "Media · 1" }, { value: "2", label: "Blanda · 2" }]),
      choices("position", "Posición cervical", [{ value: "0", label: "Posterior · 0" }, { value: "1", label: "Media · 1" }, { value: "2", label: "Anterior · 2" }]),
    ],
    sourceLabel: "NCBI Bookshelf · Bishop Score",
    source: "https://www.ncbi.nlm.nih.gov/books/NBK615337/table/ch10.tab8/",
    note: "Puntaje de 0–13 con datos de exploración cervical y estación fetal. No sustituye la valoración obstétrica; la definición de cérvix favorable depende del contexto y no establece por sí sola conducta de inducción.",
    calculate: (values) => `${["dilation", "effacement", "station", "consistency", "position"].reduce((sum, key) => sum + number(values, key), 0)} puntos Bishop (0–13)`,
  },
  "imc-gestacional": {
    fields: [{ key: "weight", label: "Peso pregestacional", unit: "kg", min: 1, max: 500, step: 0.1 }, { key: "height", label: "Talla", unit: "cm", min: 30, max: 250, step: 0.1 }],
    sourceLabel: "ACOG · Weight Gain During Pregnancy",
    source: "https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2013/01/weight-gain-during-pregnancy",
    note: "Se calcula IMC pregestacional porque las recomendaciones de ganancia gestacional se basan en ese valor, no en un IMC tomado en cualquier trimestre.",
    calculate: bmi,
  },
  "ganancia-peso-gestacional": {
    fields: [
      { key: "preWeight", label: "Peso pregestacional", unit: "kg", min: 1, max: 500, step: 0.1 },
      { key: "currentWeight", label: "Peso actual", unit: "kg", min: 1, max: 500, step: 0.1 },
      { key: "height", label: "Talla", unit: "cm", min: 30, max: 250, step: 0.1 },
    ],
    sourceLabel: "ACOG/IOM · Weight Gain During Pregnancy",
    source: "https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2013/01/weight-gain-during-pregnancy",
    note: "Estimación de ganancia total para embarazo único basada en IMC pregestacional y recomendaciones IOM. No se aplica a embarazo múltiple; el cuidado debe individualizarse según crecimiento fetal y condición clínica.",
    calculate: (values) => {
      const preWeight = number(values, "preWeight");
      const bmiValue = preWeight / Math.pow(number(values, "height") / 100, 2);
      const gain = number(values, "currentWeight") - preWeight;
      const range = bmiValue < 18.5 ? "12.5–18 kg" : bmiValue < 25 ? "11.5–16 kg" : bmiValue < 30 ? "7–11.5 kg" : "5–9 kg";
      return `IMC pregestacional ${bmiValue.toFixed(1)}; ganancia actual ${gain.toFixed(1)} kg; intervalo total recomendado para embarazo único: ${range}`;
    },
  },
  "ckd-epi-2021": {
    fields: [adultAge, { key: "sex", label: "Variable sexual de la ecuación", kind: "select", options: sexOptions }, creatinine],
    sourceLabel: "National Kidney Foundation · CKD-EPI 2021",
    source: "https://www.kidney.org/professionals/ckd-epi-creatinine-equation-2021",
    note: "Ecuación para adultos con creatinina estandarizada. No diagnostica enfermedad renal crónica por sí sola; la valoración requiere contexto clínico y persistencia de hallazgos. No usar como cálculo pediátrico.",
    calculate: egfr,
  },
  "cockcroft-gault": {
    fields: [adultAge, { key: "sex", label: "Variable sexual de la ecuación", kind: "select", options: sexOptions }, { key: "weight", label: "Peso usado en el cálculo", unit: "kg", min: 1, max: 500, step: 0.1 }, creatinine],
    sourceLabel: "National Kidney Foundation · Cockcroft-Gault",
    source: "https://www.kidney.org/professionals/kdoqi/cockcroft-gault-equation-estimating-creatinine-clearance",
    note: "Estimación histórica de depuración de creatinina (mL/min), distinta de la TFGe indexada. La NKF advierte limitaciones de generalización y recomienda considerar ecuaciones CKD-EPI sin raza para decisiones relacionadas con función renal. No usar este resultado aislado para ajustar dosis.",
    calculate: creatinineClearance,
  },
  "fib-4": {
    fields: [adultAge, { key: "ast", label: "AST", unit: "U/L", min: 1, max: 10000, step: 1 }, { key: "alt", label: "ALT", unit: "U/L", min: 1, max: 10000, step: 1 }, { key: "platelets", label: "Plaquetas", unit: "10⁹/L", min: 1, max: 3000, step: 1 }],
    sourceLabel: "AASLD · Evaluación no invasiva de fibrosis hepática",
    source: "https://www.aasld.org/liver-fellow-network/core-series/clinical-pearls/spare-me-jab-noninvasive-assessment-patients-masld",
    note: "El índice es menos fiable en menores de 35 años y mayores de 65. Los puntos de corte dependen de edad y contexto; un resultado elevado requiere valoración y pruebas complementarias, no confirma fibrosis por sí solo.",
    calculate: (values) => {
      const result = (number(values, "age") * number(values, "ast")) / (number(values, "platelets") * Math.sqrt(number(values, "alt")));
      const age = number(values, "age");
      const lowThreshold = age > 65 ? 2 : 1.3;
      const interpretation = age < 36 ? "interpretación limitada por edad" : result < lowThreshold ? "bajo riesgo estimado" : result <= 2.67 ? "requiere valoración secundaria" : "riesgo elevado; requiere valoración secundaria";
      return `${result.toFixed(2)} · ${interpretation}`;
    },
  },
  "anion-gap": {
    fields: [
      { key: "sodium", label: "Sodio", unit: "mmol/L", min: 50, max: 250, step: 0.1 },
      { key: "chloride", label: "Cloro", unit: "mmol/L", min: 20, max: 200, step: 0.1 },
      { key: "bicarbonate", label: "Bicarbonato", unit: "mmol/L", min: 1, max: 100, step: 0.1 },
    ],
    sourceLabel: "Kraut & Madias · Serum anion gap",
    source: "https://pubmed.ncbi.nlm.nih.gov/17699401/",
    note: "Se calcula como Na − (Cl + HCO₃), sin potasio. El intervalo de referencia varía entre laboratorios y depende de método, albúmina y contexto ácido-base.",
    calculate: (values) => `${(number(values, "sodium") - number(values, "chloride") - number(values, "bicarbonate")).toFixed(1)} mmol/L (Na − Cl − HCO₃)`,
  },
  "anion-gap-albumin": {
    fields: [
      { key: "sodium", label: "Sodio", unit: "mmol/L", min: 50, max: 250, step: 0.1 },
      { key: "chloride", label: "Cloro", unit: "mmol/L", min: 20, max: 200, step: 0.1 },
      { key: "bicarbonate", label: "Bicarbonato", unit: "mmol/L", min: 1, max: 100, step: 0.1 },
      { key: "albumin", label: "Albúmina", unit: "g/dL", min: 0.1, max: 10, step: 0.1 },
    ],
    sourceLabel: "Figge et al. · Anion gap and hypoalbuminemia",
    source: "https://pubmed.ncbi.nlm.nih.gov/9824071/",
    note: "Ajuste estimado: brecha observada + 2.5 × (4 − albúmina en g/dL). La corrección es aproximada y debe interpretarse con el intervalo de referencia del laboratorio y el cuadro ácido-base.",
    calculate: (values) => {
      const observed = number(values, "sodium") - number(values, "chloride") - number(values, "bicarbonate");
      const adjusted = observed + 2.5 * (4 - number(values, "albumin"));
      return `${observed.toFixed(1)} mmol/L observada; ${adjusted.toFixed(1)} mmol/L ajustada por albúmina`;
    },
  },
  "child-pugh": {
    fields: [
      { key: "bilirubin", label: "Bilirrubina total", unit: "mg/dL", min: 0, max: 100, step: 0.1 },
      { key: "albumin", label: "Albúmina", unit: "g/dL", min: 0.1, max: 10, step: 0.1 },
      { key: "inr", label: "INR", min: 0.1, max: 20, step: 0.1 },
      choices("ascites", "Ascitis", [{ value: "0", label: "Ausente · 1 punto" }, { value: "1", label: "Leve/controlada · 2 puntos" }, { value: "2", label: "Moderada o grave · 3 puntos" }]),
      choices("encephalopathy", "Encefalopatía", [{ value: "0", label: "Ausente · 1 punto" }, { value: "1", label: "Grado I–II · 2 puntos" }, { value: "2", label: "Grado III–IV · 3 puntos" }]),
    ],
    sourceLabel: "Merck Manual Professional · Child-Turcotte-Pugh",
    source: "https://www.merckmanuals.com/professional/multimedia/table/child-turcotte-pugh-scoring-system",
    note: "Suma cinco dominios y clasifica A (5–6), B (7–9) o C (10–15). Las variables clínicas requieren evaluación profesional; la puntuación no reemplaza juicio clínico ni determina tratamiento por sí sola.",
    calculate: (values) => {
      const bilirubin = number(values, "bilirubin");
      const albumin = number(values, "albumin");
      const inr = number(values, "inr");
      const points = (bilirubin < 2 ? 1 : bilirubin <= 3 ? 2 : 3)
        + (albumin > 3.5 ? 1 : albumin >= 2.8 ? 2 : 3)
        + (inr < 1.7 ? 1 : inr <= 2.3 ? 2 : 3)
        + 1 + number(values, "ascites")
        + 1 + number(values, "encephalopathy");
      const category = points <= 6 ? "A" : points <= 9 ? "B" : "C";
      return `${points} puntos · clase ${category}`;
    },
  },
  "cha2ds2-vasc": {
    fields: [
      { ...adultAge, max: 110 },
      { key: "female", label: "Categoría sexual femenina", kind: "checkbox" },
      { key: "heartFailure", label: "Insuficiencia cardiaca / disfunción ventricular", kind: "checkbox" },
      { key: "hypertension", label: "Hipertensión", kind: "checkbox" },
      { key: "diabetes", label: "Diabetes", kind: "checkbox" },
      { key: "stroke", label: "Evento cerebrovascular, AIT o embolia previa", kind: "checkbox" },
      { key: "vascular", label: "Enfermedad vascular (p. ej., infarto o enfermedad arterial periférica)", kind: "checkbox" },
    ],
    sourceLabel: "AHA/ACC · Guía de fibrilación auricular 2023",
    source: "https://www.ahajournals.org/doi/10.1161/CIR.0000000000001193",
    note: "La puntuación es una herramienta de estratificación en fibrilación auricular, no indica por sí sola tratamiento. El riesgo absoluto varía entre poblaciones y debe valorarse junto con el contexto clínico y la guía vigente.",
    calculate: (values) => {
      const age = number(values, "age");
      const score = (yes(values, "heartFailure") ? 1 : 0)
        + (yes(values, "hypertension") ? 1 : 0)
        + (age >= 75 ? 2 : age >= 65 ? 1 : 0)
        + (yes(values, "diabetes") ? 1 : 0)
        + (yes(values, "stroke") ? 2 : 0)
        + (yes(values, "vascular") ? 1 : 0)
        + (yes(values, "female") ? 1 : 0);
      return `${score} puntos CHA₂DS₂-VASc`;
    },
  },
  qsofa: {
    fields: [
      { key: "respiratoryRate", label: "Frecuencia respiratoria", unit: "/min", min: 1, max: 100, step: 1 },
      { key: "systolic", label: "Presión sistólica", unit: "mmHg", min: 20, max: 300, step: 1 },
      { key: "altered", label: "Alteración del estado mental (Glasgow <15)", kind: "checkbox" },
    ],
    sourceLabel: "Sepsis-3 · JAMA",
    source: "https://jamanetwork.com/journals/jama/fullarticle/2492881",
    note: "Herramienta rápida para adultos con sospecha de infección; qSOFA ≥2 identifica mayor riesgo de malos desenlaces y exige valoración. No diagnostica sepsis y un puntaje bajo no debe retrasar evaluación o tratamiento.",
    calculate: (values) => {
      const score = (number(values, "respiratoryRate") >= 22 ? 1 : 0)
        + (number(values, "systolic") <= 100 ? 1 : 0)
        + (yes(values, "altered") ? 1 : 0);
      return `${score}/3 puntos${score >= 2 ? " · qSOFA ≥2: valorar de inmediato el contexto clínico" : ""}`;
    },
  },
  news2: {
    fields: [
      { key: "respiratoryRate", label: "Frecuencia respiratoria", unit: "/min", min: 1, max: 100, step: 1 },
      { key: "oxygenSaturation", label: "Saturación de oxígeno", unit: "%", min: 50, max: 100, step: 1 },
      choices("scale", "Escala de saturación", [{ value: "1", label: "Escala 1" }, { value: "2", label: "Escala 2 (solo indicación clínica de hipercapnia)" }]),
      { key: "supplementalOxygen", label: "Recibe oxígeno suplementario", kind: "checkbox" },
      { key: "systolic", label: "Presión sistólica", unit: "mmHg", min: 20, max: 300, step: 1 },
      { key: "pulse", label: "Frecuencia cardiaca", unit: "/min", min: 1, max: 300, step: 1 },
      { key: "temperature", label: "Temperatura", unit: "°C", min: 25, max: 45, step: 0.1 },
      choices("consciousness", "Estado de conciencia", [{ value: "alert", label: "Alerta" }, { value: "cvpu", label: "Confusión nueva o responde a voz/dolor/no responde" }]),
    ],
    sourceLabel: "Royal College of Physicians · NEWS2",
    source: "https://www.rcp.ac.uk/resources/national-early-warning-score-news-2/",
    note: "Aplicar solo a adultos y usar la escala 2 únicamente cuando esté clínicamente indicada. El puntaje orienta respuesta a deterioro; seguir el protocolo local y no sustituye evaluación clínica.",
    calculate: (values) => {
      const rr = number(values, "respiratoryRate");
      const spo2 = number(values, "oxygenSaturation");
      const sbp = number(values, "systolic");
      const pulse = number(values, "pulse");
      const temp = number(values, "temperature");
      const respScore = rr <= 8 ? 3 : rr <= 11 ? 1 : rr <= 20 ? 0 : rr <= 24 ? 2 : 3;
      const satScore = values.scale === "1"
        ? spo2 <= 91 ? 3 : spo2 <= 93 ? 2 : spo2 <= 95 ? 1 : 0
        : spo2 <= 83 ? 3 : spo2 <= 85 ? 2 : spo2 <= 87 ? 1 : spo2 <= 92 || !yes(values, "supplementalOxygen") ? 0 : spo2 <= 94 ? 1 : spo2 <= 96 ? 2 : 3;
      const sbpScore = sbp <= 90 ? 3 : sbp <= 100 ? 2 : sbp <= 110 ? 1 : sbp <= 219 ? 0 : 3;
      const pulseScore = pulse <= 40 ? 3 : pulse <= 50 ? 1 : pulse <= 90 ? 0 : pulse <= 110 ? 1 : pulse <= 130 ? 2 : 3;
      const tempScore = temp <= 35 ? 3 : temp <= 36 ? 1 : temp <= 38 ? 0 : temp <= 39 ? 1 : 2;
      const score = respScore + satScore + (yes(values, "supplementalOxygen") ? 2 : 0) + sbpScore + pulseScore + tempScore + (values.consciousness === "cvpu" ? 3 : 0);
      const maxSingle = Math.max(respScore, satScore, sbpScore, pulseScore, tempScore, values.consciousness === "cvpu" ? 3 : 0);
      const escalation = score >= 7 ? " · activa respuesta urgente según protocolo local" : score >= 5 || maxSingle === 3 ? " · requiere valoración prioritaria según protocolo local" : "";
      return `${score} puntos NEWS2${escalation}`;
    },
  },
  "wells-tep": {
    fields: [
      { key: "dvtSigns", label: "Signos clínicos de TVP", kind: "checkbox" },
      { key: "peLikely", label: "TEP más probable que un diagnóstico alternativo (juicio clínico)", kind: "checkbox" },
      { key: "heartRate", label: "Frecuencia cardiaca", unit: "/min", min: 1, max: 300, step: 1 },
      { key: "immobilization", label: "Inmovilización ≥3 días o cirugía en las últimas 4 semanas", kind: "checkbox" },
      { key: "previousVte", label: "TEP o TVP previa", kind: "checkbox" },
      { key: "hemoptysis", label: "Hemoptisis", kind: "checkbox" },
      { key: "malignancy", label: "Cáncer activo o tratamiento en los últimos 6 meses", kind: "checkbox" },
    ],
    sourceLabel: "Wells et al. · Clinical prediction rule for PE",
    source: "https://pubmed.ncbi.nlm.nih.gov/10744147/",
    note: "Puntaje original de dos niveles: >4 TEP probable; ≤4 TEP improbable. Estima probabilidad preprueba para apoyar el algoritmo diagnóstico; no confirma ni descarta TEP y no sustituye evaluación urgente cuando se sospecha.",
    calculate: (values) => {
      const score = (yes(values, "dvtSigns") ? 3 : 0)
        + (yes(values, "peLikely") ? 3 : 0)
        + (number(values, "heartRate") > 100 ? 1.5 : 0)
        + (yes(values, "immobilization") ? 1.5 : 0)
        + (yes(values, "previousVte") ? 1.5 : 0)
        + (yes(values, "hemoptysis") ? 1 : 0)
        + (yes(values, "malignancy") ? 1 : 0);
      return `${score.toFixed(1)} puntos · ${score > 4 ? "TEP probable" : "TEP improbable"} (modelo de dos niveles)`;
    },
  },
  "wells-tv": {
    fields: [
      { key: "cancer", label: "Cáncer activo (tratamiento, paliación o últimos 6 meses)", kind: "checkbox" },
      { key: "paralysis", label: "Parálisis, paresia o inmovilización con yeso de extremidad inferior", kind: "checkbox" },
      { key: "bedridden", label: "Encamamiento ≥3 días o cirugía mayor en últimas 12 semanas", kind: "checkbox" },
      { key: "tenderness", label: "Dolor a lo largo del sistema venoso profundo", kind: "checkbox" },
      { key: "wholeLeg", label: "Pierna completa hinchada", kind: "checkbox" },
      { key: "calf", label: "Pantorrilla ≥3 cm mayor que la contralateral", kind: "checkbox" },
      { key: "edema", label: "Edema con fóvea limitado a la pierna sintomática", kind: "checkbox" },
      { key: "veins", label: "Venas colaterales superficiales no varicosas", kind: "checkbox" },
      { key: "previousDvt", label: "TVP previamente documentada", kind: "checkbox" },
      { key: "alternative", label: "Diagnóstico alternativo igual o más probable", kind: "checkbox" },
    ],
    sourceLabel: "NICE NG158 · Wells para TVP de dos niveles",
    source: "https://www.nice.org.uk/guidance/ng158/chapter/recommendations",
    note: "Puntaje ≥2: TVP probable; ≤1: TVP improbable. Es una herramienta de probabilidad clínica que debe acompañarse del algoritmo diagnóstico y pruebas indicadas; no diagnostica ni descarta TVP por sí sola.",
    calculate: (values) => {
      const positives = ["cancer", "paralysis", "bedridden", "tenderness", "wholeLeg", "calf", "edema", "veins", "previousDvt"];
      const score = positives.reduce((sum, key) => sum + (yes(values, key) ? 1 : 0), 0) - (yes(values, "alternative") ? 2 : 0);
      return `${score} puntos · ${score >= 2 ? "TVP probable" : "TVP improbable"} (modelo de dos niveles)`;
    },
  },
  heart: {
    fields: [
      choices("history", "Historia clínica (juicio clínico)", [{ value: "0", label: "Poco sospechosa · 0" }, { value: "1", label: "Moderadamente sospechosa · 1" }, { value: "2", label: "Altamente sospechosa · 2" }]),
      choices("ecg", "ECG", [{ value: "0", label: "Sin alteraciones significativas · 0" }, { value: "1", label: "Alteración inespecífica de repolarización · 1" }, { value: "2", label: "Desviación significativa del ST · 2" }]),
      { key: "age", label: "Edad", unit: "años", min: 18, max: 120, step: 1 },
      choices("riskFactors", "Factores de riesgo cardiovascular", [{ value: "0", label: "Ninguno conocido · 0" }, { value: "1", label: "1–2 factores · 1" }, { value: "2", label: "≥3 factores o ateroesclerosis conocida · 2" }]),
      { key: "troponinRatio", label: "Troponina / límite superior normal del laboratorio", unit: "veces el límite", min: 0, max: 100, step: 0.01 },
    ],
    sourceLabel: "Six et al. · HEART score for chest pain",
    source: "https://pmc.ncbi.nlm.nih.gov/articles/PMC2442661/",
    note: "Herramienta para valoración de dolor torácico en urgencias; historia y ECG requieren juicio clínico. Usa el límite superior normal del ensayo local y protocolo validado. No diagnostica ni excluye síndrome coronario agudo por sí sola.",
    calculate: (values) => {
      const age = number(values, "age");
      const agePoints = age < 45 ? 0 : age < 65 ? 1 : 2;
      const trop = number(values, "troponinRatio");
      const troponinPoints = trop <= 1 ? 0 : trop <= 3 ? 1 : 2;
      const score = number(values, "history") + number(values, "ecg") + agePoints + number(values, "riskFactors") + troponinPoints;
      return `${score}/10 puntos HEART`;
    },
  },
};
