import { createTemporaryTransfer, validatePatientQrData } from "@/lib/temporary-transfer-store";

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 24_000) return Response.json({ error: "La información excede el límite permitido." }, { status: 413, headers: { "Cache-Control": "no-store" } });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "La solicitud no tiene un formato válido." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ error: "La solicitud no tiene un formato válido." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  const submission = body as Record<string, unknown>;
  if (submission.consent !== true) {
    return Response.json({ error: "Se requiere autorización para compartir los datos seleccionados." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const payload = validatePatientQrData(submission.data);
  if (!payload) return Response.json({ error: "Revisa los datos requeridos y sus formatos." }, { status: 400, headers: { "Cache-Control": "no-store" } });

  const transfer = await createTemporaryTransfer(payload);
  if (!transfer) return Response.json({ error: "Hay muchas transferencias activas. Intenta de nuevo en unos minutos." }, { status: 503, headers: { "Cache-Control": "no-store" } });

  return Response.json(transfer, { headers: { "Cache-Control": "no-store, private" } });
}
