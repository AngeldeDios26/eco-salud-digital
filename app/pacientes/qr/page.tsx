"use client";
import Link from "next/link";
import Image from "next/image";
import QRCode from "qrcode";
import { FormEvent, useEffect, useState } from "react";

type PatientHistoryEntry = { fecha: string; diagnostico: string; tratamiento: string; atendidoPor: string };
type PatientData = { nombre: string; fechaNacimiento: string; sexo: "femenino" | "masculino" | "otro" | "sin-especificar"; pesoKg: number | null; tallaCm: number | null; alergias: string; medicamentosActuales: string; enfermedadesCronicas: string; cirugias: string; antecedentesGinecoobstetricos: string; historialTemporal?: PatientHistoryEntry[] };
const initial: PatientData = { nombre: "", fechaNacimiento: "", sexo: "sin-especificar", pesoKg: null, tallaCm: null, alergias: "", medicamentosActuales: "", enfermedadesCronicas: "", cirugias: "", antecedentesGinecoobstetricos: "" };
const PATIENT_PROFILE_STORAGE_KEY = "eco-salud-patient-profile-v1";
const PATIENT_HISTORY_STORAGE_KEY = "eco-salud-patient-history-v1";
const input = "mt-2 w-full rounded-xl border border-[#D6E6E1] bg-white px-4 py-3 text-[#0F2D3D] outline-none focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/15";

export default function PatientQrPage() {
  const [data, setData] = useState<PatientData>(initial);
  const [savedHistory, setSavedHistory] = useState<PatientHistoryEntry[]>([]);
  const [shareHistory, setShareHistory] = useState(true);
  const [code, setCode] = useState(""); const [image, setImage] = useState(""); const [expires, setExpires] = useState(0);
  const [status, setStatus] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const rawProfile = window.localStorage.getItem(PATIENT_PROFILE_STORAGE_KEY);
        if (rawProfile) {
          const parsedProfile = JSON.parse(rawProfile) as Partial<PatientData>;
          setData((current) => ({ ...current, ...parsedProfile }));
        }
        const rawHistory = window.localStorage.getItem(PATIENT_HISTORY_STORAGE_KEY);
        if (rawHistory) {
          const parsedHistory = JSON.parse(rawHistory) as PatientHistoryEntry[];
          if (Array.isArray(parsedHistory)) setSavedHistory(parsedHistory);
        }
      } catch {
        // Ignorar
      }
    });
    return () => { active = false; };
  }, []);
  useEffect(() => { if (!code) return; const timer = window.setTimeout(() => { setCode(""); setImage(""); setStatus("El QR venció. Puedes generar uno nuevo si lo necesitas."); }, Math.max(0, expires - Date.now())); return () => window.clearTimeout(timer); }, [code, expires]);
  const update = (key: keyof PatientData, value: string) => setData((current) => ({ ...current, [key]: key === "pesoKg" || key === "tallaCm" ? (value ? Number(value) : null) : value }));
  const revoke = async () => {
    try {
      const response = await fetch("/api/temporary-transfers/revoke", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      if (!response.ok) throw new Error("No se pudo confirmar la cancelación.");
      setStatus("Código cancelado. Ya no se puede consultar con este QR.");
    } catch {
      setStatus("No se confirmó la cancelación. El código seguirá vigente hasta que venza.");
    } finally { setCode(""); setImage(""); }
  };
  const generate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setStatus("");
    const values = new FormData(event.currentTarget);
    const consent = values.get("consent") === "on";
    if (!consent) { setStatus("Confirma la autorización para compartir los datos seleccionados."); setBusy(false); return; }
    const read = (key: string) => String(values.get(key) ?? "");
    const numberOrNull = (key: string) => read(key) ? Number(read(key)) : null;
    const payload: PatientData = {
      nombre: read("nombre"), fechaNacimiento: read("fechaNacimiento"),
      sexo: read("sexo") as PatientData["sexo"], pesoKg: numberOrNull("pesoKg"), tallaCm: numberOrNull("tallaCm"),
      alergias: read("alergias"), medicamentosActuales: read("medicamentosActuales"),
      enfermedadesCronicas: read("enfermedadesCronicas"), cirugias: read("cirugias"),
      antecedentesGinecoobstetricos: read("antecedentesGinecoobstetricos"),
      ...(shareHistory && savedHistory.length > 0 ? { historialTemporal: savedHistory } : {}),
    };
    try { window.localStorage.setItem(PATIENT_PROFILE_STORAGE_KEY, JSON.stringify({ nombre: payload.nombre, fechaNacimiento: payload.fechaNacimiento, sexo: payload.sexo, pesoKg: payload.pesoKg, tallaCm: payload.tallaCm, alergias: payload.alergias, medicamentosActuales: payload.medicamentosActuales, enfermedadesCronicas: payload.enfermedadesCronicas, cirugias: payload.cirugias, antecedentesGinecoobstetricos: payload.antecedentesGinecoobstetricos })); } catch { /* Ignorar */ }
    try { const response = await fetch("/api/temporary-transfers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ consent, data: payload }) }); const result = await response.json() as { code?: string; expiresAt?: number; error?: string }; if (!response.ok || !result.code || !result.expiresAt) throw new Error(result.error ?? "No se pudo generar el QR."); const qr = await QRCode.toDataURL(result.code, { errorCorrectionLevel: "M", margin: 2, width: 280, color: { dark: "#0F2D3D", light: "#FFFFFF" } }); setCode(result.code); setExpires(result.expiresAt); setImage(qr); setStatus("QR listo. Muéstralo a tu médico para que lo lea desde su hoja de consulta."); }
    catch (error) { setStatus(error instanceof Error ? error.message : "No se pudo generar el QR. Intenta de nuevo."); } finally { setBusy(false); }
  };
  const copy = async () => { try { await navigator.clipboard.writeText(code); setStatus("Código copiado. Compártelo solo con tu médico."); } catch { setStatus("Selecciona el código para copiarlo manualmente."); } };
  return <main className="min-h-screen bg-[#F6FAF8] px-5 py-8 text-[#0F2D3D] sm:px-8"><div className="mx-auto max-w-3xl"><Link href="/pacientes" className="font-bold text-[#0F766E]">← Volver al portal de pacientes</Link><h1 className="mt-6 text-3xl font-extrabold">Preparar QR temporal</h1><p className="mt-2 leading-relaxed text-slate-600">Tú decides qué información compartes. El QR contiene un código aleatorio, no tus datos directamente. Tu médico podrá consultar estos datos una sola vez durante los próximos cinco minutos.</p><div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">Demostración: usa datos ficticios. La transferencia se guarda temporalmente en la memoria de esta instalación y se borra al leerla o al vencer el código.</div>
  {image ? <section className="mt-7 rounded-2xl border border-[#D6E6E1] bg-white p-6 text-center shadow-sm"><h2 className="text-xl font-bold">Muestra este QR a tu médico</h2><Image src={image} alt="Código QR temporal para compartir datos con el médico" width={280} height={280} unoptimized className="mx-auto mt-4 h-64 w-64"/><p className="mt-2 text-sm text-slate-600">Vence a las {new Date(expires).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}; después de escanearlo, dejará de funcionar.</p><details className="mx-auto mt-4 max-w-md text-left text-sm"><summary className="cursor-pointer font-semibold">Mostrar código manual</summary><p className="mt-2 break-all rounded bg-slate-50 p-3 font-mono">{code}</p><button type="button" onClick={() => void copy()} className="mt-2 rounded-lg border border-[#0D9488] px-3 py-2 font-bold">Copiar código</button></details><button type="button" onClick={() => void revoke()} className="mt-5 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold">Cancelar QR y editar datos</button></section> : <form onSubmit={generate} className="mt-7 space-y-7 rounded-2xl border border-[#D6E6E1] bg-white p-6 shadow-sm">
  <section><h2 className="text-lg font-bold">Datos de identificación</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold">Nombre completo<input name="nombre" className={input} required maxLength={160} value={data.nombre} onChange={e => update("nombre", e.target.value)}/></label><label className="block text-sm font-semibold">Fecha de nacimiento<input name="fechaNacimiento" className={input} required type="date" value={data.fechaNacimiento} onChange={e => update("fechaNacimiento", e.target.value)}/></label><label className="block text-sm font-semibold">Sexo<select name="sexo" className={input} value={data.sexo} onChange={e => update("sexo", e.target.value)}><option value="sin-especificar">Prefiero no especificar</option><option value="femenino">Femenino</option><option value="masculino">Masculino</option><option value="otro">Otro</option></select></label><label className="block text-sm font-semibold">Peso (kg, opcional)<input name="pesoKg" className={input} type="number" min="0.1" max="500" step="0.1" value={data.pesoKg ?? ""} onChange={e => update("pesoKg", e.target.value)}/></label><label className="block text-sm font-semibold">Talla (cm, opcional)<input name="tallaCm" className={input} type="number" min="20" max="260" step="0.1" value={data.tallaCm ?? ""} onChange={e => update("tallaCm", e.target.value)}/></label></div></section>
  <section><h2 className="text-lg font-bold">Información de salud que decides compartir</h2><p className="mt-1 text-sm text-slate-500">Deja en blanco cualquier dato que prefieras no compartir.</p><div className="mt-4 grid gap-4 sm:grid-cols-2">{([["alergias","Alergias"],["medicamentosActuales","Medicamentos actuales"],["enfermedadesCronicas","Enfermedades crónicas"],["cirugias","Cirugías"],["antecedentesGinecoobstetricos","Antecedentes ginecoobstétricos (si aplica)"]] as const).map(([key,label])=><label key={key} className="block text-sm font-semibold">{label}<textarea name={key} className={input+" resize-y"} rows={3} maxLength={key === "enfermedadesCronicas" ? 3000 : 2000} value={data[key]} onChange={e=>update(key,e.target.value)} placeholder="Opcional"/></label>)}</div></section>
  {savedHistory.length > 0 && (
    <label className="flex items-start gap-3 rounded-xl border border-[#D6E6E1] bg-[#F6FAF8] p-4 text-sm leading-relaxed">
      <input type="checkbox" checked={shareHistory} onChange={(e) => setShareHistory(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[#0D9488]" />
      <span>Incluir acceso temporal a mi historial médico ({savedHistory.length} consulta{savedHistory.length === 1 ? "" : "s"} guardada{savedHistory.length === 1 ? "" : "s"} en este celular) <strong>solo durante la consulta</strong>.</span>
    </label>
  )}
  <label className="flex items-start gap-3 rounded-xl border border-[#B9DED8] bg-[#EAF4F1] p-4 text-sm leading-relaxed"><input name="consent" type="checkbox" required className="mt-1 h-4 w-4 shrink-0 accent-[#0D9488]"/><span>Autorizo que el médico que escanee este QR consulte los datos que seleccioné para esta consulta. Entiendo que el código vence en cinco minutos, solo se usa una vez y puedo cancelarlo antes de que se utilice.</span></label>
  <button type="submit" disabled={busy} className="rounded-xl bg-[#0D9488] px-5 py-3 font-bold text-white disabled:opacity-60">{busy ? "Generando…" : "Generar QR temporal"}</button></form>}{status && <p role="status" className="mt-4 rounded-xl bg-white p-4 text-sm text-slate-700">{status}</p>}</div></main>;
}
