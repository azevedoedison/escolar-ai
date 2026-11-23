-- Tatá IA · login direto do responsável (change login-direto-responsavel).
-- O responsável tem conta própria (e-mail e senha) e entra no painel de qualquer aparelho, sem passar
-- pelo aparelho da criança. A sessão é opaca: só o hash fica no banco, e sair a revoga na hora.

create table public.guardian_session (
  id          uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references public.guardian(id) on delete cascade,
  token_hash  text not null unique,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);
create index guardian_session_guardian_idx on public.guardian_session(guardian_id);

alter table public.guardian_session enable row level security;
revoke all on public.guardian_session from anon, authenticated;
create policy api_only on public.guardian_session for all to authenticated using (false) with check (false);

-- Entrar com e-mail e senha. Erra igual para e-mail desconhecido e senha errada. O contador é por e-mail
-- (existente ou não), então não revela quais e-mails têm conta. 5 erros em 5 minutos bloqueiam por 15.
create or replace function public.guardian_login(p_email text, p_password text)
returns table (status text, token text, expires_at timestamptz)
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_g     record;
  v_token text;
  v_exp   timestamptz := now() + interval '7 days';
begin
  if v_email = '' or p_password is null then
    return query select 'invalid', null::text, null::timestamptz; return;
  end if;
  if public._is_locked('guardian_login', v_email) then
    return query select 'locked', null::text, null::timestamptz; return;
  end if;

  select g.id, g.family_id, u.encrypted_password into v_g
    from public.guardian g join auth.users u on u.id = g.auth_user_id
   where lower(u.email) = v_email;
  if not found or v_g.encrypted_password is null or v_g.encrypted_password <> crypt(p_password, v_g.encrypted_password) then
    perform public._register_failure('guardian_login', v_email, 5, interval '5 minutes', interval '15 minutes');
    return query select 'invalid', null::text, null::timestamptz; return;
  end if;

  perform public._clear_failures('guardian_login', v_email);
  v_token := public._new_token();
  insert into public.guardian_session (guardian_id, token_hash, expires_at)
    values (v_g.id, public._sha256(v_token), v_exp);
  insert into public.audit_log (family_id, actor, action, target)
    values (v_g.family_id, 'guardian:' || v_g.id::text, 'guardian_login', null);
  return query select 'ok', v_token, v_exp;
end
$$;

create or replace function public.verify_guardian_session(p_token text)
returns table (guardian_id uuid, family_id uuid)
language sql security definer set search_path = public, extensions
as $$
  select s.guardian_id, g.family_id
    from public.guardian_session s join public.guardian g on g.id = s.guardian_id
   where s.token_hash = public._sha256(coalesce(p_token, '')) and s.expires_at > now()
$$;

create or replace function public.guardian_logout(p_token text) returns void
language sql security definer set search_path = public, extensions
as $$ delete from public.guardian_session where token_hash = public._sha256(coalesce(p_token, '')) $$;

-- Responsável autenticado por qualquer um dos dois caminhos: login direto ou modo Responsável no aparelho da criança.
create or replace function public.verify_guardian(p_token text)
returns table (guardian_id uuid, family_id uuid)
language sql security definer set search_path = public, extensions
as $$
  select * from public.verify_guardian_session(p_token)
  union all
  select * from public.verify_guardian_mode(p_token)
  limit 1
$$;

revoke all on function public.guardian_login(text, text), public.verify_guardian_session(text),
  public.guardian_logout(text), public.verify_guardian(text) from public;
