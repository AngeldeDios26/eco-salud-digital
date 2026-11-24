"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { BrandLogo } from "../components/BrandLogo";
import {
  readProfessionalProfile,
  saveProfessionalProfile,
} from "../lib/professional-profile";

const inputClass =
  "mt-1 w-full rounded-xl border border-[#D6E6E1] bg-white px-3.5 py-2.5 text-sm text-[#0F2D3D] outline-none focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/15";

export default function Home() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("medico@imss.gob.mx");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [matricula, setMatricula] = useState("");
  const [unidad, setUnidad] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const saved = readProfessionalProfile();
      if (saved) {
        if (saved.nombre) setNombre(saved.nombre);
        if (saved.cedula) setCedula(saved.cedula);
        if (saved.matricula) setMatricula(saved.matricula);
        if (saved.unidad) setUnidad(saved.unidad);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Ingresa tu correo electrónico o matrícula y tu contraseña.");
      return;
    }
    setError("");
    try {
      window.localStorage.setItem("esd_auth_session", "active");
    } catch {
      // Ignorar
    }
    router.push("/profesionales/consulta/hoja-clinica");
  };

  const handleRegister = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!nombre.trim() || !cedula.trim() || !email.trim() || !password.trim()) {
      setError("Completa nombre, cédula, correo y contraseña para registrarte.");
      return;
    }
    setError("");
    const existing = readProfessionalProfile();
    saveProfessionalProfile({
      nombre: nombre.trim(),
      cedula: cedula.trim(),
      matricula: matricula.trim(),
      unidad: unidad.trim(),
      exploracionPersonalizada: existing?.exploracionPersonalizada ?? "",
      pacientePlantilla: existing?.pacientePlantilla ?? "",
      padecimientoPlantilla: existing?.padecimientoPlantilla ?? "",
      ginecoPlantilla: existing?.ginecoPlantilla ?? "",
    });
    try {
      window.localStorage.setItem("esd_auth_session", "active");
      window.localStorage.setItem(
        "esd_registered_doctor_profile",
        JSON.stringify({
          nombre: nombre.trim(),
          cedula: cedula.trim(),
          matricula: matricula.trim(),
          unidad: unidad.trim(),
        }),
      );
    } catch {
      // Ignorar
    }
    router.push("/profesionales/consulta/hoja-clinica");
  };

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-8 text-[#0F2D3D]">
      <div className="w-full max-w-md rounded-2xl border border-[#D6E6E1] bg-white/95 p-6 shadow-xl backdrop-blur sm:p-7">
        <div className="flex items-center gap-3 border-b border-[#EAF4F1] pb-4">
          <BrandLogo size="lg" />
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-[#0F2D3D]">
              ECO <span className="text-[#0D9488]">SALUD DIGITAL</span>
            </h1>
            <p className="text-xs font-medium text-slate-500">
              Acceso para Profesionales · Hoja de Consulta
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-[#EAF4F1] p-1">
          <button
            type="button"
            onClick={() => {
              setTab("login");
              setError("");
            }}
            className={
              "rounded-lg py-2 text-xs font-extrabold transition " +
              (tab === "login"
                ? "bg-[#0F2D3D] text-white shadow-sm"
                : "text-[#0F2D3D] hover:bg-white/60")
            }
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("register");
              setError("");
            }}
            className={
              "rounded-lg py-2 text-xs font-extrabold transition " +
              (tab === "register"
                ? "bg-[#0D9488] text-white shadow-sm"
                : "text-[#0F2D3D] hover:bg-white/60")
            }
          >
            Registrarse
          </button>
        </div>

        {error && (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
            {error}
          </p>
        )}

        {tab === "login" ? (
          <form onSubmit={handleLogin} className="mt-4 space-y-3.5">
            <label className="block text-xs font-semibold">
              Correo electrónico o Matrícula
              <input
                type="text"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="medico@imss.gob.mx"
                required
              />
            </label>
            <label className="block text-xs font-semibold">
              Contraseña
              <input
                type="password"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-xl bg-[#0F2D3D] py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#0D9488]"
            >
              Entrar a Hoja de Consulta →
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="mt-4 space-y-3">
            <label className="block text-xs font-semibold">
              Nombre completo del médico
              <input
                type="text"
                className={inputClass}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Dr. / Dra. ..."
                required
              />
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <label className="block text-xs font-semibold">
                Cédula profesional
                <input
                  type="text"
                  className={inputClass}
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  required
                />
              </label>
              <label className="block text-xs font-semibold">
                Matrícula (opcional)
                <input
                  type="text"
                  className={inputClass}
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                />
              </label>
            </div>
            <label className="block text-xs font-semibold">
              Unidad médica / Consultorio
              <input
                type="text"
                className={inputClass}
                value={unidad}
                onChange={(e) => setUnidad(e.target.value)}
                placeholder="Ej. UMF No. 1 / Consultorio privado"
              />
            </label>
            <label className="block text-xs font-semibold">
              Correo electrónico
              <input
                type="email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="block text-xs font-semibold">
              Crear contraseña
              <input
                type="password"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-xl bg-[#0D9488] py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#0F2D3D]"
            >
              Registrarme y Entrar →
            </button>
          </form>
        )}

        <div className="mt-5 border-t border-[#EAF4F1] pt-3 text-center text-xs text-slate-500">
          ¿Eres paciente?{" "}
          <Link href="/pacientes" className="font-bold text-[#0D9488] hover:underline">
            Ir a la App de Pacientes →
          </Link>
          <div className="mt-2 flex justify-center gap-3 text-[11px]">
            <Link href="/aviso-de-privacidad" className="hover:underline">
              Aviso de Privacidad
            </Link>
            <span>·</span>
            <Link href="/terminos" className="hover:underline">
              Términos y Descargo Médico
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
