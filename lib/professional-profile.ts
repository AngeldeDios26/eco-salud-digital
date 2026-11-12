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

export function readProfessionalProfile(): ProfessionalProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(professionalProfileStorageKey);
    if (stored) return normalizeProfessionalProfile(JSON.parse(stored));
  } catch {
    // Continue with the previous tab-scoped profile when local storage is unavailable.
  }
  try {
    const tabStored = window.sessionStorage.getItem(professionalProfileStorageKey);
    if (!tabStored) return null;
    const profile = normalizeProfessionalProfile(JSON.parse(tabStored));
    if (!profile) return null;
    try {
      window.localStorage.setItem(professionalProfileStorageKey, JSON.stringify(profile));
      window.sessionStorage.removeItem(professionalProfileStorageKey);
    } catch {
      // Keep using the migrated value for this page even if persistence is unavailable.
    }
    return profile;
  } catch {
    return null;
  }
}

export function saveProfessionalProfile(profile: ProfessionalProfile) {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(professionalProfileStorageKey, JSON.stringify(profile));
    return true;
  } catch {
    return false;
  }
}

export function clearProfessionalProfile() {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.removeItem(professionalProfileStorageKey);
    window.sessionStorage.removeItem(professionalProfileStorageKey);
    return true;
  } catch {
    return false;
  }
}
