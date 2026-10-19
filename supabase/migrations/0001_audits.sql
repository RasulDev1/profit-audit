create table if not exists public.audits (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  input jsonb not null,
  calculation jsonb not null,
  report text,
  model text,
  status text not null default 'generating' check (status in ('generating', 'done', 'error'))
);

-- Доступ только с сервера через service role key.
alter table public.audits enable row level security;
