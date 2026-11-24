import { NextResponse } from "next/server";

export async function GET() {
  const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim());
  const hasPublishableKey = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim(),
  );
  const hasServiceRoleKey = Boolean(
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );

  const distributedQrReady = hasSupabaseUrl && hasServiceRoleKey;

  return NextResponse.json({
    ok: true,
    service: "eco-salud-digital",
    qrStorageMode: distributedQrReady ? "supabase" : "memory-fallback",
    supabaseConfigured: {
      url: hasSupabaseUrl,
      publishableKey: hasPublishableKey,
      serviceRoleKey: hasServiceRoleKey,
    },
  });
}
