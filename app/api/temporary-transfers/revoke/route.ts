import { revokeTemporaryTransfer } from "@/lib/temporary-transfer-store";

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
  await revokeTemporaryTransfer((body as { code: string }).code);
  return Response.json({ revoked: true }, { headers: { "Cache-Control": "no-store" } });
}
