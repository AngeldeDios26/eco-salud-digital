import { consumeTemporaryTransfer } from "@/lib/temporary-transfer-store";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "La solicitud no tiene un formato válido." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  if (!body || typeof body !== "object" || typeof (body as Record<string, unknown>).code !== "string") {
    return Response.json({ error: "El código temporal no es válido." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const data = await consumeTemporaryTransfer((body as { code: string }).code);
  if (!data) return Response.json({ error: "El QR ya venció, ya fue utilizado o no es válido. Genera uno nuevo." }, { status: 410, headers: { "Cache-Control": "no-store" } });
  return Response.json({ data }, { headers: { "Cache-Control": "no-store, private" } });
}
