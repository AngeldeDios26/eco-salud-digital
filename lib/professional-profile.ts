export type ProfessionalProfile = {
  nombre: string;
  matricula: string;
  cedula: string;
  unidad: string;
};

export const professionalProfileStorageKey = "eco-salud-professional-profile-v1";

export const emptyProfessionalProfile: ProfessionalProfile = {
  nombre: "",
  matricula: "",
  cedula: "",
  unidad: "",
};

export function normalizeProfessionalProfile(value: unknown): ProfessionalProfile | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const read = (key: keyof ProfessionalProfile) =>
    typeof record[key] === "string" ? record[key].trim().slice(0, 180) : "";

  return {
    nombre: read("nombre"),
    matricula: read("matricula"),
    cedula: read("cedula"),
    unidad: read("unidad"),
  };
}

export function readSessionProfessionalProfile(): ProfessionalProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.sessionStorage.getItem(professionalProfileStorageKey);
    return stored ? normalizeProfessionalProfile(JSON.parse(stored)) : null;
  } catch {
    return null;
  }
}
