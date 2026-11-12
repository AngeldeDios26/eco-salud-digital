"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { createClient } from "../../../lib/supabase/client";
import {
  emptyProfessionalProfile,
  normalizeProfessionalProfile,
  professionalProfileStorageKey,
  readSessionProfessionalProfile,
  type ProfessionalProfile,
} from "../../../lib/professional-profile";

const fields: { key: keyof ProfessionalProfile; label: string; type?: string }[] = [
  { key: "nombre", label: "Nombre completo" },
  { key: "matricula", label: "Matrícula" },
  { key: "cedula", label: "Cédula profesional" },
  { key: "unidad", label: "Unidad médica" },
];

const inputClass = "mt-2 w-full rounded-xl border border-[#DCE9E6] bg-white px-4 py-3 text-[#123C50] outline-none focus:border-[#18A69A] focus:ring-2 focus:ring-[#18A69A]/15";

export default function ProfessionalProfilePage() {
  const [profile, setProfile] = useState<ProfessionalProfile>(emptyProfessionalProfile);
  const [status, setStatus] = useState("Cargando los datos disponibles…");

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const saved = readSessionProfessionalProfile();
      if (saved) {
        setProfile(saved);
        setStatus("Se cargó el perfil guardado en esta sesión.");
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
        };
        setProfile((current) => ({
          nombre: current.nombre || fromAuth.nombre,
          matricula: current.matricula || fromAuth.matricula,
          cedula: current.cedula || fromAuth.cedula,
          unidad: current.unidad || fromAuth.unidad,
        }));
        setStatus("Se cargaron los datos disponibles del perfil profesional.");
      }).catch(() => {
        if (active && !readSessionProfessionalProfile()) setStatus("No se pudo consultar el perfil. Puedes completar los datos para esta demostración.");
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
      window.sessionStorage.setItem(professionalProfileStorageKey, JSON.stringify(normalized));
      setProfile(normalized);
      setStatus("Perfil guardado solo en esta sesión. Se usará para completar los datos del médico en la consulta.");
    } catch {
      setStatus("No se pudo guardar el perfil en esta sesión. Puedes completar los datos manualmente en la consulta.");
    }
  };

  const clear = () => {
    try { window.sessionStorage.removeItem(professionalProfileStorageKey); } catch { /* The form still clears in memory. */ }
    setProfile(emptyProfessionalProfile);
    setStatus("Se borró el perfil de esta sesión.");
  };

  return (
    <main className="min-h-screen bg-[#F4F8F7] px-5 py-8 text-[#123C50] sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="font-bold text-[#16877F]">← Volver al inicio</Link>
        <p className="mt-7 text-sm font-bold uppercase tracking-widest text-[#18A69A]">Herramientas para profesionales</p>
        <h1 className="mt-2 text-3xl font-extrabold">Mi perfil</h1>
        <p className="mt-2 text-slate-600">Completa los datos que aparecen en la hoja clínica. Si hay una sesión conectada, se cargan los valores disponibles del perfil profesional.</p>
        <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">Demostración: estos datos se conservan solo en esta pestaña y no se envían a un expediente médico.</p>

        <form onSubmit={save} className="mt-6 space-y-5 rounded-2xl border border-[#DCE9E6] bg-white p-6 shadow-sm">
          {fields.map(({ key, label }) => (
            <label key={key} className="block text-sm font-semibold">
              {label}
              <input className={inputClass} name={key} value={profile[key]} onChange={(event) => setProfile((current) => ({ ...current, [key]: event.target.value }))} maxLength={180} required={key === "nombre"} />
            </label>
          ))}
          <div className="flex flex-wrap gap-3 pt-2">
            <button type="submit" className="rounded-xl bg-[#18A69A] px-5 py-3 font-bold text-white hover:bg-[#16877F]">Guardar en esta sesión</button>
            <button type="button" onClick={clear} className="rounded-xl border border-[#DCE9E6] px-5 py-3 font-bold">Borrar perfil</button>
            <Link href="/profesionales/consulta/hoja-clinica" className="rounded-xl border border-[#18A69A] px-5 py-3 font-bold text-[#123C50]">Iniciar consulta</Link>
          </div>
        </form>
        <p role="status" className="mt-4 rounded-xl bg-white p-4 text-sm text-slate-700">{status}</p>
      </div>
    </main>
  );
}
