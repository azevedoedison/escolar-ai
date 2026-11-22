-- Tatá IA · TAT-56 · Estrutura de escolas (só banco).
-- Prepara a venda futura para escolas sem mudar nada hoje: a família continua sendo a unidade de
-- isolamento (RLS por family_id) e nenhuma tela ou regra de administração escolar existe ainda.
-- Escolas são criadas e vinculadas só pela API (service role); o responsável apenas lê a própria escola.

create table public.school (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name       text not null check (btrim(name) <> '')
);

alter table public.family add column school_id uuid references public.school(id) on delete set null;
create index family_school_idx on public.family(school_id) where school_id is not null;

alter table public.school enable row level security;
revoke all on public.school from anon, authenticated;
grant select on public.school to authenticated;

create policy school_select on public.school for select to authenticated
  using (id in (select school_id from public.family where id in (select public.current_family_ids())));
