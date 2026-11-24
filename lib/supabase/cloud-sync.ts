import { createClient, isSupabaseBrowserConfigured } from "./client";
import type { ProfessionalProfile } from "../professional-profile";

export type CloudAuthResult = {
  ok: boolean;
  mode: "supabase" | "local";
  userId?: string;
  needsEmailConfirmation?: boolean;
  error?: string;
};

export type CloudPatientProfile = {
  nombre: string;
  fechaNacimiento: string;
  sexo: "femenino" | "masculino" | "otro" | "sin-especificar";
  pesoKg: string;
  tallaCm: string;
  antecedentesPatologicos: string;
  cirugias: string;
  antecedentesNoPatologicos: string;
  toxicomanias: string;
  alergias: string;
  medicamentosActuales: string;
  antecedentesGinecoobstetricos: string;
};

export type CloudPatientHistoryItem = {
  id: string;
  fecha: string;
  diagnostico: string;
  tratamiento: string;
  atendidoPor: string;
};

export async function signInSupabaseIfConfigured(
  email: string,
  password: string,
): Promise<CloudAuthResult> {
  if (!isSupabaseBrowserConfigured() || !email.includes("@")) {
    return { ok: true, mode: "local" };
  }
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      return { ok: false, mode: "supabase", error: error.message };
    }
    return { ok: true, mode: "supabase", userId: data.user?.id };
  } catch (err) {
    return {
      ok: false,
      mode: "supabase",
      error: err instanceof Error ? err.message : "Error de autenticación.",
    };
  }
}

export async function signUpSupabaseIfConfigured(
  email: string,
  password: string,
  metadata: Record<string, string>,
): Promise<CloudAuthResult> {
  if (!isSupabaseBrowserConfigured() || !email.includes("@")) {
    return { ok: true, mode: "local" };
  }
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: metadata },
    });
    if (error) {
      return { ok: false, mode: "supabase", error: error.message };
    }
    return {
      ok: true,
      mode: "supabase",
      userId: data.user?.id,
      needsEmailConfirmation: Boolean(data.user && !data.session),
    };
  } catch (err) {
    return {
      ok: false,
      mode: "supabase",
      error: err instanceof Error ? err.message : "Error de registro.",
    };
  }
}

export async function signOutSupabaseIfConfigured(): Promise<void> {
  if (!isSupabaseBrowserConfigured()) return;
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch {
    // Ignorar en modo local
  }
}

export async function loadProfessionalProfileFromCloud(): Promise<ProfessionalProfile | null> {
  if (!isSupabaseBrowserConfigured()) return null;
  try {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return null;

    const { data, error } = await supabase
      .from("professional_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data) return null;

    return {
      nombre: typeof data.nombre === "string" ? data.nombre : "",
      matricula: typeof data.consultorio === "string" ? data.consultorio : "",
      cedula: typeof data.cedula === "string" ? data.cedula : "",
      unidad: typeof data.institucion === "string" ? data.institucion : "",
      exploracionPersonalizada:
        typeof data.exploracion_personalizada === "string"
          ? data.exploracion_personalizada
          : "",
      pacientePlantilla:
        typeof data.paciente_plantilla === "string" ? data.paciente_plantilla : "",
      padecimientoPlantilla:
        typeof data.padecimiento_plantilla === "string"
          ? data.padecimiento_plantilla
          : "",
      ginecoPlantilla:
        typeof data.gineco_plantilla === "string" ? data.gineco_plantilla : "",
    };
  } catch {
    return null;
  }
}

export async function syncProfessionalProfileToCloud(
  profile: ProfessionalProfile,
): Promise<boolean> {
  if (!isSupabaseBrowserConfigured()) return false;
  try {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return false;

    const { error } = await supabase.from("professional_profiles").upsert(
      {
        user_id: user.id,
        nombre: profile.nombre,
        cedula: profile.cedula,
        institucion: profile.unidad,
        consultorio: profile.matricula,
        correo: user.email ?? "",
        paciente_plantilla: profile.pacientePlantilla,
        padecimiento_plantilla: profile.padecimientoPlantilla,
        gineco_plantilla: profile.ginecoPlantilla,
        exploracion_personalizada: profile.exploracionPersonalizada,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    return !error;
  } catch {
    return false;
  }
}

export async function loadPatientDataFromCloud(): Promise<{
  profile: CloudPatientProfile | null;
  history: CloudPatientHistoryItem[] | null;
}> {
  if (!isSupabaseBrowserConfigured()) return { profile: null, history: null };
  try {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return { profile: null, history: null };

    const [profileRes, historyRes] = await Promise.all([
      supabase
        .from("patient_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("patient_history_entries")
        .select("id, fecha, diagnostico, tratamiento, atendido_por")
        .eq("user_id", user.id)
        .order("fecha", { ascending: false }),
    ]);

    const p = profileRes.data;
    const loadedProfile: CloudPatientProfile | null = p
      ? {
          nombre: p.nombre ?? "",
          fechaNacimiento: p.fecha_nacimiento ?? "",
          sexo:
            p.sexo === "femenino" ||
            p.sexo === "masculino" ||
            p.sexo === "otro"
              ? p.sexo
              : "sin-especificar",
          pesoKg: p.peso_kg ?? "",
          tallaCm: p.talla_cm ?? "",
          antecedentesPatologicos: p.antecedentes_patologicos ?? "",
          cirugias: p.cirugias ?? "",
          antecedentesNoPatologicos: p.antecedentes_no_patologicos ?? "",
          toxicomanias: p.toxicomanias ?? "",
          alergias: p.alergias ?? "",
          medicamentosActuales: p.medicamentos_actuales ?? "",
          antecedentesGinecoobstetricos: p.antecedentes_ginecoobstetricos ?? "",
        }
      : null;

    const loadedHistory: CloudPatientHistoryItem[] | null = Array.isArray(
      historyRes.data,
    )
      ? historyRes.data.map((row) => ({
          id: String(row.id),
          fecha: String(row.fecha ?? ""),
          diagnostico: String(row.diagnostico ?? ""),
          tratamiento: String(row.tratamiento ?? ""),
          atendidoPor: String(row.atendido_por ?? "Médico tratante"),
        }))
      : null;

    return { profile: loadedProfile, history: loadedHistory };
  } catch {
    return { profile: null, history: null };
  }
}

export async function syncPatientProfileToCloud(
  profile: CloudPatientProfile,
): Promise<boolean> {
  if (!isSupabaseBrowserConfigured()) return false;
  try {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return false;

    const { error } = await supabase.from("patient_profiles").upsert(
      {
        user_id: user.id,
        nombre: profile.nombre,
        fecha_nacimiento: profile.fechaNacimiento,
        sexo: profile.sexo,
        peso_kg: profile.pesoKg,
        talla_cm: profile.tallaCm,
        antecedentes_patologicos: profile.antecedentesPatologicos,
        cirugias: profile.cirugias,
        antecedentes_no_patologicos: profile.antecedentesNoPatologicos,
        toxicomanias: profile.toxicomanias,
        alergias: profile.alergias,
        medicamentos_actuales: profile.medicamentosActuales,
        antecedentes_ginecoobstetricos: profile.antecedentesGinecoobstetricos,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    return !error;
  } catch {
    return false;
  }
}

export async function insertPatientHistoryToCloud(
  entry: Omit<CloudPatientHistoryItem, "id">,
): Promise<string | null> {
  if (!isSupabaseBrowserConfigured()) return null;
  try {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return null;

    const { data, error } = await supabase
      .from("patient_history_entries")
      .insert({
        user_id: user.id,
        fecha: entry.fecha,
        diagnostico: entry.diagnostico,
        tratamiento: entry.tratamiento,
        atendido_por: entry.atendidoPor,
      })
      .select("id")
      .single();

    if (error || !data?.id) return null;
    return String(data.id);
  } catch {
    return null;
  }
}

export async function deletePatientHistoryFromCloud(
  id: string,
): Promise<boolean> {
  if (!isSupabaseBrowserConfigured()) return false;
  if (id.startsWith("hist-")) return false;
  try {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return false;

    const { error } = await supabase
      .from("patient_history_entries")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    return !error;
  } catch {
    return false;
  }
}
