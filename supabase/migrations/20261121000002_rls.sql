-- Tatá IA · M-01 · Row Level Security
-- Regra: um responsável só enxerga linhas da própria família.
-- A criança não acessa o banco direto: usa a API (service role), que ignora RLS.
-- Escritas de conversa, mensagem, evento de segurança e alerta também são da API.

create or replace function public.current_family_ids()
returns setof uuid
language sql stable security definer
set search_path = public
as $$
  select family_id from public.guardian where auth_user_id = auth.uid()
$$;

revoke all on function public.current_family_ids() from public;
grant execute on function public.current_family_ids() to authenticated;

alter table public.family          enable row level security;
alter table public.guardian        enable row level security;
alter table public.child           enable row level security;
alter table public.device          enable row level security;
alter table public.family_settings enable row level security;
alter table public.conversation    enable row level security;
alter table public.message         enable row level security;
alter table public.safety_event    enable row level security;
alter table public.alert           enable row level security;
alter table public.audit_log       enable row level security;

-- Nada para anon; authenticated recebe só o que as políticas liberam.
revoke all on all tables in schema public from anon, authenticated;
grant select on public.family, public.guardian, public.conversation, public.message,
                public.safety_event, public.audit_log to authenticated;
grant select, insert, update, delete on public.child to authenticated;
grant select, update on public.device, public.family_settings, public.alert to authenticated;

create policy family_select on public.family for select to authenticated
  using (id in (select public.current_family_ids()));

create policy guardian_select on public.guardian for select to authenticated
  using (family_id in (select public.current_family_ids()));

create policy child_select on public.child for select to authenticated
  using (family_id in (select public.current_family_ids()));
create policy child_insert on public.child for insert to authenticated
  with check (family_id in (select public.current_family_ids()));
create policy child_update on public.child for update to authenticated
  using (family_id in (select public.current_family_ids()))
  with check (family_id in (select public.current_family_ids()));
create policy child_delete on public.child for delete to authenticated
  using (family_id in (select public.current_family_ids()));

create policy device_select on public.device for select to authenticated
  using (child_id in (select id from public.child where family_id in (select public.current_family_ids())));
create policy device_update on public.device for update to authenticated
  using (child_id in (select id from public.child where family_id in (select public.current_family_ids())))
  with check (child_id in (select id from public.child where family_id in (select public.current_family_ids())));

create policy settings_select on public.family_settings for select to authenticated
  using (family_id in (select public.current_family_ids()));
create policy settings_update on public.family_settings for update to authenticated
  using (family_id in (select public.current_family_ids()))
  with check (family_id in (select public.current_family_ids()));

create policy conversation_select on public.conversation for select to authenticated
  using (child_id in (select id from public.child where family_id in (select public.current_family_ids())));

create policy message_select on public.message for select to authenticated
  using (conversation_id in (
    select cv.id from public.conversation cv
    join public.child c on c.id = cv.child_id
    where c.family_id in (select public.current_family_ids())));

create policy safety_event_select on public.safety_event for select to authenticated
  using (message_id in (
    select m.id from public.message m
    join public.conversation cv on cv.id = m.conversation_id
    join public.child c on c.id = cv.child_id
    where c.family_id in (select public.current_family_ids())));

create policy alert_select on public.alert for select to authenticated
  using (family_id in (select public.current_family_ids()));
create policy alert_update on public.alert for update to authenticated
  using (family_id in (select public.current_family_ids()))
  with check (family_id in (select public.current_family_ids()));

create policy audit_log_select on public.audit_log for select to authenticated
  using (family_id in (select public.current_family_ids()));
