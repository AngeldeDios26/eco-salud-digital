-- Tabla para transferencias QR temporales (ESD1) de un solo uso y vigencia de 5 minutos
create table if not exists public.temporary_transfers (
  token_hash text primary key,
  payload jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_temporary_transfers_expires_at
  on public.temporary_transfers (expires_at);

-- Bloquear acceso directo desde el navegador (solo accesible desde el servidor con SUPABASE_SERVICE_ROLE_KEY)
alter table public.temporary_transfers enable row level security;
