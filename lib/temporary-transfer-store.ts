import { createHash, randomBytes } from "node:crypto";

export type PatientHistoryEntry = {
  fecha: string;
  diagnostico: string;
  tratamiento: string;
  atendidoPor: string;
};

export type PatientQrData = {
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
  historialTemporal?: PatientHistoryEntry[];
};

type PendingTransfer = {
  data: PatientQrData;
  expiresAt: number;
  timer: NodeJS.Timeout;
};

const lifetimeMs = 5 * 60 * 1000;
const maxPendingTransfers = 200;

type TransferGlobal = typeof globalThis & {
  __ecoSaludPendingTransfers?: Map<string, PendingTransfer>;
};

function getStore() {
  const scope = globalThis as TransferGlobal;
  scope.__ecoSaludPendingTransfers ??= new Map<string, PendingTransfer>();
  return scope.__ecoSaludPendingTransfers;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createTemporaryTransfer(data: PatientQrData) {
  const store = getStore();
  const now = Date.now();
  for (const [hash, transfer] of store) {
    if (transfer.expiresAt <= now) {
      clearTimeout(transfer.timer);
      store.delete(hash);
    }
  }
  if (store.size >= maxPendingTransfers) return null;

  const token = randomBytes(32).toString("base64url");
  const hash = hashToken(token);
  const expiresAt = now + lifetimeMs;
  const timer = setTimeout(() => store.delete(hash), lifetimeMs);
  timer.unref();
  store.set(hash, { data, expiresAt, timer });
  return { code: "ESD1." + token, expiresAt };
}

export function consumeTemporaryTransfer(code: string) {
  if (!/^ESD1\.[A-Za-z0-9_-]{43}$/.test(code)) return null;
  const store = getStore();
  const hash = hashToken(code.slice(5));
  const transfer = store.get(hash);
  if (!transfer) return null;
  clearTimeout(transfer.timer);
  store.delete(hash);
  if (transfer.expiresAt <= Date.now()) return null;
  return transfer.data;
}

export function revokeTemporaryTransfer(code: string) {
  if (!/^ESD1\.[A-Za-z0-9_-]{43}$/.test(code)) return false;
  const store = getStore();
  const hash = hashToken(code.slice(5));
  const transfer = store.get(hash);
  if (!transfer) return false;
  clearTimeout(transfer.timer);
  store.delete(hash);
  return true;
}

export function validatePatientQrData(value: unknown): PatientQrData | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const text = (key: string, maxLength: number) => {
    const field = record[key];
    return typeof field === "string" && field.length <= maxLength ? field.trim() : null;
  };
  const nombre = text("nombre", 160);
  const fechaNacimiento = text("fechaNacimiento", 10);
  const sexo = record.sexo;
  if (!nombre || !fechaNacimiento || !/^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento)) return null;
  const birthDate = new Date(fechaNacimiento + "T00:00:00.000Z");
  if (Number.isNaN(birthDate.getTime()) || birthDate.toISOString().slice(0, 10) !== fechaNacimiento || birthDate.getTime() > Date.now()) return null;
  if (sexo !== "femenino" && sexo !== "masculino" && sexo !== "otro" && sexo !== "sin-especificar") return null;

  const measurement = (key: string, min: number, max: number) => {
    const field = record[key];
    if (field === null || field === undefined || field === "") return null;
    if (typeof field !== "number" || !Number.isFinite(field) || field < min || field > max) return undefined;
    return field;
  };
  const pesoKg = measurement("pesoKg", 0.1, 500);
  const tallaCm = measurement("tallaCm", 20, 260);
  if (pesoKg === undefined || tallaCm === undefined) return null;

  const alergias = text("alergias", 2000);
  const medicamentosActuales = text("medicamentosActuales", 2000);
  const enfermedadesCronicas = text("enfermedadesCronicas", 3000);
  const cirugias = text("cirugias", 2000);
  const antecedentesGinecoobstetricos = text("antecedentesGinecoobstetricos", 2000);
  if ([alergias, medicamentosActuales, enfermedadesCronicas, cirugias, antecedentesGinecoobstetricos].some((field) => field === null)) return null;

  let historialTemporal: PatientHistoryEntry[] | undefined;
  if (Array.isArray(record.historialTemporal)) {
    historialTemporal = record.historialTemporal
      .slice(0, 20)
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item))
      .map((item) => ({
        fecha: typeof item.fecha === "string" ? item.fecha.trim().slice(0, 20) : "",
        diagnostico: typeof item.diagnostico === "string" ? item.diagnostico.trim().slice(0, 240) : "",
        tratamiento: typeof item.tratamiento === "string" ? item.tratamiento.trim().slice(0, 400) : "",
        atendidoPor: typeof item.atendidoPor === "string" ? item.atendidoPor.trim().slice(0, 160) : "",
      }))
      .filter((item) => item.fecha || item.diagnostico || item.tratamiento);
  }

  return { nombre, fechaNacimiento, sexo, pesoKg, tallaCm, alergias: alergias!, medicamentosActuales: medicamentosActuales!, enfermedadesCronicas: enfermedadesCronicas!, cirugias: cirugias!, antecedentesGinecoobstetricos: antecedentesGinecoobstetricos!, ...(historialTemporal?.length ? { historialTemporal } : {}) };
}
