# Aviso de privacidad — Eco Salud Digital (profesionales y pacientes)

> **BORRADOR para revisión (2026-11-27). Todavía no se publica.**
> Redactado por Claude a partir de la LFPDPPP (DOF 20-03-2025, última reforma DOF 14-11-2025), de lo que pide Google Play y de lo que hace hoy el código (tablas de `supabase/migrations/001` y `002`).
> **No es asesoría legal.** Esta plataforma trata **datos de salud**, que la ley considera **datos sensibles**. Antes de usarla con pacientes reales es indispensable la revisión de un abogado en protección de datos y en regulación sanitaria.
>
> Lo que está entre corchetes `[ASÍ]` lo tiene que llenar o decidir Fernando. Las notas con 📝 se borran antes de publicar.

> 📝 **Importante:** la página actual (`app/aviso-de-privacidad/page.tsx`) dice que los datos se guardan **solo** en el dispositivo. Ya no es así: la migración `002_profiles_and_medical_history.sql` guarda en Supabase el perfil del médico y el perfil, los antecedentes y el historial del paciente. Hay que reemplazar esa página por este aviso (cuando se apruebe) **antes** de activar las cuentas con datos reales.

---

**Última actualización:** [FECHA DE PUBLICACIÓN]

## 1. Quién es responsable de tus datos

[NOMBRE COMPLETO DEL RESPONSABLE o RAZÓN SOCIAL], con domicilio en [DOMICILIO COMPLETO], es responsable del tratamiento de los datos personales en **Eco Salud Digital** (herramienta para profesionales de la salud) y **Eco Salud Digital Pacientes**.

Contacto de privacidad: [CORREO DE PRIVACIDAD]

**Eco Salud Digital es un proyecto independiente.** No es un producto oficial del IMSS, ISSSTE, IMSS-Bienestar ni de la Secretaría de Salud.

> 📝 Pregunta para el abogado: cuando un médico recibe los datos de un paciente por QR y los usa en su consulta, **el médico** pasa a ser responsable de su propio expediente clínico. Eco Salud solo sería responsable de lo que guarda en su plataforma. Conviene decirlo así en los Términos para profesionales.

## 2. Qué datos usamos

### Si eres paciente (app de pacientes)

| Dato | Para qué | Dónde se guarda |
|---|---|---|
| Nombre, fecha de nacimiento, sexo | Identificarte en tu historial y en el QR | En tu teléfono y, si creas cuenta, en nuestro servidor |
| Peso y talla | Mostrar tus medidas al médico | Igual |
| **Antecedentes patológicos, cirugías, alergias, medicamentos actuales, antecedentes no patológicos y toxicomanías** | Que el médico tenga tu información completa en la consulta | Igual |
| **Antecedentes ginecoobstétricos** (solo si eres mujer y decides llenarlos) | Igual | Igual |
| **Historial de consultas**: fecha, diagnóstico, tratamiento y quién te atendió | Llevar tu historial contigo | Igual |
| Correo y contraseña (cifrada) | Tu cuenta | Nuestro servidor |

**Datos sensibles.** Los datos en **negritas** son **datos de salud**, que la ley considera sensibles (art. 2, fracción VI). Por eso **te pedimos tu consentimiento expreso** antes de guardarlos (art. 8), con una casilla aparte que no viene marcada.

### Si eres profesional de la salud

| Dato | Para qué |
|---|---|
| Nombre, especialidad, cédula profesional, institución, consultorio, teléfono y correo | Tu perfil y los datos que aparecen en tu receta y tu hoja de consulta |
| Tus plantillas (paciente, padecimiento, gineco, exploración física) | Ahorrarte tiempo en la consulta |
| Calculadoras y documentos que usaste recientemente o marcaste como favoritos | Mostrártelos primero (solo en tu dispositivo) |
| Correo y contraseña (cifrada) | Tu cuenta |

**Lo que escribes en la hoja de consulta y en la receta** se queda en tu dispositivo mientras la usas y en el PDF que descargas. [CONFIRMAR: no se guarda en nuestro servidor.]

> 📝 Confirmar en el código qué partes de la hoja de consulta se guardan y dónde. Si algo se guarda en el servidor, agregarlo aquí.

### Código QR temporal (ESD1)

Cuando **tú, paciente,** generas un código QR para tu médico:

1. Eliges qué datos compartir y confirmas.
2. Esos datos se guardan **cifrados** en nuestro servidor durante **5 minutos como máximo**.
3. El médico los lee **una sola vez**; después se borran. Si nadie los lee, se borran a los 5 minutos.

> 📝 Revisar si el `payload` de `temporary_transfers` va cifrado de verdad (y no solo protegido por RLS) antes de afirmar "cifrados". Si no, quitar esa palabra o agregar el cifrado.

**Cámara:** solo para leer el código QR o la foto de un QR. No guardamos las imágenes.

**No usamos tu ubicación.**

## 3. Para qué usamos tus datos

**Finalidades necesarias:**

1. Guardar tu perfil de salud y tu historial para que los lleves contigo (pacientes).
2. Pasar tus datos a tu médico con el QR, solo cuando tú lo decides.
3. Darte las herramientas de consulta, receta, calculadoras y biblioteca (profesionales).
4. Crear y mantener tu cuenta, mantener la seguridad y atender tus solicitudes de privacidad.

**Finalidades voluntarias:**

1. [SI SE HACE] Enviarte avisos de novedades de la plataforma por correo.

**No vendemos tus datos. No usamos tus datos de salud para publicidad**, ni para crear perfiles, ni los compartimos con laboratorios, aseguradoras o farmacias. Los espacios publicitarios de la app de pacientes son **iguales para todos**: no se eligen según tu salud.

> 📝 Si alguna vez se quieren anuncios personalizados, sería otra finalidad con su propio consentimiento y, con datos de salud, muy probablemente no conviene. Revisar también la política de Google Play sobre apps de salud y anuncios.

## 4. Con quién se comparten

| Quién | Qué hace | Datos |
|---|---|---|
| **El médico que tú elijas, con tu QR** | Usarlos en tu consulta | Solo lo que eliges compartir |
| Supabase (servidores en [REGIÓN]) | Guarda las cuentas, los perfiles y el QR temporal | Los de las tablas descritas arriba |
| Vercel | Aloja la página web | Datos técnicos de la visita (dirección IP, navegador) |
| [SI SE USA] Proveedor de anuncios | Muestra los espacios publicitarios | [DECIDIR: ninguno / datos técnicos sin datos de salud] |

Compartir con tu médico por QR es una decisión tuya en cada consulta. Fuera de esto, **solo compartiremos tus datos si una autoridad lo exige conforme a la ley** (art. 36 de la LFPDPPP).

## 5. Cómo limitar el uso de tus datos

- Llena solo los campos que quieras; los únicos obligatorios son [NOMBRE, FECHA DE NACIMIENTO Y SEXO].
- En cada QR eliges qué datos compartir.
- Puedes usar la app de pacientes **sin cuenta**: tus datos se quedan en tu teléfono.
- Puedes borrar tu historial y tu perfil desde la app.

## 6. Tus derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)

Tienes derecho a **saber** qué datos tenemos de ti, **corregirlos**, **pedir que los borremos** y **oponerte** a que los usemos para un fin. También puedes **retirar tu consentimiento**.

Muchos los puedes ejercer **tú mismo desde la app** (ver, corregir y borrar tu perfil e historial). Para lo demás, escribe a [CORREO DE PRIVACIDAD] desde el correo de tu cuenta, con tu nombre, qué derecho quieres ejercer y sobre qué datos, y si actúas por otra persona (por ejemplo, un menor a tu cargo), el documento que lo acredite.

Te responderemos en un máximo de **20 días** y, si procede, lo haremos efectivo en los **15 días** siguientes (art. 31 de la LFPDPPP). Es **gratis** (art. 34).

**Lo que ya tiene tu médico:** si compartiste tus datos por QR, tu médico los incorporó a su propio expediente. Para corregirlos o borrarlos ahí, pídeselo a tu médico.

[CUANDO EXISTA] **Borrar tu cuenta:** desde la app y desde [URL PARA BORRAR LA CUENTA].

Si consideras que no atendimos bien tu solicitud, puedes acudir a la **Secretaría Anticorrupción y Buen Gobierno**, que es la autoridad en materia de protección de datos personales en posesión de particulares.

## 7. Cuánto tiempo guardamos tus datos

- QR temporal: **5 minutos como máximo**, o hasta que el médico lo lea.
- Datos en tu teléfono: hasta que los borres o desinstales la app.
- Cuenta, perfil e historial: mientras tengas la cuenta. Si la borras, eliminamos tus datos en un plazo de [30] días.

> 📝 Eco Salud no es el expediente clínico oficial del médico. Si en algún momento se convierte en uno, aplican las normas de expediente clínico y de sistemas de información en salud (por ejemplo, NOM-004-SSA3-2012 y NOM-024-SSA3-2012), que piden conservarlo varios años. Revisarlo con el abogado.

## 8. Seguridad

- Toda la conexión va cifrada (HTTPS).
- Cada persona solo puede ver sus propios datos (reglas de seguridad en la base de datos).
- La tabla del QR temporal no se puede leer desde el navegador, solo desde el servidor.
- Las contraseñas se guardan cifradas.
- [ANTES DE PRODUCCIÓN] Cifrado adicional de los datos de salud guardados en el servidor.

Ningún sistema es 100 % seguro. Si ocurriera una vulneración que afecte tus derechos, te avisaremos de inmediato.

## 9. Menores de edad

Las cuentas son para personas de 18 años o más. Los datos de un menor los puede registrar y compartir **su madre, padre o tutor**, desde su propia cuenta y bajo su responsabilidad.

> 📝 Decidir si la app permite perfiles de dependientes (hijos). Si no, decir simplemente que la app es para mayores de 18.

## 10. Cambios a este aviso

Si cambiamos este aviso, lo publicaremos en [URL DEL AVISO] y te lo mostraremos en la app. Si el cambio afecta tus datos de salud, te pediremos que lo aceptes de nuevo.

## 11. Aviso médico

Eco Salud Digital es una **herramienta de apoyo**. No sustituye el juicio clínico del profesional ni la consulta médica.

---

## Textos para mostrar en la app

**Aviso de privacidad simplificado (registro de pacientes).** [NOMBRE DEL RESPONSABLE], con domicilio en [DOMICILIO], guarda tu perfil de salud e historial para que los lleves contigo y los compartas con tu médico mediante un código QR temporal, solo cuando tú lo decidas. No vendemos tus datos ni los usamos para publicidad. Aviso completo: [URL DEL AVISO].

☐ Acepto el aviso de privacidad.
☐ **Doy mi consentimiento expreso para que se guarden mis datos de salud** (antecedentes, alergias, medicamentos e historial) para las finalidades descritas.

**Antes de generar el QR:** "Tu médico verá los datos que elegiste. El código dura 5 minutos y solo se puede leer una vez."

**Aviso de privacidad simplificado (registro de profesionales).** [NOMBRE DEL RESPONSABLE], con domicilio en [DOMICILIO], usa tus datos profesionales para tu perfil, tus recetas y tus hojas de consulta. Los datos de tus pacientes que recibes por QR quedan bajo tu responsabilidad como profesional de la salud. Aviso completo: [URL DEL AVISO].

---

## Lista de pendientes antes de usarla con pacientes reales

- [ ] Llenar nombre, domicilio y correo de privacidad.
- [ ] Reemplazar la página `app/aviso-de-privacidad/page.tsx` por este aviso (la actual ya no describe lo que hace la app).
- [ ] Agregar la casilla de **consentimiento expreso para datos de salud** en el registro de pacientes.
- [ ] Confirmar qué guarda el servidor de la hoja de consulta y de la receta.
- [ ] Revisar si el QR temporal va cifrado; si no, cifrarlo o corregir el aviso.
- [ ] Borrar cuenta desde la app y desde la web (requisito de Google Play).
- [ ] Revisar la política de Google Play para apps de salud.
- [ ] Revisión por un abogado (datos personales y regulación sanitaria).
