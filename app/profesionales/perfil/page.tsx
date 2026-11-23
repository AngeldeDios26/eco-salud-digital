"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { createClient } from "../../../lib/supabase/client";
import {
  emptyProfessionalProfile,
  normalizeProfessionalProfile,
  clearProfessionalProfile,
  readProfessionalProfile,
  saveProfessionalProfile,
  type ProfessionalProfile,
} from "../../../lib/professional-profile";

const fields: { key: Exclude<keyof ProfessionalProfile, "exploracionPersonalizada" | "pacientePlantilla" | "padecimientoPlantilla">; label: string; type?: string }[] = [
  { key: "nombre", label: "Nombre completo" },
  { key: "matricula", label: "Matrícula" },
  { key: "cedula", label: "Cédula profesional" },
  { key: "unidad", label: "Unidad médica" },
];

const inputClass = "mt-2 w-full rounded-xl border border-[#D6E6E1] bg-white px-4 py-3 text-[#0F2D3D] outline-none focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/15";

export default function ProfessionalProfilePage() {
  const [profile, setProfile] = useState<ProfessionalProfile>(emptyProfessionalProfile);
  const [status, setStatus] = useState("Cargando los datos disponibles…");

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const saved = readProfessionalProfile();
      if (saved) {
        setProfile(saved);
        setStatus("Se cargó el perfil guardado en este navegador.");
      } else if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
        setStatus("No hay una sesión profesional conectada. Puedes completar los datos para esta demostración.");
      }
    });

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      const client = createClient();
      void client.auth.getUser().then(({ data, error }) => {
        if (!active || error || !data.user) return;
        const metadata = data.user.user_metadata ?? {};
        const readText = (...keys: string[]) => keys.map((key) => metadata[key]).find((value) => typeof value === "string" && value.trim()) as string | undefined ?? "";
        const fromAuth: ProfessionalProfile = {
          nombre: readText("nombre_completo", "nombreCompleto", "full_name", "name"),
          matricula: readText("matricula", "professional_id", "registration_number"),
          cedula: readText("cedula_profesional", "cedulaProfesional", "professional_license"),
          unidad: readText("unidad_medica", "unidadMedica", "medical_unit"),
          exploracionPersonalizada: "",
          pacientePlantilla: "",
          padecimientoPlantilla: "",
        };
        setProfile((current) => ({
          nombre: current.nombre || fromAuth.nombre,
          matricula: current.matricula || fromAuth.matricula,
          cedula: current.cedula || fromAuth.cedula,
          unidad: current.unidad || fromAuth.unidad,
          exploracionPersonalizada: current.exploracionPersonalizada,
          pacientePlantilla: current.pacientePlantilla,
          padecimientoPlantilla: current.padecimientoPlantilla,
        }));
        setStatus("Se cargaron los datos disponibles del perfil profesional.");
      }).catch(() => {
        if (active && !readProfessionalProfile()) setStatus("No se pudo consultar el perfil. Puedes completar los datos para esta demostración.");
      });
    }

    return () => { active = false; };
  }, []);

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = normalizeProfessionalProfile(profile);
    if (!normalized?.nombre) {
      setStatus("Escribe el nombre para guardar el perfil de demostración.");
      return;
    }
    try {
      if (!saveProfessionalProfile(normalized)) throw new Error("El almacenamiento local no está disponible.");
      setProfile(normalized);
      setStatus("Perfil guardado en este navegador. Se usará para completar los datos del médico en futuras consultas.");
    } catch {
      setStatus("No se pudo guardar el perfil en este navegador. Puedes completar los datos manualmente en la consulta.");
    }
  };

  const clear = () => {
    if (!clearProfessionalProfile()) {
      setStatus("No se pudo borrar el perfil del navegador. Puedes borrarlo desde la configuración del navegador.");
      return;
    }
    setProfile(emptyProfessionalProfile);
    setStatus("Se borró el perfil guardado en este navegador.");
  };

  return (
    <main className="min-h-screen bg-[#F6FAF8] px-5 py-8 text-[#0F2D3D] sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="font-bold text-[#0F766E]">← Volver al inicio</Link>
        <p className="mt-7 text-sm font-bold uppercase tracking-widest text-[#0D9488]">Herramientas para profesionales</p>
        <h1 className="mt-2 text-3xl font-extrabold">Mi perfil</h1>
        <p className="mt-2 text-slate-600">Completa los datos que aparecen en la hoja clínica. Si hay una sesión conectada, se cargan los valores disponibles del perfil profesional.</p>
        <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">Los datos profesionales se guardan solo en el almacenamiento local de este navegador para completar futuras consultas. No se envían a un expediente médico y puedes borrarlos desde aquí.</p>

        <form onSubmit={save} className="mt-6 space-y-5 rounded-2xl border border-[#D6E6E1] bg-white p-6 shadow-sm">
          {fields.map(({ key, label }) => (
            <label key={key} className="block text-sm font-semibold">
              {label}
              <input className={inputClass} name={key} value={profile[key]} onChange={(event) => setProfile((current) => ({ ...current, [key]: event.target.value }))} maxLength={180} required={key === "nombre"} />
            </label>
          ))}
          <label className="block text-sm font-semibold">
            Plantilla de ficha de paciente (opcional)
            <span className="mt-1 block text-xs font-normal text-slate-500">
              Si la dejas vacía, se usará: &quot;Fulanita de tal, de sexo Femenina, de 50 años de edad, con número de seguridad social 0000000000, motivo de consulta: xxxxxxxxxxxx&quot;.
            </span>
            <textarea
              className={inputClass + " resize-y"}
              name="pacientePlantilla"
              rows={2}
              maxLength={1000}
              value={profile.pacientePlantilla}
              onChange={(event) => setProfile((current) => ({ ...current, pacientePlantilla: event.target.value }))}
              placeholder="Fulanita de tal, de sexo Femenina, de 50 años de edad, con número de seguridad social 0000000000, motivo de consulta: xxxxxxxxxxxx"
            />
          </label>
          <label className="block text-sm font-semibold">
            Plantilla de padecimiento actual (opcional)
            <span className="mt-1 block text-xs font-normal text-slate-500">
              Si la dejas vacía, se usará: &quot;Refiere inicia su padecimiento actual xxxxxxxxxxxxxxxxx resto preguntado y negado&quot;.
            </span>
            <textarea
              className={inputClass + " resize-y"}
              name="padecimientoPlantilla"
              rows={3}
              maxLength={2000}
              value={profile.padecimientoPlantilla}
              onChange={(event) => setProfile((current) => ({ ...current, padecimientoPlantilla: event.target.value }))}
              placeholder="Refiere inicia su padecimiento actual xxxxxxxxxxxxxxxxx resto preguntado y negado"
            />
          </label>
          <label className="block text-sm font-semibold">
            Exploración física o formato propio (opcional)
            <span className="mt-1 block text-xs font-normal text-slate-500">
              Si capturas aquí tu propio formato de exploración física, aparecerá precargado automáticamente cada vez que inicies una nota clínica.
            </span>
            <textarea
              className={inputClass + " resize-y"}
              name="exploracionPersonalizada"
              rows={7}
              maxLength={4000}
              value={profile.exploracionPersonalizada}
              onChange={(event) => setProfile((current) => ({ ...current, exploracionPersonalizada: event.target.value }))}
              placeholder="Ej. Paciente consciente, orientado, cooperador, cardiopulmonar sin compromiso, abdomen blando depresible sin dolor, extremidades íntegras..."
            />
          </label>
          <div className="flex flex-wrap gap-3 pt-2">
            <button type="submit" className="rounded-xl bg-[#0D9488] px-5 py-3 font-bold text-white hover:bg-[#0F766E]">Guardar perfil</button>
            <button type="button" onClick={clear} className="rounded-xl border border-[#D6E6E1] px-5 py-3 font-bold">Borrar perfil</button>
            <Link href="/profesionales/consulta/hoja-clinica" className="rounded-xl border border-[#0D9488] px-5 py-3 font-bold text-[#0F2D3D]">Iniciar consulta</Link>
          </div>
        </form>
        <p role="status" className="mt-4 rounded-xl bg-white p-4 text-sm text-slate-700">{status}</p>
      </div>
    </main>
  );
}
