-- Tatá IA · M-01 · Modelo de dados v1 (docs/tata-ia/02-arquitetura.md, seção 3.5)

create extension if not exists pgcrypto;

create table public.family (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  plan        text not null default 'free',
  data_region text not null default 'sa-east-1'
);

create table public.guardian (
  id           uuid primary key default gen_random_uuid(),
  family_id    uuid not null references public.family(id) on delete cascade,
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  name         text not null,
  email        text not null,
  role         text not null default 'owner' check (role in ('owner', 'member')),
  consent_at   timestamptz
);
create index guardian_family_idx on public.guardian(family_id);

create table public.child (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references public.family(id) on delete cascade,
  nickname   text not null,
  birth_year smallint not null check (birth_year between 2000 and 2100),
  grade      text,
  avatar     text,
  pin_hash   text,
  active     boolean not null default true
);
create index child_family_idx on public.child(family_id);

create table public.device (
  id           uuid primary key default gen_random_uuid(),
  child_id     uuid not null references public.child(id) on delete cascade,
  platform     text not null check (platform in ('android', 'ios', 'web')),
  paired_at    timestamptz not null default now(),
  last_seen_at timestamptz,
  revoked_at   timestamptz
);
create index device_child_idx on public.device(child_id);

create table public.family_settings (
  family_id       uuid primary key references public.family(id) on delete cascade,
  category_policy jsonb not null default '{}'::jsonb,
  homework_mode   boolean not null default true,
  daily_limit     integer check (daily_limit is null or daily_limit > 0),
  quiet_hours     jsonb,
  retention_days  integer not null default 365 check (retention_days > 0)
);

create table public.conversation (
  id         uuid primary key default gen_random_uuid(),
  child_id   uuid not null references public.child(id) on delete cascade,
  title      text,
  started_at timestamptz not null default now()
);
create index conversation_child_idx on public.conversation(child_id, started_at desc);

create table public.message (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversation(id) on delete cascade,
  role            text not null check (role in ('child', 'tata')),
  content         text not null,
  created_at      timestamptz not null default now()
);
create index message_conversation_idx on public.message(conversation_id, created_at);

create table public.safety_event (
  id         uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.message(id) on delete cascade,
  layer      text not null,
  category   text not null,
  intent     text,
  risk       text,
  decision   text not null check (decision in ('allow', 'redirect', 'block', 'crisis')),
  model      text,
  latency_ms integer
);
create index safety_event_message_idx on public.safety_event(message_id);

create table public.alert (
  id              uuid primary key default gen_random_uuid(),
  family_id       uuid not null references public.family(id) on delete cascade,
  child_id        uuid not null references public.child(id) on delete cascade,
  safety_event_id uuid references public.safety_event(id) on delete set null,
  severity        text not null check (severity in ('low', 'medium', 'high', 'crisis')),
  status          text not null default 'new' check (status in ('new', 'seen', 'resolved')),
  created_at      timestamptz not null default now()
);
create index alert_family_idx on public.alert(family_id, created_at desc);

-- family_id foi acrescentado ao esquema da arquitetura para permitir isolamento por família.
create table public.audit_log (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid references public.family(id) on delete cascade,
  actor      text not null,
  action     text not null,
  target     text,
  created_at timestamptz not null default now()
);
create index audit_log_family_idx on public.audit_log(family_id, created_at desc);
