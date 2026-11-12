# Eco Salud Digital

Prototipo web de herramientas clínicas para profesionales de la salud y un portal de pacientes para compartir información mediante un código QR temporal.

> **Demostración:** no utilizar con pacientes reales. No es un producto oficial del IMSS ni de la Secretaría de Salud.

## Iniciar en local

Requisitos: Node.js y npm.

```powershell
npm ci
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Para revisar el código antes de publicar cambios:

```powershell
npm run lint
npx tsc --noEmit --incremental false
npm run build
```

## Secciones

- **Inicio**: accesos a consulta, herramientas, receta, perfil y biblioteca.
- **Hoja de consulta** (`/profesionales/consulta/hoja-clinica`): captura editable, diagnóstico CIE-10, exploración, signos vitales, indicaciones y preparación de receta en la sesión actual.
- **Herramientas** (`/profesionales`): calculadoras clínicas, consulta de grupos terapéuticos IMSS y recursos de paraclínicos y escalas.
- **Mi Biblioteca** (`/profesionales/biblioteca`): guías, fuentes externas, libros y accesos a plataformas.
- **Mi perfil** (`/profesionales/perfil`): datos profesionales guardados localmente en el navegador para completar futuras hojas clínicas.
- **Portal de pacientes** (`/pacientes`): formulario para generar un QR temporal con los datos elegidos por el paciente.

## QR temporal del paciente

La persona elige qué información compartir y debe marcar una autorización explícita antes de generar el código. El QR contiene un token aleatorio, vence a los cinco minutos, puede consumirse una sola vez y puede cancelarse mientras siga vigente. Al leerse, la hoja clínica muestra los datos importados para que el médico los revise y edite.

La implementación actual conserva las transferencias temporalmente en memoria del proceso. Un reinicio las invalida y varias instancias de servidor no comparten el mismo almacén; por eso este flujo sigue siendo solo para demostración.

## Límites actuales

- No se crean expedientes médicos permanentes ni se integra SIMF.
- El perfil profesional se conserva en el almacenamiento local del navegador; la integración opcional con Supabase requiere autenticación configurada.
- El buscador farmacológico de la hoja tiene una ficha IMSS integrada como ejemplo. Falta estructurar el catálogo institucional completo.
- Favoritos y recursos recientes se guardan localmente en el navegador.
- No ingresar datos reales de pacientes en este prototipo.

## Variables opcionales

El perfil puede leer una sesión profesional de Supabase si se configuran estas variables en el entorno local o del servicio de despliegue:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

No se necesitan para iniciar la demostración local. Los archivos `.env*` permanecen fuera del repositorio.

## Rutas principales

| Página | Ruta |
| --- | --- |
| Inicio | `/` |
| Herramientas | `/profesionales` |
| Hoja de consulta | `/profesionales/consulta/hoja-clinica` |
| Biblioteca | `/profesionales/biblioteca` |
| Perfil | `/profesionales/perfil` |
| Portal de pacientes | `/pacientes` |
| Generar QR | `/pacientes/qr` |
