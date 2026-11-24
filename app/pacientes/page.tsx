"use client";

import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { FormEvent, useEffect, useState } from "react";
import { PatientBrandLogo } from "../../components/BrandLogo";
import {
  deletePatientHistoryFromCloud,
  insertPatientHistoryToCloud,
  loadPatientDataFromCloud,
  signInSupabaseIfConfigured,
  signOutSupabaseIfConfigured,
  signUpSupabaseIfConfigured,
  syncPatientProfileToCloud,
} from "../../lib/supabase/cloud-sync";

export type LocalPatientHistoryEntry = {
  id: string;
  fecha: string;
  diagnostico: string;
  tratamiento: string;
  atendidoPor: string;
};

type PatientAccount = {
  nombre: string;
  correo: string;
};

type PatientProfileData = {
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

const PATIENT_ACCOUNT_KEY = "eco-salud-patient-account-v1";
const PATIENT_AUTH_SESSION_KEY = "eco-salud-patient-session-v1";
const PATIENT_PROFILE_KEY = "eco-salud-patient-profile-v1";
const PATIENT_HISTORY_KEY = "eco-salud-patient-history-v1";

const emptyProfile: PatientProfileData = {
  nombre: "",
  fechaNacimiento: "",
  sexo: "sin-especificar",
  pesoKg: "",
  tallaCm: "",
  antecedentesPatologicos: "",
  cirugias: "",
  antecedentesNoPatologicos: "",
  toxicomanias: "",
  alergias: "",
  medicamentosActuales: "",
  antecedentesGinecoobstetricos: "",
};

const inputClass =
  "mt-1 w-full rounded-xl border border-[#D6E6E1] bg-white px-3 py-2 text-xs text-[#0F2D3D] outline-none focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/15 sm:text-sm";

export default function PacientesAppPage() {
  // Autenticación de paciente
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authError, setAuthError] = useState("");

  // Navegación interna de la App de Pacientes
  const [activeTab, setActiveTab] = useState<"datos" | "historial" | "qr">(
    "datos",
  );

  // Datos personales y antecedentes
  const [profile, setProfile] = useState<PatientProfileData>(emptyProfile);
  const [profileStatus, setProfileStatus] = useState("");

  // Historial médico local
  const [history, setHistory] = useState<LocalPatientHistoryEntry[]>([]);
  const [fecha, setFecha] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [tratamiento, setTratamiento] = useState("");
  const [atendidoPor, setAtendidoPor] = useState("");
  const [historyStatus, setHistoryStatus] = useState("");

  // Generación de QR temporal
  const [shareHistory, setShareHistory] = useState(true);
  const [consent, setConsent] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [qrImage, setQrImage] = useState("");
  const [qrExpires, setQrExpires] = useState(0);
  const [qrStatus, setQrStatus] = useState("");
  const [qrBusy, setQrBusy] = useState(false);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setFecha(new Date().toISOString().slice(0, 10));
      try {
        const session = window.localStorage.getItem(PATIENT_AUTH_SESSION_KEY);
        const rawAccount = window.localStorage.getItem(PATIENT_ACCOUNT_KEY);
        if (session === "active") {
          setIsAuthenticated(true);
        }
        if (rawAccount) {
          const acc = JSON.parse(rawAccount) as Partial<PatientAccount>;
          if (acc.correo) setAuthEmail(acc.correo);
          if (acc.nombre) setAuthName(acc.nombre);
        }
        const rawProfile = window.localStorage.getItem(PATIENT_PROFILE_KEY);
        if (rawProfile) {
          const parsedProfile = JSON.parse(rawProfile) as Partial<
            PatientProfileData & {
              enfermedadesCronicas?: string;
              pesoKg?: number | string | null;
              tallaCm?: number | string | null;
            }
          >;
          setProfile({
            ...emptyProfile,
            ...parsedProfile,
            pesoKg:
              parsedProfile.pesoKg !== null &&
              parsedProfile.pesoKg !== undefined
                ? String(parsedProfile.pesoKg)
                : "",
            tallaCm:
              parsedProfile.tallaCm !== null &&
              parsedProfile.tallaCm !== undefined
                ? String(parsedProfile.tallaCm)
                : "",
            antecedentesPatologicos:
              parsedProfile.antecedentesPatologicos ??
              parsedProfile.enfermedadesCronicas ??
              "",
          });
        }
        const rawHistory = window.localStorage.getItem(PATIENT_HISTORY_KEY);
        if (rawHistory) {
          const parsedHistory = JSON.parse(
            rawHistory,
          ) as LocalPatientHistoryEntry[];
          if (Array.isArray(parsedHistory)) setHistory(parsedHistory);
        }
      } catch {
        // Ignorar si localStorage no está disponible
      }

      void loadPatientDataFromCloud().then((cloud) => {
        if (!active) return;
        if (cloud.profile) {
          setProfile(cloud.profile);
          try {
            window.localStorage.setItem(
              PATIENT_PROFILE_KEY,
              JSON.stringify(cloud.profile),
            );
          } catch {
            // Ignorar
          }
        }
        if (cloud.history && cloud.history.length > 0) {
          setHistory(cloud.history);
          try {
            window.localStorage.setItem(
              PATIENT_HISTORY_KEY,
              JSON.stringify(cloud.history),
            );
          } catch {
            // Ignorar
          }
        }
      });
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!qrCode) return;
    const timer = window.setTimeout(() => {
      setQrCode("");
      setQrImage("");
      setQrStatus("El QR venció. Puedes generar uno nuevo cuando lo necesites.");
    }, Math.max(0, qrExpires - Date.now()));
    return () => window.clearTimeout(timer);
  }, [qrCode, qrExpires]);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError("Ingresa tu correo o teléfono y tu contraseña.");
      return;
    }
    setAuthError("");
    const res = await signInSupabaseIfConfigured(authEmail, authPassword);
    if (!res.ok) {
      setAuthError(res.error ?? "No se pudo iniciar sesión.");
      return;
    }
    setIsAuthenticated(true);
    try {
      window.localStorage.setItem(PATIENT_AUTH_SESSION_KEY, "active");
    } catch {
      // Ignorar
    }
    if (res.mode === "supabase") {
      const cloud = await loadPatientDataFromCloud();
      if (cloud.profile) {
        setProfile(cloud.profile);
        try {
          window.localStorage.setItem(
            PATIENT_PROFILE_KEY,
            JSON.stringify(cloud.profile),
          );
        } catch {
          // Ignorar
        }
      }
      if (cloud.history) {
        setHistory(cloud.history);
        try {
          window.localStorage.setItem(
            PATIENT_HISTORY_KEY,
            JSON.stringify(cloud.history),
          );
        } catch {
          // Ignorar
        }
      }
    }
  };

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!authName.trim() || !authEmail.trim() || !authPassword.trim()) {
      setAuthError("Completa tu nombre, correo/teléfono y contraseña.");
      return;
    }
    setAuthError("");
    const res = await signUpSupabaseIfConfigured(authEmail, authPassword, {
      nombre_completo: authName.trim(),
      role: "patient",
    });
    if (!res.ok) {
      setAuthError(res.error ?? "No se pudo completar el registro.");
      return;
    }
    if (res.needsEmailConfirmation) {
      setAuthError("Cuenta creada. Revisa tu correo para confirmar y luego inicia sesión.");
      setAuthMode("login");
      return;
    }
    setIsAuthenticated(true);
    const nextProfile = {
      ...profile,
      nombre: profile.nombre || authName.trim(),
    };
    setProfile(nextProfile);
    if (res.mode === "supabase") {
      await syncPatientProfileToCloud(nextProfile);
    }
    try {
      window.localStorage.setItem(PATIENT_AUTH_SESSION_KEY, "active");
      window.localStorage.setItem(
        PATIENT_ACCOUNT_KEY,
        JSON.stringify({ nombre: authName.trim(), correo: authEmail.trim() }),
      );
    } catch {
      // Ignorar
    }
  };

  const handleProvisionalEnter = () => {
    setAuthError("");
    setIsAuthenticated(true);
    try {
      window.localStorage.setItem(PATIENT_AUTH_SESSION_KEY, "active");
    } catch {
      // Ignorar
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    void signOutSupabaseIfConfigured();
    try {
      window.localStorage.setItem(PATIENT_AUTH_SESSION_KEY, "logged_out");
    } catch {
      // Ignorar
    }
  };

  const saveProfile = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      window.localStorage.setItem(PATIENT_PROFILE_KEY, JSON.stringify(profile));
      const synced = await syncPatientProfileToCloud(profile);
      setProfileStatus(
        synced
          ? "Datos y antecedentes guardados en tu celular y sincronizados en la nube."
          : "Datos y antecedentes guardados de forma segura en tu celular.",
      );
    } catch {
      setProfileStatus("No se pudo guardar en este navegador.");
    }
  };

  const addHistoryEntry = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!diagnostico.trim() || !tratamiento.trim()) {
      setHistoryStatus("Escribe al menos el diagnóstico y el tratamiento.");
      return;
    }
    const entryBase = {
      fecha: fecha || new Date().toISOString().slice(0, 10),
      diagnostico: diagnostico.trim(),
      tratamiento: tratamiento.trim(),
      atendidoPor: atendidoPor.trim() || "Médico tratante",
    };
    const cloudId = await insertPatientHistoryToCloud(entryBase);
    const newEntry: LocalPatientHistoryEntry = {
      id: cloudId ?? `hist-${Date.now()}`,
      ...entryBase,
    };
    const next = [newEntry, ...history];
    setHistory(next);
    try {
      window.localStorage.setItem(PATIENT_HISTORY_KEY, JSON.stringify(next));
    } catch {
      // Ignorar
    }
    setDiagnostico("");
    setTratamiento("");
    setAtendidoPor("");
    setHistoryStatus(
      cloudId
        ? "Consulta agregada a tu historial y respaldada en la nube."
        : "Consulta agregada a tu historial.",
    );
  };

  const removeHistoryEntry = (id: string) => {
    const next = history.filter((item) => item.id !== id);
    setHistory(next);
    void deletePatientHistoryFromCloud(id);
    try {
      window.localStorage.setItem(PATIENT_HISTORY_KEY, JSON.stringify(next));
    } catch {
      // Ignorar
    }
  };

  const exportHistoryBackup = () => {
    const content = [
      "RESPALDO DE HISTORIAL MÉDICO - ECO SALUD DIGITAL PACIENTES",
      `Paciente: ${profile.nombre || authName || "No especificado"}`,
      `Fecha de respaldo: ${new Date().toLocaleDateString("es-MX")}`,
      "",
      ...history.map(
        (h, i) =>
          `${i + 1}. ${h.fecha} | ${h.diagnostico}\n   Tratamiento: ${h.tratamiento}\n   Atendido por: ${h.atendidoPor}`,
      ),
    ].join("\n\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "respaldo-historial-medico.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setHistoryStatus("Respaldo descargado en tu dispositivo.");
  };

  const generateQr = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      window.localStorage.setItem(PATIENT_PROFILE_KEY, JSON.stringify(profile));
    } catch {
      // Ignorar
    }
    if (!profile.nombre.trim() || !profile.fechaNacimiento.trim()) {
      setQrStatus(
        "Primero completa tu Nombre completo y Fecha de nacimiento en «1. Mis Datos».",
      );
      return;
    }
    if (!consent) {
      setQrStatus(
        "Marca la casilla de autorización para generar tu código QR temporal.",
      );
      return;
    }
    setQrBusy(true);
    setQrStatus("");

    const rawPeso = profile.pesoKg ? Number(profile.pesoKg) : NaN;
    const peso =
      Number.isFinite(rawPeso) && rawPeso >= 0.1 && rawPeso <= 500
        ? rawPeso
        : null;

    const rawTalla = profile.tallaCm ? Number(profile.tallaCm) : NaN;
    const normalizedTalla =
      Number.isFinite(rawTalla) && rawTalla > 0.3 && rawTalla <= 3
        ? Math.round(rawTalla * 100)
        : rawTalla;
    const talla =
      Number.isFinite(normalizedTalla) &&
      normalizedTalla >= 20 &&
      normalizedTalla <= 260
        ? normalizedTalla
        : null;

    const payload = {
      nombre: profile.nombre.trim(),
      fechaNacimiento: profile.fechaNacimiento,
      sexo: profile.sexo,
      pesoKg: peso,
      tallaCm: talla,
      alergias: profile.alergias.trim(),
      medicamentosActuales: profile.medicamentosActuales.trim(),
      enfermedadesCronicas: [
        profile.antecedentesPatologicos.trim(),
        profile.antecedentesNoPatologicos.trim()
          ? `No patológicos: ${profile.antecedentesNoPatologicos.trim()}`
          : "",
        profile.toxicomanias.trim()
          ? `Toxicomanías: ${profile.toxicomanias.trim()}`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
      antecedentesNoPatologicos: profile.antecedentesNoPatologicos.trim(),
      toxicomanias: profile.toxicomanias.trim(),
      cirugias: profile.cirugias.trim(),
      antecedentesGinecoobstetricos:
        profile.sexo === "femenino"
          ? profile.antecedentesGinecoobstetricos.trim()
          : "",
      ...(shareHistory && history.length > 0
        ? {
            historialTemporal: history.map((h) => ({
              fecha: h.fecha,
              diagnostico: h.diagnostico,
              tratamiento: h.tratamiento,
              atendidoPor: h.atendidoPor,
            })),
          }
        : {}),
    };

    try {
      const response = await fetch("/api/temporary-transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent: true, data: payload }),
      });
      const result = (await response.json()) as {
        code?: string;
        expiresAt?: number;
        error?: string;
      };
      if (!response.ok || !result.code || !result.expiresAt) {
        throw new Error(result.error ?? "No se pudo generar el QR.");
      }
      const qrDataUrl = await QRCode.toDataURL(result.code, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 280,
        color: { dark: "#0F2D3D", light: "#FFFFFF" },
      });
      setQrCode(result.code);
      setQrExpires(result.expiresAt);
      setQrImage(qrDataUrl);
      setQrStatus(
        "QR listo. Muéstralo a tu médico para enlazar tus datos durante esta consulta.",
      );
    } catch (error) {
      setQrStatus(
        error instanceof Error
          ? error.message
          : "No se pudo generar el QR. Revisa tus datos.",
      );
    } finally {
      setQrBusy(false);
    }
  };

  const revokeQr = async () => {
    try {
      await fetch("/api/temporary-transfers/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: qrCode }),
      });
      setQrStatus("Código QR cancelado.");
    } catch {
      setQrStatus("No se confirmó la cancelación.");
    } finally {
      setQrCode("");
      setQrImage("");
    }
  };

  // PANTALLA DE INICIO DE SESIÓN Y REGISTRO DE PACIENTES
  if (!isAuthenticated) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-8 text-[#0F2D3D]">
        <div className="w-full max-w-md rounded-2xl border border-[#D6E6E1] bg-white/95 p-6 shadow-xl backdrop-blur">
          <div className="flex items-center gap-3 border-b border-[#EAF4F1] pb-4">
            <PatientBrandLogo size="lg" />
            <div>
              <h1 className="text-lg font-extrabold text-[#0F2D3D]">
                ECO SALUD DIGITAL{" "}
                <span className="text-[#0284C7]">PACIENTES</span>
              </h1>
              <p className="text-xs text-slate-500">
                App gratuita · Tu historial médico en tu celular
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-[#EAF4F1] p-1">
            <button
              type="button"
              onClick={() => {
                setAuthMode("login");
                setAuthError("");
              }}
              className={
                "rounded-lg py-2 text-xs font-extrabold transition " +
                (authMode === "login"
                  ? "bg-[#0F2D3D] text-white shadow-sm"
                  : "text-[#0F2D3D]")
              }
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("register");
                setAuthError("");
              }}
              className={
                "rounded-lg py-2 text-xs font-extrabold transition " +
                (authMode === "register"
                  ? "bg-[#0D9488] text-white shadow-sm"
                  : "text-[#0F2D3D]")
              }
            >
              Registrarse
            </button>
          </div>

          {authError && (
            <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
              {authError}
            </p>
          )}

          {authMode === "login" ? (
            <form onSubmit={handleLogin} className="mt-4 space-y-3">
              <label className="block text-xs font-semibold">
                Correo electrónico o teléfono
                <input
                  type="text"
                  className={inputClass}
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="paciente@correo.com"
                  required
                />
              </label>
              <label className="block text-xs font-semibold">
                Contraseña
                <input
                  type="password"
                  className={inputClass}
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </label>
              <button
                type="submit"
                className="w-full rounded-xl bg-[#0F2D3D] py-3 text-sm font-extrabold text-white transition hover:bg-[#0D9488]"
              >
                Entrar a mi App →
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="mt-4 space-y-3">
              <label className="block text-xs font-semibold">
                Nombre completo
                <input
                  type="text"
                  className={inputClass}
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  required
                />
              </label>
              <label className="block text-xs font-semibold">
                Correo electrónico o teléfono
                <input
                  type="text"
                  className={inputClass}
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                />
              </label>
              <label className="block text-xs font-semibold">
                Crear contraseña
                <input
                  type="password"
                  className={inputClass}
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                />
              </label>
              <button
                type="submit"
                className="w-full rounded-xl bg-[#0D9488] py-3 text-sm font-extrabold text-white transition hover:bg-[#0F2D3D]"
              >
                Crear cuenta gratis →
              </button>
            </form>
          )}

          <div className="mt-4">
            <button
              type="button"
              onClick={handleProvisionalEnter}
              className="w-full rounded-xl border border-dashed border-[#0284C7] bg-[#F6FAF8] py-2.5 text-xs font-extrabold text-[#0284C7] transition hover:bg-[#EAF4F1]"
            >
              ⚡ Entrar sin registro (Provisional) →
            </button>
          </div>

          <div className="mt-4 border-t border-[#EAF4F1] pt-3 text-center text-xs text-slate-500">
            ¿Eres médico?{" "}
            <Link href="/" className="font-bold text-[#0D9488] hover:underline">
              Acceso para Profesionales →
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col text-[#0F2D3D]">
      <header className="sticky top-0 z-20 border-b border-[#D6E6E1] bg-white/95 px-3 py-2.5 shadow-sm backdrop-blur sm:px-5">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <PatientBrandLogo size="sm" />
            <div className="min-w-0">
              <h1 className="truncate text-sm font-extrabold sm:text-base">
                ECO SALUD DIGITAL{" "}
                <span className="text-[#0284C7]">PACIENTES</span>
              </h1>
              <p className="truncate text-[11px] text-slate-500">
                {profile.nombre || authName || "Mi Expediente Portátil"} · Gratis
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-700"
          >
            Salir
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-4xl flex-1 space-y-4 px-3 py-4 sm:px-5">
        {/* PESTAÑAS DE LA APP DE PACIENTES */}
        <div
          role="tablist"
          className="grid grid-cols-3 gap-1 rounded-xl border border-[#D6E6E1] bg-white p-1 shadow-sm"
        >
          {(
            [
              { id: "datos", label: "1. Mis Datos y Antec." },
              {
                id: "historial",
                label: `2. Historial (${history.length})`,
              },
              { id: "qr", label: "3. Generar QR" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activeTab === t.id}
              onClick={() => setActiveTab(t.id)}
              className={
                "truncate rounded-lg px-2 py-2 text-xs font-extrabold transition " +
                (activeTab === t.id
                  ? "bg-[#0F2D3D] text-white shadow-sm"
                  : "bg-[#F6FAF8] text-[#0F2D3D] hover:bg-[#EAF4F1]")
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* APARTADO 1: DATOS PERSONALES Y ANTECEDENTES */}
        {activeTab === "datos" && (
          <form
            onSubmit={saveProfile}
            className="space-y-4 rounded-2xl border border-[#D6E6E1] bg-white p-4 shadow-sm sm:p-5"
          >
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#0F2D3D]">
              Datos Personales y Antecedentes Médicos
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-semibold sm:col-span-2">
                Nombre completo <span className="text-rose-600">*</span>
                <input
                  type="text"
                  className={inputClass}
                  value={profile.nombre}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, nombre: e.target.value }))
                  }
                  required
                />
              </label>
              <label className="block text-xs font-semibold">
                Fecha de nacimiento <span className="text-rose-600">*</span>
                <input
                  type="date"
                  className={inputClass}
                  value={profile.fechaNacimiento}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      fechaNacimiento: e.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label className="block text-xs font-semibold">
                Sexo
                <select
                  className={inputClass}
                  value={profile.sexo}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      sexo: e.target.value as PatientProfileData["sexo"],
                    }))
                  }
                >
                  <option value="sin-especificar">Prefiero no especificar</option>
                  <option value="femenino">Femenino (Mujer)</option>
                  <option value="masculino">Masculino (Hombre)</option>
                  <option value="otro">Otro</option>
                </select>
              </label>
              <label className="block text-xs font-semibold">
                Peso (kg)
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="500"
                  className={inputClass}
                  value={profile.pesoKg}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, pesoKg: e.target.value }))
                  }
                />
              </label>
              <label className="block text-xs font-semibold">
                Talla (cm) <span className="font-normal text-slate-400">(opcional)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="260"
                  placeholder="Ej. 170"
                  className={inputClass}
                  value={profile.tallaCm}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, tallaCm: e.target.value }))
                  }
                />
              </label>
            </div>

            <div className="grid gap-3 border-t border-[#EAF4F1] pt-3 sm:grid-cols-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 sm:col-span-2">
                Antecedentes médicos (opcionales)
              </p>
              <label className="block text-xs font-semibold">
                Antecedentes personales patológicos
                <textarea
                  rows={2}
                  className={inputClass + " resize-y"}
                  value={profile.antecedentesPatologicos}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      antecedentesPatologicos: e.target.value,
                    }))
                  }
                  placeholder="Diabetes, hipertensión, asma, etc."
                />
              </label>
              <label className="block text-xs font-semibold">
                Cirugías previas
                <textarea
                  rows={2}
                  className={inputClass + " resize-y"}
                  value={profile.cirugias}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, cirugias: e.target.value }))
                  }
                  placeholder="Apendicectomía, cesárea, etc."
                />
              </label>
              <label className="block text-xs font-semibold">
                Antecedentes personales no patológicos
                <textarea
                  rows={2}
                  className={inputClass + " resize-y"}
                  value={profile.antecedentesNoPatologicos}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      antecedentesNoPatologicos: e.target.value,
                    }))
                  }
                  placeholder="Alimentación, actividad física, esquema de vacunación..."
                />
              </label>
              <label className="block text-xs font-semibold">
                Toxicomanías
                <textarea
                  rows={2}
                  className={inputClass + " resize-y"}
                  value={profile.toxicomanias}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, toxicomanias: e.target.value }))
                  }
                  placeholder="Tabaquismo, alcoholismo u otras sustancias (o negadas)"
                />
              </label>
              <label className="block text-xs font-semibold">
                Alergias
                <textarea
                  rows={2}
                  className={inputClass + " resize-y"}
                  value={profile.alergias}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, alergias: e.target.value }))
                  }
                  placeholder="Medicamentos, alimentos..."
                />
              </label>
              <label className="block text-xs font-semibold">
                Medicamentos actuales
                <textarea
                  rows={2}
                  className={inputClass + " resize-y"}
                  value={profile.medicamentosActuales}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      medicamentosActuales: e.target.value,
                    }))
                  }
                  placeholder="Tratamientos que tomas actualmente"
                />
              </label>
            </div>

            {profile.sexo === "femenino" && (
              <div className="rounded-xl border border-[#0D9488]/40 bg-[#EAF4F1]/60 p-3">
                <label className="block text-xs font-bold text-[#0F2D3D]">
                  Antecedentes Ginecoobstétricos
                  <textarea
                    rows={3}
                    className={inputClass + " resize-y"}
                    value={profile.antecedentesGinecoobstetricos}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        antecedentesGinecoobstetricos: e.target.value,
                      }))
                    }
                    placeholder="Menarca, fecha de última menstruación (FUM), embarazos, partos, cesáreas, método anticonceptivo..."
                  />
                </label>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="rounded-xl bg-[#0D9488] px-5 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#0F2D3D] sm:text-sm"
              >
                💾 Guardar en mi celular
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("qr")}
                className="rounded-xl border border-[#0F2D3D] px-4 py-2.5 text-xs font-extrabold text-[#0F2D3D] hover:bg-[#EAF4F1]"
              >
                Ir a Generar QR →
              </button>
            </div>
            {profileStatus && (
              <p className="text-xs font-semibold text-[#0F766E]" role="status">
                {profileStatus}
              </p>
            )}
          </form>
        )}

        {/* APARTADO 2: HISTORIAL MÉDICO EN EL CELULAR */}
        {activeTab === "historial" && (
          <div className="space-y-4">
            <form
              onSubmit={addHistoryEntry}
              className="space-y-3 rounded-2xl border border-[#D6E6E1] bg-white p-4 shadow-sm sm:p-5"
            >
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#0F2D3D]">
                Registrar Consulta en mi Historial
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold">
                  Fecha de la consulta
                  <input
                    type="date"
                    className={inputClass}
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    required
                  />
                </label>
                <label className="block text-xs font-semibold">
                  Atendido por (Médico / Unidad)
                  <input
                    type="text"
                    className={inputClass}
                    value={atendidoPor}
                    onChange={(e) => setAtendidoPor(e.target.value)}
                    placeholder="Ej. Dr. García · UMF No. 1"
                  />
                </label>
              </div>
              <label className="block text-xs font-semibold">
                Diagnóstico
                <input
                  type="text"
                  className={inputClass}
                  value={diagnostico}
                  onChange={(e) => setDiagnostico(e.target.value)}
                  placeholder="Ej. Control de Diabetes Mellitus / Faringitis"
                  required
                />
              </label>
              <label className="block text-xs font-semibold">
                Tratamiento indicado
                <textarea
                  rows={2}
                  className={inputClass + " resize-y"}
                  value={tratamiento}
                  onChange={(e) => setTratamiento(e.target.value)}
                  placeholder="Medicamentos y recomendaciones..."
                  required
                />
              </label>
              <button
                type="submit"
                className="rounded-xl bg-[#0F2D3D] px-5 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#0D9488]"
              >
                + Guardar en mi celular
              </button>
              {historyStatus && (
                <p className="text-xs font-semibold text-[#0F766E]" role="status">
                  {historyStatus}
                </p>
              )}
            </form>

            <div className="rounded-2xl border border-[#D6E6E1] bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#0F2D3D]">
                  Mi Historial Médico ({history.length})
                </h3>
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={exportHistoryBackup}
                    className="rounded-lg border border-[#0D9488] bg-[#EAF4F1] px-3 py-1 text-xs font-bold text-[#0F2D3D] hover:bg-[#0D9488] hover:text-white"
                  >
                    ⬇ Respaldar historial
                  </button>
                )}
              </div>
              {history.length === 0 ? (
                <p className="mt-3 rounded-xl border border-dashed border-[#D6E6E1] bg-[#F6FAF8] p-4 text-xs text-slate-500">
                  Aún no hay consultas registradas en este dispositivo.
                </p>
              ) : (
                <ul className="mt-3 space-y-2.5">
                  {history.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-xl border border-[#D6E6E1] bg-[#F6FAF8] p-3 text-xs sm:text-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <strong className="text-[#0F2D3D]">
                          {item.fecha} · {item.diagnostico}
                        </strong>
                        <button
                          type="button"
                          onClick={() => removeHistoryEntry(item.id)}
                          className="text-xs font-bold text-rose-700 hover:underline"
                        >
                          Eliminar
                        </button>
                      </div>
                      <p className="mt-1 text-slate-700">
                        <strong>Tratamiento:</strong> {item.tratamiento}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        <strong>Atendido por:</strong> {item.atendidoPor}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* APARTADO 3: GENERAR CÓDIGO QR PARA ENLAZAR CON PROFESIONALES */}
        {activeTab === "qr" && (
          <div className="rounded-2xl border border-[#D6E6E1] bg-white p-4 shadow-sm sm:p-6">
            {qrImage ? (
              <div className="text-center">
                <h2 className="text-lg font-extrabold text-[#0F2D3D]">
                  Muestra este QR a tu médico
                </h2>
                <Image
                  src={qrImage}
                  alt="Código QR temporal para consulta"
                  width={260}
                  height={260}
                  unoptimized
                  className="mx-auto mt-3 h-60 w-60 rounded-xl border border-[#D6E6E1] p-2"
                />
                <p className="mt-2 text-xs text-slate-600">
                  Vence a las{" "}
                  {new Date(qrExpires).toLocaleTimeString("es-MX", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  · Un solo uso durante la consulta.
                </p>
                <details className="mx-auto mt-3 max-w-md text-left text-xs">
                  <summary className="cursor-pointer font-bold text-[#0F766E]">
                    Mostrar código manual (ESD1)
                  </summary>
                  <p className="mt-2 break-all rounded-lg bg-[#F6FAF8] p-2.5 font-mono">
                    {qrCode}
                  </p>
                </details>
                <button
                  type="button"
                  onClick={() => void revokeQr()}
                  className="mt-4 rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700"
                >
                  Cancelar QR
                </button>
              </div>
            ) : (
              <form onSubmit={generateQr} className="space-y-4">
                <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#0F2D3D]">
                  Generar Código QR Temporal para Consulta
                </h2>
                <p className="text-xs leading-relaxed text-slate-600">
                  Enlazará tus datos personales (<strong>{profile.nombre || "sin nombre aún"}</strong>, peso, talla) y antecedentes con la app del médico.
                </p>
                {history.length > 0 && (
                  <label className="flex items-start gap-2.5 rounded-xl border border-[#D6E6E1] bg-[#F6FAF8] p-3 text-xs">
                    <input
                      type="checkbox"
                      checked={shareHistory}
                      onChange={(e) => setShareHistory(e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-[#0D9488]"
                    />
                    <span>
                      Compartir acceso temporal a mi historial ({history.length}{" "}
                      consulta{history.length === 1 ? "" : "s"}) solo durante esta consulta.
                    </span>
                  </label>
                )}
                <label className="flex items-start gap-2.5 rounded-xl border border-[#B9DED8] bg-[#EAF4F1] p-3 text-xs">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[#0D9488]"
                  />
                  <span>
                    Autorizo que el médico que escanee este QR consulte mis datos durante esta consulta (código de un solo uso con vigencia de 5 minutos).
                  </span>
                </label>
                <button
                  type="submit"
                  disabled={qrBusy}
                  className="w-full rounded-xl bg-[#0D9488] py-3 text-sm font-extrabold text-white transition hover:bg-[#0F2D3D] disabled:opacity-60"
                >
                  {qrBusy ? "Generando QR…" : "📷 Generar Código QR"}
                </button>
              </form>
            )}
            {qrStatus && (
              <div
                className="mt-3 rounded-xl border border-[#B9DED8] bg-[#F6FAF8] p-3 text-center text-xs font-semibold text-[#0F766E]"
                role="status"
              >
                <p>{qrStatus}</p>
                {qrStatus.includes("Mis Datos") && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("datos")}
                    className="mt-2 rounded-lg bg-[#0F2D3D] px-3 py-1.5 text-xs font-bold text-white"
                  >
                    Ir a 1. Mis Datos →
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ESPACIO PUBLICITARIO PARA MONETIZAR LA APP GRATUITA DE PACIENTES */}
      <aside
        aria-label="Espacio publicitario"
        className="mx-auto mb-4 w-full max-w-4xl px-3 sm:px-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-[#0D9488]/50 bg-white/90 px-4 py-2.5 text-xs shadow-sm">
          <div>
            <span className="rounded bg-[#EAF4F1] px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#0F766E]">
              Publicidad · App gratuita
            </span>
            <p className="mt-1 font-semibold text-[#0F2D3D]">
              Espacio reservado para patrocinadores de salud, laboratorios o farmacias (AdMob / Alianzas).
            </p>
          </div>
          <span className="text-[11px] font-bold text-[#0284C7]">
            Banner 320×50 / 728×90
          </span>
        </div>
        <div className="mt-2 flex justify-center gap-3 text-[11px] text-slate-500">
          <Link href="/aviso-de-privacidad" className="hover:underline">
            Aviso de Privacidad
          </Link>
          <span>·</span>
          <Link href="/terminos" className="hover:underline">
            Términos y Descargo Médico
          </Link>
        </div>
      </aside>
    </main>
  );
}
