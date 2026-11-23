-- Tatá IA · M-21 · limite de uso por criança no banco (sobrevive a reinício e a mais de uma instância da API).
-- Só a API (dono do banco) escreve aqui; nenhum papel de usuário tem acesso.

create table public.usage_hit (
  id       bigint generated always as identity primary key,
  child_id uuid not null references public.child(id) on delete cascade,
  at       timestamptz not null default now()
);
create index usage_hit_child_at_idx on public.usage_hit(child_id, at desc);

alter table public.usage_hit enable row level security;
revoke all on public.usage_hit from anon, authenticated;
create policy api_only on public.usage_hit for all to authenticated using (false) with check (false);
