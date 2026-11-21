-- Tatá IA · M-03 · Cadastro de filho com PIN.
-- O PIN nunca é gravado em texto puro nem lido pelo responsável: só o hash (bcrypt via pgcrypto),
-- definido pelas funções abaixo. A leitura da coluna pin_hash fica restrita à API (service role).

revoke select, insert, update on public.child from authenticated;
grant select (id, family_id, nickname, birth_year, grade, avatar, active) on public.child to authenticated;
grant update (nickname, grade, avatar, active) on public.child to authenticated;
-- delete continua liberado (política child_delete).

create or replace function public.create_child(
  p_nickname text, p_birth_year integer, p_grade text, p_avatar text, p_pin text
) returns uuid
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v_family uuid;
  v_year   integer := extract(year from now());
  v_id     uuid;
begin
  select family_id into v_family from public.guardian where auth_user_id = auth.uid();
  if v_family is null then
    raise exception 'not_a_guardian' using errcode = '42501';
  end if;
  if coalesce(btrim(p_nickname), '') = '' then
    raise exception 'invalid_nickname' using errcode = '22023';
  end if;
  if p_birth_year is null or v_year - p_birth_year not between 5 and 17 then
    raise exception 'invalid_birth_year' using errcode = '22023';
  end if;
  if p_pin is null or p_pin !~ '^[0-9]{4,6}$' then
    raise exception 'invalid_pin' using errcode = '22023';
  end if;

  insert into public.child (family_id, nickname, birth_year, grade, avatar, pin_hash)
    values (v_family, btrim(p_nickname), p_birth_year, nullif(btrim(p_grade), ''), p_avatar, crypt(p_pin, gen_salt('bf')))
    returning id into v_id;
  insert into public.audit_log (family_id, actor, action, target)
    values (v_family, auth.uid()::text, 'child_created', v_id::text);
  return v_id;
end
$$;

create or replace function public.set_child_pin(p_child_id uuid, p_pin text)
returns void
language plpgsql security definer
set search_path = public, extensions
as $$
begin
  if p_pin is null or p_pin !~ '^[0-9]{4,6}$' then
    raise exception 'invalid_pin' using errcode = '22023';
  end if;
  update public.child set pin_hash = crypt(p_pin, gen_salt('bf'))
   where id = p_child_id and family_id in (select public.current_family_ids());
  if not found then
    raise exception 'child_not_found' using errcode = '42501';
  end if;
  insert into public.audit_log (family_id, actor, action, target)
    select family_id, auth.uid()::text, 'child_pin_changed', p_child_id::text from public.child where id = p_child_id;
end
$$;

revoke all on function public.create_child(text, integer, text, text, text) from public;
revoke all on function public.set_child_pin(uuid, text) from public;
grant execute on function public.create_child(text, integer, text, text, text) to authenticated;
grant execute on function public.set_child_pin(uuid, text) to authenticated;
