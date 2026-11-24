-- Tatá IA · B-02 · Privacidade pela API (openspec/changes/privacidade-e-retencao).
--
-- As funções de privacidade da migração 20261122120000 identificam o responsável por auth.uid() (JWT do Supabase).
-- A API autentica o responsável por sessão própria (login direto ou modo Responsável) e fala com o banco como dono,
-- sem JWT. Aqui a regra sai das funções chamadas por RPC para funções internas que recebem a família e o ator;
-- as funções por RPC continuam com a mesma assinatura e viram invólucros. A API usa os invólucros api_*, que
-- recebem o id do responsável e tiram a família dele no banco (nunca de um valor enviado pelo cliente).
-- Nada daqui é concedido a authenticated: só API e dono do banco executam.

-- Família e ator de um responsável. O ator é o mesmo texto que o RPC grava (id do login), para a trilha ficar uniforme.
create or replace function public._guardian_ctx(p_guardian uuid, out family_id uuid, out actor text)
language plpgsql stable security definer
set search_path = public
as $$
begin
  select g.family_id, g.auth_user_id::text into family_id, actor from public.guardian g where g.id = p_guardian;
  if family_id is null then
    raise exception 'not_a_guardian' using errcode = '42501';
  end if;
end
$$;

-- Retenção -------------------------------------------------------------------------------------------------------

create or replace function public._set_retention(p_family uuid, p_actor text, p_days integer)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if p_days is null or p_days not between 30 and 365 then
    raise exception 'invalid_retention' using errcode = '22023';
  end if;
  update public.family_settings set retention_days = p_days where family_id = p_family;
  insert into public.audit_log (family_id, actor, action, target)
    values (p_family, p_actor, 'retention_changed', p_days::text);
end
$$;

create or replace function public.set_retention_days(p_days integer)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  perform public._set_retention(public._caller_family(), auth.uid()::text, p_days);
end
$$;

create or replace function public.api_get_retention(p_guardian uuid)
returns integer
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_family uuid := (public._guardian_ctx(p_guardian)).family_id;
begin
  return (select retention_days from public.family_settings where family_id = v_family);
end
$$;

create or replace function public.api_set_retention(p_guardian uuid, p_days integer)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  c record;
begin
  select * into c from public._guardian_ctx(p_guardian);
  perform public._set_retention(c.family_id, c.actor, p_days);
end
$$;

-- Exportação -----------------------------------------------------------------------------------------------------

create or replace function public._export_family(p_family uuid, p_actor text)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_out jsonb;
begin
  select jsonb_build_object(
    'exported_at', now(),
    'family', (select to_jsonb(f) from public.family f where f.id = p_family),
    'settings', (select to_jsonb(s) from public.family_settings s where s.family_id = p_family),
    'guardians', coalesce((select jsonb_agg(jsonb_build_object('name', g.name, 'email', g.email, 'role', g.role,
                   'consent_at', g.consent_at, 'consent_version', g.consent_version)) from public.guardian g where g.family_id = p_family), '[]'),
    'children', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'nickname', c.nickname, 'birth_year', c.birth_year,
                   'grade', c.grade, 'active', c.active)) from public.child c where c.family_id = p_family), '[]'),
    'conversations', coalesce((select jsonb_agg(jsonb_build_object(
        'id', cv.id, 'child_id', cv.child_id, 'title', cv.title, 'started_at', cv.started_at,
        'messages', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'role', m.role, 'content', m.content,
              'created_at', m.created_at,
              'safety_events', coalesce((select jsonb_agg(jsonb_build_object('layer', se.layer, 'category', se.category,
                    'decision', se.decision)) from public.safety_event se where se.message_id = m.id), '[]')) order by m.created_at, m.id)
            from public.message m where m.conversation_id = cv.id), '[]')) order by cv.started_at)
      from public.conversation cv join public.child c on c.id = cv.child_id where c.family_id = p_family), '[]'),
    'alerts', coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'child_id', a.child_id, 'severity', a.severity,
                   'status', a.status, 'created_at', a.created_at)) from public.alert a where a.family_id = p_family), '[]'),
    'audit_log', coalesce((select jsonb_agg(jsonb_build_object('actor', l.actor, 'action', l.action, 'target', l.target,
                   'created_at', l.created_at) order by l.created_at) from public.audit_log l where l.family_id = p_family), '[]')
  ) into v_out;

  insert into public.audit_log (family_id, actor, action, target)
    values (p_family, p_actor, 'data_exported', null);
  return v_out;
end
$$;

create or replace function public.export_family_data()
returns jsonb
language plpgsql security definer
set search_path = public
as $$
begin
  return public._export_family(public._caller_family(), auth.uid()::text);
end
$$;

create or replace function public.api_export_family(p_guardian uuid)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  c record;
begin
  select * into c from public._guardian_ctx(p_guardian);
  return public._export_family(c.family_id, c.actor);
end
$$;

-- Apagar conversas e excluir filho -------------------------------------------------------------------------------

create or replace function public._delete_conversation(p_family uuid, p_actor text, p_conversation_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  delete from public.conversation cv using public.child c
   where cv.id = p_conversation_id and c.id = cv.child_id and c.family_id = p_family;
  if not found then
    raise exception 'conversation_not_found' using errcode = '42501';
  end if;
  insert into public.audit_log (family_id, actor, action, target)
    values (p_family, p_actor, 'conversation_deleted', p_conversation_id::text);
end
$$;

create or replace function public.delete_conversation(p_conversation_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  perform public._delete_conversation(public._caller_family(), auth.uid()::text, p_conversation_id);
end
$$;

create or replace function public._delete_child_conversations(p_family uuid, p_actor text, p_child_id uuid)
returns integer
language plpgsql security definer
set search_path = public
as $$
declare
  v_n integer;
begin
  if not exists (select 1 from public.child where id = p_child_id and family_id = p_family) then
    raise exception 'child_not_found' using errcode = '42501';
  end if;
  with del as (delete from public.conversation where child_id = p_child_id returning 1)
  select count(*) into v_n from del;
  insert into public.audit_log (family_id, actor, action, target)
    values (p_family, p_actor, 'conversations_deleted', p_child_id::text || ':' || v_n);
  return v_n;
end
$$;

create or replace function public.delete_child_conversations(p_child_id uuid)
returns integer
language plpgsql security definer
set search_path = public
as $$
begin
  return public._delete_child_conversations(public._caller_family(), auth.uid()::text, p_child_id);
end
$$;

create or replace function public._delete_child(p_family uuid, p_actor text, p_child_id uuid, p_confirm boolean)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if p_confirm is not true then
    raise exception 'confirmation_required' using errcode = '22023';
  end if;
  delete from public.child where id = p_child_id and family_id = p_family;
  if not found then
    raise exception 'child_not_found' using errcode = '42501';
  end if;
  insert into public.audit_log (family_id, actor, action, target)
    values (p_family, p_actor, 'child_deleted', p_child_id::text);
end
$$;

create or replace function public.delete_child(p_child_id uuid, p_confirm boolean)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  perform public._delete_child(public._caller_family(), auth.uid()::text, p_child_id, p_confirm);
end
$$;

create or replace function public.api_delete_conversation(p_guardian uuid, p_conversation_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  c record;
begin
  select * into c from public._guardian_ctx(p_guardian);
  perform public._delete_conversation(c.family_id, c.actor, p_conversation_id);
end
$$;

create or replace function public.api_delete_child_conversations(p_guardian uuid, p_child_id uuid)
returns integer
language plpgsql security definer
set search_path = public
as $$
declare
  c record;
begin
  select * into c from public._guardian_ctx(p_guardian);
  return public._delete_child_conversations(c.family_id, c.actor, p_child_id);
end
$$;

create or replace function public.api_delete_child(p_guardian uuid, p_child_id uuid, p_confirm boolean)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  c record;
begin
  select * into c from public._guardian_ctx(p_guardian);
  perform public._delete_child(c.family_id, c.actor, p_child_id, p_confirm);
end
$$;

-- Permissões: as internas e as api_* não têm grant; as funções por RPC mantêm os grants que já tinham
-- (create or replace preserva). Reforça o revoke para as novas.
revoke all on function public._guardian_ctx(uuid), public._set_retention(uuid, text, integer),
  public._export_family(uuid, text), public._delete_conversation(uuid, text, uuid),
  public._delete_child_conversations(uuid, text, uuid), public._delete_child(uuid, text, uuid, boolean),
  public.api_get_retention(uuid), public.api_set_retention(uuid, integer), public.api_export_family(uuid),
  public.api_delete_conversation(uuid, uuid), public.api_delete_child_conversations(uuid, uuid),
  public.api_delete_child(uuid, uuid, boolean) from public;
