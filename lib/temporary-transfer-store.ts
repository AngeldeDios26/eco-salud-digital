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
  antecedentesNoPatologicos?: string;
  toxicomanias?: string;
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

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) return null;
  return { url: url.replace(/\/+$/, ""), serviceKey };
}

export async function createTemporaryTransfer(data: PatientQrData) {
  const token = randomBytes(32).toString("base64url");
  const hash = hashToken(token);
  const now = Date.now();
  const expiresAt = now + lifetimeMs;
  const code = "ESD1." + token;

  const supa = getSupabaseConfig();
  if (supa) {
    try {
      const response = await fetch(`${supa.url}/rest/v1/temporary_transfers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supa.serviceKey,
          Authorization: `Bearer ${supa.serviceKey}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          token_hash: hash,
          payload: data,
          expires_at: new Date(expiresAt).toISOString(),
        }),
      });
      if (response.ok) return { code, expiresAt };
    } catch {
      // Fallback to in-memory store if Supabase is unreachable
    }
  }

  const store = getStore();
  for (const [existingHash, transfer] of store) {
    if (transfer.expiresAt <= now) {
      clearTimeout(transfer.timer);
      store.delete(existingHash);
    }
  }
  if (store.size >= maxPendingTransfers) return null;

  const timer = setTimeout(() => store.delete(hash), lifetimeMs);
  timer.unref();
  store.set(hash, { data, expiresAt, timer });
  return { code, expiresAt };
}

export async function consumeTemporaryTransfer(code: string) {
  if (!/^ESD1\.[A-Za-z0-9_-]{43}$/.test(code)) return null;
  const hash = hashToken(code.slice(5));

  const supa = getSupabaseConfig();
  if (supa) {
    try {
      const response = await fetch(
        `${supa.url}/rest/v1/temporary_transfers?token_hash=eq.${encodeURIComponent(hash)}&select=payload,expires_at`,
        {
          method: "DELETE",
          headers: {
            apikey: supa.serviceKey,
            Authorization: `Bearer ${supa.serviceKey}`,
            Prefer: "return=representation",
          },
        },
      );
      if (response.ok) {
        const rows = (await response.json()) as {
          payload?: PatientQrData;
          expires_at?: string;
        }[];
        const row = rows[0];
        if (row?.payload && row.expires_at) {
          if (Date.parse(row.expires_at) > Date.now()) {
            return row.payload;
          }
          return null;
        }
      }
    } catch {
      // Fallback to in-memory store
    }
  }

  const store = getStore();
  const transfer = store.get(hash);
  if (!transfer) return null;
  clearTimeout(transfer.timer);
  store.delete(hash);
  if (transfer.expiresAt <= Date.now()) return null;
  return transfer.data;
}

export async function revokeTemporaryTransfer(code: string) {
  if (!/^ESD1\.[A-Za-z0-9_-]{43}$/.test(code)) return false;
  const hash = hashToken(code.slice(5));

  const supa = getSupabaseConfig();
  if (supa) {
    try {
      const response = await fetch(
        `${supa.url}/rest/v1/temporary_transfers?token_hash=eq.${encodeURIComponent(hash)}`,
        {
          method: "DELETE",
          headers: {
            apikey: supa.serviceKey,
            Authorization: `Bearer ${supa.serviceKey}`,
          },
        },
      );
      if (response.ok) return true;
    } catch {
      // Fallback to in-memory store
    }
  }

  const store = getStore();
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
  const antecedentesNoPatologicos = text("antecedentesNoPatologicos", 2000) ?? "";
  const toxicomanias = text("toxicomanias", 1000) ?? "";
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

  return { nombre, fechaNacimiento, sexo, pesoKg, tallaCm, alergias: alergias!, medicamentosActuales: medicamentosActuales!, enfermedadesCronicas: enfermedadesCronicas!, antecedentesNoPatologicos, toxicomanias, cirugias: cirugias!, antecedentesGinecoobstetricos: antecedentesGinecoobstetricos!, ...(historialTemporal?.length ? { historialTemporal } : {}) };
}
