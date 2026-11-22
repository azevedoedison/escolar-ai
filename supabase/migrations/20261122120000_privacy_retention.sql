-- Tatá IA · B-02 · Privacidade e retenção (openspec/changes/privacidade-e-retencao).
--
-- Retenção configurável por família (30 a 365 dias, padrão 90), limpeza automática por família,
-- exportar dados, apagar conversas, excluir conta e trilha de auditoria.
-- O responsável chama as funções por RPC; a limpeza automática é da API (service role / dono do banco).

-- Padrão de 90 dias e faixa de 30 a 365. Famílias já cadastradas mantêm o valor que têm (ajustado à faixa).
update public.family_settings set retention_days = least(greatest(retention_days, 30), 365);
alter table public.family_settings drop constraint if exists family_settings_retention_days_check;
alter table public.family_settings
  add constraint family_settings_retention_days_range check (retention_days between 30 and 365);
alter table public.family_settings alter column retention_days set default 90;

-- O responsável só muda a retenção pela função (valida e audita); o update direto fica sem essa coluna.
revoke update on public.family_settings from authenticated;
grant update (category_policy, homework_mode, daily_limit, quiet_hours) on public.family_settings to authenticated;

create or replace function public.set_retention_days(p_days integer)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_family uuid;
begin
  select family_id into v_family from public.guardian where auth_user_id = auth.uid();
  if v_family is null then
    raise exception 'not_a_guardian' using errcode = '42501';
  end if;
  if p_days is null or p_days not between 30 and 365 then
    raise exception 'invalid_retention' using errcode = '22023';
  end if;
  update public.family_settings set retention_days = p_days where family_id = v_family;
  insert into public.audit_log (family_id, actor, action, target)
    values (v_family, auth.uid()::text, 'retention_changed', p_days::text);
end
$$;

-- Limpeza de UMA família. Apaga conversas sem atividade há mais que a retenção, com mensagens e eventos de segurança.
-- Conversa com alerta de crise ainda não resolvido fica até os pais resolverem.
-- Alertas já resolvidos e mais antigos que a retenção também saem.
create or replace function public.purge_expired_conversations(p_family_id uuid)
returns integer
language plpgsql security definer
set search_path = public
as $$
declare
  v_days    integer;
  v_cutoff  timestamptz;
  v_deleted integer;
begin
  select retention_days into v_days from public.family_settings where family_id = p_family_id;
  if v_days is null then
    return 0;
  end if;
  v_cutoff := now() - make_interval(days => v_days);

  with expired as (
    select cv.id
      from public.conversation cv
      join public.child c on c.id = cv.child_id
     where c.family_id = p_family_id
       and greatest(cv.started_at, coalesce((select max(m.created_at) from public.message m where m.conversation_id = cv.id), cv.started_at)) < v_cutoff
       and not exists (
         select 1
           from public.alert a
           join public.safety_event se on se.id = a.safety_event_id
           join public.message m on m.id = se.message_id
          where m.conversation_id = cv.id
            and a.family_id = p_family_id
            and a.severity = 'crisis'
            and a.status <> 'resolved')
  ), del as (
    delete from public.conversation where id in (select id from expired) returning 1
  )
  select count(*) into v_deleted from del;

  delete from public.alert
   where family_id = p_family_id and status = 'resolved' and created_at < v_cutoff;

  if v_deleted > 0 then
    insert into public.audit_log (family_id, actor, action, target)
      values (p_family_id, 'system', 'retention_purge', v_deleted::text);
  end if;
  return v_deleted;
end
$$;

-- Rotina agendada: percorre as famílias uma a uma, cada uma com a sua retenção.
create or replace function public.purge_expired_all()
returns integer
language plpgsql security definer
set search_path = public
as $$
declare
  f record;
  v_total integer := 0;
begin
  for f in select id from public.family loop
    v_total := v_total + public.purge_expired_conversations(f.id);
  end loop;
  return v_total;
end
$$;

create or replace function public._caller_family()
returns uuid
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_family uuid;
begin
  select family_id into v_family from public.guardian where auth_user_id = auth.uid();
  if v_family is null then
    raise exception 'not_a_guardian' using errcode = '42501';
  end if;
  return v_family;
end
$$;

-- Exporta tudo o que a família tem. Só a família de quem chama.
create or replace function public.export_family_data()
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_family uuid := public._caller_family();
  v_out    jsonb;
begin
  select jsonb_build_object(
    'exported_at', now(),
    'family', (select to_jsonb(f) from public.family f where f.id = v_family),
    'settings', (select to_jsonb(s) from public.family_settings s where s.family_id = v_family),
    'guardians', coalesce((select jsonb_agg(jsonb_build_object('name', g.name, 'email', g.email, 'role', g.role,
                   'consent_at', g.consent_at, 'consent_version', g.consent_version)) from public.guardian g where g.family_id = v_family), '[]'),
    'children', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'nickname', c.nickname, 'birth_year', c.birth_year,
                   'grade', c.grade, 'active', c.active)) from public.child c where c.family_id = v_family), '[]'),
    'conversations', coalesce((select jsonb_agg(jsonb_build_object(
        'id', cv.id, 'child_id', cv.child_id, 'title', cv.title, 'started_at', cv.started_at,
        'messages', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'role', m.role, 'content', m.content,
              'created_at', m.created_at,
              'safety_events', coalesce((select jsonb_agg(jsonb_build_object('layer', se.layer, 'category', se.category,
                    'decision', se.decision)) from public.safety_event se where se.message_id = m.id), '[]')) order by m.created_at, m.id)
            from public.message m where m.conversation_id = cv.id), '[]')) order by cv.started_at)
      from public.conversation cv join public.child c on c.id = cv.child_id where c.family_id = v_family), '[]'),
    'alerts', coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'child_id', a.child_id, 'severity', a.severity,
                   'status', a.status, 'created_at', a.created_at)) from public.alert a where a.family_id = v_family), '[]'),
    'audit_log', coalesce((select jsonb_agg(jsonb_build_object('actor', l.actor, 'action', l.action, 'target', l.target,
                   'created_at', l.created_at) order by l.created_at) from public.audit_log l where l.family_id = v_family), '[]')
  ) into v_out;

  insert into public.audit_log (family_id, actor, action, target)
    values (v_family, auth.uid()::text, 'data_exported', null);
  return v_out;
end
$$;

-- Registra que o responsável abriu o histórico de uma criança (a API chama ao servir o painel).
create or replace function public.audit_view(p_child_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_family uuid := public._caller_family();
begin
  if not exists (select 1 from public.child where id = p_child_id and family_id = v_family) then
    raise exception 'child_not_found' using errcode = '42501';
  end if;
  insert into public.audit_log (family_id, actor, action, target)
    values (v_family, auth.uid()::text, 'history_viewed', p_child_id::text);
end
$$;

create or replace function public.delete_conversation(p_conversation_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_family uuid := public._caller_family();
begin
  delete from public.conversation cv using public.child c
   where cv.id = p_conversation_id and c.id = cv.child_id and c.family_id = v_family;
  if not found then
    raise exception 'conversation_not_found' using errcode = '42501';
  end if;
  insert into public.audit_log (family_id, actor, action, target)
    values (v_family, auth.uid()::text, 'conversation_deleted', p_conversation_id::text);
end
$$;

-- Apaga todas as conversas de uma criança. Devolve quantas.
create or replace function public.delete_child_conversations(p_child_id uuid)
returns integer
language plpgsql security definer
set search_path = public
as $$
declare
  v_family uuid := public._caller_family();
  v_n      integer;
begin
  if not exists (select 1 from public.child where id = p_child_id and family_id = v_family) then
    raise exception 'child_not_found' using errcode = '42501';
  end if;
  with del as (delete from public.conversation where child_id = p_child_id returning 1)
  select count(*) into v_n from del;
  insert into public.audit_log (family_id, actor, action, target)
    values (v_family, auth.uid()::text, 'conversations_deleted', p_child_id::text || ':' || v_n);
  return v_n;
end
$$;

-- Exclui a conta: família, filhos, aparelhos, conversas, mensagens, eventos, alertas, auditoria e os logins dos responsáveis.
-- Só o responsável dono. A confirmação é explícita.
create or replace function public.delete_account(p_confirm boolean)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_family uuid := public._caller_family();
  v_users  uuid[];
begin
  if p_confirm is not true then
    raise exception 'confirmation_required' using errcode = '22023';
  end if;
  if not exists (select 1 from public.guardian where auth_user_id = auth.uid() and role = 'owner') then
    raise exception 'owner_required' using errcode = '42501';
  end if;
  select array_agg(auth_user_id) into v_users from public.guardian where family_id = v_family;
  delete from public.family where id = v_family;
  delete from auth.users where id = any (v_users);
end
$$;

revoke all on function public.set_retention_days(integer) from public;
revoke all on function public.purge_expired_conversations(uuid) from public;
revoke all on function public.purge_expired_all() from public;
revoke all on function public._caller_family() from public;
revoke all on function public.export_family_data() from public;
revoke all on function public.audit_view(uuid) from public;
revoke all on function public.delete_conversation(uuid) from public;
revoke all on function public.delete_child_conversations(uuid) from public;
revoke all on function public.delete_account(boolean) from public;
grant execute on function public.set_retention_days(integer) to authenticated;
grant execute on function public.export_family_data() to authenticated;
grant execute on function public.audit_view(uuid) to authenticated;
grant execute on function public.delete_conversation(uuid) to authenticated;
grant execute on function public.delete_child_conversations(uuid) to authenticated;
grant execute on function public.delete_account(boolean) to authenticated;
-- purge_* e _caller_family: só API/dono do banco (sem grant).
