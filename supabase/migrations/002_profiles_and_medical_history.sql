-- Esquema opcional para persistencia en la nube de perfiles profesionales, perfiles de pacientes e historial clínico
-- Ejecutar después de 001_temporary_transfers.sql en el SQL Editor de Supabase

create table if not exists public.professional_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null default '',
  especialidad text not null default '',
  cedula text not null default '',
  institucion text not null default '',
  consultorio text not null default '',
  telefono text not null default '',
  correo text not null default '',
  paciente_plantilla text not null default '',
  padecimiento_plantilla text not null default '',
  gineco_plantilla text not null default '',
  exploracion_personalizada text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.professional_profiles enable row level security;

create policy "Profesionales leen su propio perfil"
  on public.professional_profiles
  for select
  using (auth.uid() = user_id);

create policy "Profesionales crean o actualizan su propio perfil"
  on public.professional_profiles
  for insert
  with check (auth.uid() = user_id);

create policy "Profesionales modifican su propio perfil"
  on public.professional_profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.patient_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null default '',
  fecha_nacimiento text not null default '',
  sexo text not null default 'sin-especificar',
  peso_kg text not null default '',
  talla_cm text not null default '',
  antecedentes_patologicos text not null default '',
  cirugias text not null default '',
  antecedentes_no_patologicos text not null default '',
  toxicomanias text not null default '',
  alergias text not null default '',
  medicamentos_actuales text not null default '',
  antecedentes_ginecoobstetricos text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.patient_profiles enable row level security;

create policy "Pacientes leen su propio perfil"
  on public.patient_profiles
  for select
  using (auth.uid() = user_id);

create policy "Pacientes crean su propio perfil"
  on public.patient_profiles
  for insert
  with check (auth.uid() = user_id);

create policy "Pacientes actualizan su propio perfil"
  on public.patient_profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.patient_history_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fecha text not null,
  diagnostico text not null,
  tratamiento text not null default '',
  atendido_por text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_patient_history_user_fecha
  on public.patient_history_entries (user_id, fecha desc);

alter table public.patient_history_entries enable row level security;

create policy "Pacientes leen su historial"
  on public.patient_history_entries
  for select
  using (auth.uid() = user_id);

create policy "Pacientes insertan en su historial"
  on public.patient_history_entries
  for insert
  with check (auth.uid() = user_id);

create policy "Pacientes eliminan su historial"
  on public.patient_history_entries
  for delete
  using (auth.uid() = user_id);
