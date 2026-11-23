-- Tatá IA · Login da criança com Google (opcional, ao lado do PIN e do e-mail e senha).
--
-- O responsável informa o e-mail Google da criança (set_child_google). No primeiro login com Google o
-- identificador estável da conta (`sub`) fica gravado; dali em diante vale o `sub`, não o e-mail.
-- Vale só em aparelho já pareado e usa o mesmo contador de tentativas do PIN (6 erros em 5 min, 15 min de bloqueio).

alter table public.child
  add column google_email text,
  add column google_sub   text;
create unique index child_google_email_idx on public.child (lower(google_email)) where google_email is not null;
create unique index child_google_sub_idx   on public.child (google_sub) where google_sub is not null;

-- O responsável vê o e-mail Google vinculado; o `sub` nunca sai do banco.
grant select (google_email) on public.child to authenticated;

-- Responsável vincula (ou, com e-mail nulo, desvincula) a conta Google do filho. Trocar o e-mail zera o `sub`.
create or replace function public.set_child_google(p_child_id uuid, p_email text)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_family uuid;
begin
  if p_email is not null and p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email' using errcode = '22023';
  end if;
  select family_id into v_family from public.child
   where id = p_child_id and family_id in (select public.current_family_ids());
  if v_family is null then
    raise exception 'child_not_found' using errcode = '42501';
  end if;
  begin
    update public.child set google_email = lower(btrim(p_email)), google_sub = null where id = p_child_id;
  exception when unique_violation then
    raise exception 'email_in_use' using errcode = '23505';
  end;
  insert into public.audit_log (family_id, actor, action, target)
    values (v_family, auth.uid()::text, case when p_email is null then 'child_google_unlinked' else 'child_google_linked' end, p_child_id::text);
end
$$;

-- API: login no aparelho pareado com a identidade já verificada pelo Google (sub + e-mail verificado).
create or replace function public.child_login_google(p_device_token text, p_sub text, p_email text)
returns table (status text, session_token text, expires_at timestamptz)
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_dev   public.device;
  v_child public.child;
  v_ok    boolean;
  v_token text;
  v_exp   timestamptz := now() + interval '12 hours';
begin
  select * into v_dev from public.device where token_hash = public._sha256(coalesce(p_device_token, ''));
  if not found or v_dev.revoked_at is not null then
    return query select 'revoked', null::text, null::timestamptz; return;
  end if;
  select * into v_child from public.child where id = v_dev.child_id and active;
  if not found then
    return query select 'revoked', null::text, null::timestamptz; return;
  end if;
  if public._is_locked('child', v_child.id::text) then
    return query select 'locked', null::text, null::timestamptz; return;
  end if;

  if p_sub is null or btrim(p_sub) = '' then
    v_ok := false;
  elsif v_child.google_sub is not null then
    v_ok := v_child.google_sub = p_sub;
  else
    v_ok := v_child.google_email is not null and p_email is not null
      and lower(btrim(p_email)) = v_child.google_email;
    if v_ok then
      begin
        update public.child set google_sub = p_sub where id = v_child.id;
      exception when unique_violation then
        v_ok := false;
      end;
    end if;
  end if;

  if not v_ok then
    perform public._register_failure('child', v_child.id::text, 6, interval '5 minutes', interval '15 minutes');
    return query select 'invalid', null::text, null::timestamptz; return;
  end if;

  perform public._clear_failures('child', v_child.id::text);
  v_token := public._new_token();
  insert into public.child_session (device_id, child_id, token_hash, expires_at)
    values (v_dev.id, v_child.id, public._sha256(v_token), v_exp);
  update public.device set last_seen_at = now() where id = v_dev.id;
  return query select 'ok', v_token, v_exp;
end
$$;

revoke all on function public.set_child_google(uuid, text), public.child_login_google(text, text, text) from public;
grant execute on function public.set_child_google(uuid, text) to authenticated;
