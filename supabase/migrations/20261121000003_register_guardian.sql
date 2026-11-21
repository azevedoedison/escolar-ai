-- Tatá IA · M-02 · Cadastro do responsável com termo de consentimento.
-- O login em si é do Supabase Auth (e-mail/senha). Depois de criar a conta, o app chama
-- register_guardian: cria a família, o responsável (owner) e as configurações padrão,
-- gravando a data e a versão do termo aceito.

alter table public.guardian add column consent_version text;

create or replace function public.register_guardian(p_name text, p_consent boolean, p_consent_version text)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_email  text;
  v_family uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_consent is not true then
    raise exception 'consent_required' using errcode = '22023';
  end if;
  if coalesce(btrim(p_name), '') = '' or coalesce(btrim(p_consent_version), '') = '' then
    raise exception 'invalid_input' using errcode = '22023';
  end if;
  if exists (select 1 from public.guardian where auth_user_id = v_uid) then
    raise exception 'already_registered' using errcode = '23505';
  end if;

  select email into v_email from auth.users where id = v_uid;
  if v_email is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  insert into public.family default values returning id into v_family;
  insert into public.guardian (family_id, auth_user_id, name, email, role, consent_at, consent_version)
    values (v_family, v_uid, btrim(p_name), v_email, 'owner', now(), btrim(p_consent_version));
  insert into public.family_settings (family_id) values (v_family);
  insert into public.audit_log (family_id, actor, action, target)
    values (v_family, v_uid::text, 'consent_accepted', btrim(p_consent_version));

  return v_family;
end
$$;

revoke all on function public.register_guardian(text, boolean, text) from public;
grant execute on function public.register_guardian(text, boolean, text) to authenticated;
