# Eco Salud Digital

Plataforma web y móvil de **Consulta Ágil** para médicos de primer contacto (Medicina Familiar y General) y aplicación independiente para pacientes (**Eco Salud Digital Pacientes**) con enlace mediante código QR temporal.

> **Demostración:** no utilizar con pacientes reales hasta habilitar el entorno productivo cifrado y cumplimiento normativo correspondiente. No es un producto oficial del IMSS ni de la Secretaría de Salud.

## Iniciar en local

Requisitos: Node.js y npm.

```powershell
npm ci
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Para verificar el código antes de publicar cambios:

```powershell
npm run lint
npx tsc --noEmit --incremental false
npm run build
```

## Módulos y rutas principales

| Sección | Ruta | Descripción |
| --- | --- | --- |
| Acceso Profesionales | `/` | Inicio de sesión y registro médico previo a la consulta |
| Hoja de Consulta | `/profesionales/consulta/hoja-clinica` | Vista compacta de media pantalla con 5 pestañas, barra lateral derecha, Vademécum IMSS y descarga en PDF |
| Receta Médica | `/profesionales/consulta/receta` | Receta genérica con buscador exclusivo del Cuadro Básico IMSS |
| Mi Perfil | `/profesionales/perfil` | Datos médicos y plantillas personalizadas (paciente, padecimiento, gineco, exploración física) |
| Herramientas y Biblioteca | `/profesionales` y `/profesionales/biblioteca` | Calculadoras clínicas, grupos terapéuticos y guías oficiales |
| App de Pacientes | `/pacientes` | Registro/acceso de paciente, antecedentes (gineco si es mujer), historial en celular, QR y espacio publicitario |
| Aviso y Términos | `/aviso-de-privacidad` y `/terminos` | Aviso de Privacidad (LFPDPPP) y Descargo de Responsabilidad Médica |

## QR temporal distribuido (`ESD1`) con Supabase

1. Ejecuta la migración [001_temporary_transfers.sql](supabase/migrations/001_temporary_transfers.sql) en tu proyecto de Supabase.
2. Configura en `.env.local` o en Vercel las variables de [.env.example](.env.example):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

Si estas variables no están definidas, la aplicación usa automáticamente un almacén temporal en memoria para pruebas locales.

## Publicación en Google Play Store y App Store (Capacitor)

El archivo [capacitor.config.ts](capacitor.config.ts) y [manifest.ts](app/manifest.ts) dejan lista la configuración base para envolver la aplicación web en Android/iOS:

1. Instalar Capacitor (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/ios`).
2. Declarar permiso de cámara (`CAMERA` en `AndroidManifest.xml` y `NSCameraUsageDescription` en `Info.plist`) para el lector QR.
3. Publicar las URLs legales (`/aviso-de-privacidad` y `/terminos`) en las fichas de Google Play Console y App Store Connect.
