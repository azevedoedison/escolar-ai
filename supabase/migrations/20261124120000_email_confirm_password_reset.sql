-- Tatá IA · confirmação de e-mail e recuperação de senha do responsável
-- (change recuperacao-de-senha-e-confirmacao, Linear TAT-57).
-- Tokens de uso único, só o hash fica no banco. Só a API (service role) chama estas funções.

alter table public.guardian add column email_confirmed_at timestamptz;
-- Quem já tem conta continua entrando: marca as existentes como confirmadas.
update public.guardian set email_confirmed_at = now() where email_confirmed_at is null;

create table public.guardian_email_token (
  id          uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references public.guardian(id) on delete cascade,
  purpose     text not null check (purpose in ('confirm_email', 'reset_password')),
  token_hash  text not null unique,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index guardian_email_token_guardian_idx on public.guardian_email_token(guardian_id, purpose);

alter table public.guardian_email_token enable row level security;
revoke all on public.guardian_email_token from anon, authenticated;
create policy api_only on public.guardian_email_token for all to authenticated using (false) with check (false);

-- ---------------------------------------------------------------- emissão
-- Devolve zero linhas quando não há nada a enviar (conta inexistente, já confirmada, limite de pedidos).
-- Quem chama responde igual nos dois casos. 3 pedidos por e-mail e 20 por origem, por hora.
create or replace function public._issue_email_token(p_email text, p_origin text, p_purpose text, p_ttl interval)
returns table (token text, guardian_name text)
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_email  text := lower(btrim(coalesce(p_email, '')));
  v_origin text := coalesce(nullif(btrim(p_origin), ''), 'unknown');
  v_scope  text := 'email_token_' || p_purpose;
  v_g      record;
  v_token  text;
begin
  if v_email = '' or public._is_locked(v_scope, v_email) or public._is_locked(v_scope || '_origin', v_origin) then
    return;
  end if;
  perform public._register_failure(v_scope, v_email, 3, interval '1 hour', interval '1 hour');
  perform public._register_failure(v_scope || '_origin', v_origin, 20, interval '1 hour', interval '1 hour');

  select g.id, g.family_id, g.name, g.email_confirmed_at into v_g
    from public.guardian g join auth.users u on u.id = g.auth_user_id
   where lower(u.email) = v_email;
  if not found then return; end if;
  if p_purpose = 'confirm_email' and v_g.email_confirmed_at is not null then return; end if;

  delete from public.guardian_email_token
   where guardian_id = v_g.id and purpose = p_purpose and used_at is null;
  v_token := public._new_token();
  insert into public.guardian_email_token (guardian_id, purpose, token_hash, expires_at)
    values (v_g.id, p_purpose, public._sha256(v_token), now() + p_ttl);
  insert into public.audit_log (family_id, actor, action, target)
    values (v_g.family_id, 'guardian:' || v_g.id::text,
            case p_purpose when 'confirm_email' then 'email_confirmation_requested' else 'password_reset_requested' end, null);
  return query select v_token, v_g.name;
end
$$;

create or replace function public.guardian_confirm_request(p_email text, p_origin text)
returns table (token text, guardian_name text)
language sql security definer set search_path = public, extensions
as $$ select * from public._issue_email_token(p_email, p_origin, 'confirm_email', interval '24 hours') $$;

create or replace function public.guardian_password_reset_request(p_email text, p_origin text)
returns table (token text, guardian_name text)
language sql security definer set search_path = public, extensions
as $$ select * from public._issue_email_token(p_email, p_origin, 'reset_password', interval '1 hour') $$;

-- ---------------------------------------------------------------- uso do link
-- Acha o token válido e o marca como usado. Link usado, vencido ou inventado dá a mesma resposta ('invalid');
-- erros contam por origem (10 em 10 minutos bloqueiam por 15).
create or replace function public._consume_email_token(p_token text, p_origin text, p_purpose text)
returns table (status text, guardian_id uuid, family_id uuid, auth_user_id uuid)
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_origin text := coalesce(nullif(btrim(p_origin), ''), 'unknown');
  v_t      record;
begin
  if public._is_locked('email_token', v_origin) then
    return query select 'locked', null::uuid, null::uuid, null::uuid; return;
  end if;
  select t.id, t.guardian_id, g.family_id, g.auth_user_id into v_t
    from public.guardian_email_token t join public.guardian g on g.id = t.guardian_id
   where t.token_hash = public._sha256(coalesce(p_token, '')) and t.purpose = p_purpose
     and t.used_at is null and t.expires_at > now()
   for update of t;
  if not found then
    perform public._register_failure('email_token', v_origin, 10, interval '10 minutes', interval '15 minutes');
    return query select 'invalid', null::uuid, null::uuid, null::uuid; return;
  end if;
  update public.guardian_email_token set used_at = now() where id = v_t.id;
  return query select 'ok', v_t.guardian_id, v_t.family_id, v_t.auth_user_id;
end
$$;

create or replace function public.guardian_confirm_email(p_token text, p_origin text) returns text
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v record;
begin
  select * into v from public._consume_email_token(p_token, p_origin, 'confirm_email');
  if v.status <> 'ok' then return v.status; end if;
  update public.guardian set email_confirmed_at = coalesce(email_confirmed_at, now()) where id = v.guardian_id;
  insert into public.audit_log (family_id, actor, action, target)
    values (v.family_id, 'guardian:' || v.guardian_id::text, 'email_confirmed', null);
  return 'ok';
end
$$;

-- Senha nova: mínimo de 8 caracteres (igual ao cadastro). Senha curta NÃO gasta o link.
create or replace function public.guardian_password_reset(p_token text, p_password text, p_origin text) returns text
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v record;
begin
  if p_password is null or length(p_password) < 8 then
    -- Só avisa "weak" para quem tem um link válido; quem não tem recebe 'invalid' como sempre.
    if exists (select 1 from public.guardian_email_token t
                where t.token_hash = public._sha256(coalesce(p_token, '')) and t.purpose = 'reset_password'
                  and t.used_at is null and t.expires_at > now()) then
      return 'weak';
    end if;
    select * into v from public._consume_email_token(p_token, p_origin, 'reset_password');
    return v.status;
  end if;

  select * into v from public._consume_email_token(p_token, p_origin, 'reset_password');
  if v.status <> 'ok' then return v.status; end if;

  update auth.users set encrypted_password = crypt(p_password, gen_salt('bf', 10)) where id = v.auth_user_id;
  -- Quem recebeu o link controla o e-mail: a conta passa a confirmada.
  update public.guardian set email_confirmed_at = coalesce(email_confirmed_at, now()) where id = v.guardian_id;
  -- Encerra todas as sessões do responsável (login direto, modo Responsável e Supabase Auth).
  delete from public.guardian_session where guardian_id = v.guardian_id;
  delete from public.guardian_mode_session where guardian_id = v.guardian_id;
  if to_regclass('auth.sessions') is not null then
    execute 'delete from auth.sessions where user_id = $1' using v.auth_user_id;
  end if;
  delete from public.guardian_email_token where guardian_id = v.guardian_id and used_at is null;
  delete from public.attempt_counter
   where scope = 'guardian_login' and key = (select lower(email) from auth.users where id = v.auth_user_id);
  insert into public.audit_log (family_id, actor, action, target)
    values (v.family_id, 'guardian:' || v.guardian_id::text, 'password_reset', null);
  return 'ok';
end
$$;

-- ---------------------------------------------------------------- logins exigem e-mail confirmado
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

  select g.id, g.family_id, g.email_confirmed_at, u.encrypted_password into v_g
    from public.guardian g join auth.users u on u.id = g.auth_user_id
   where lower(u.email) = v_email;
  if not found or v_g.encrypted_password is null or v_g.encrypted_password <> crypt(p_password, v_g.encrypted_password) then
    perform public._register_failure('guardian_login', v_email, 5, interval '5 minutes', interval '15 minutes');
    return query select 'invalid', null::text, null::timestamptz; return;
  end if;

  perform public._clear_failures('guardian_login', v_email);
  -- Só quem acertou a senha descobre que falta confirmar: não revela quais e-mails têm conta.
  if v_g.email_confirmed_at is null then
    return query select 'unconfirmed', null::text, null::timestamptz; return;
  end if;
  v_token := public._new_token();
  insert into public.guardian_session (guardian_id, token_hash, expires_at)
    values (v_g.id, public._sha256(v_token), v_exp);
  insert into public.audit_log (family_id, actor, action, target)
    values (v_g.family_id, 'guardian:' || v_g.id::text, 'guardian_login', null);
  return query select 'ok', v_token, v_exp;
end
$$;

create or replace function public.guardian_mode_enter(p_session_token text, p_email text, p_password text)
returns table (status text, mode_token text, expires_at timestamptz)
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_s     record;
  v_g     record;
  v_token text;
  v_exp   timestamptz := now() + interval '15 minutes';
begin
  select * into v_s from public.verify_child_session(p_session_token);
  if not found then
    return query select 'unauthorized', null::text, null::timestamptz; return;
  end if;
  if public._is_locked('guardian', v_s.family_id::text) then
    return query select 'locked', null::text, null::timestamptz; return;
  end if;

  select g.id, g.email_confirmed_at, u.encrypted_password into v_g
    from public.guardian g join auth.users u on u.id = g.auth_user_id
   where g.family_id = v_s.family_id and lower(u.email) = lower(btrim(coalesce(p_email, '')));
  if not found or v_g.encrypted_password is null or p_password is null
     or v_g.encrypted_password <> crypt(p_password, v_g.encrypted_password) then
    perform public._register_failure('guardian', v_s.family_id::text, 5, interval '5 minutes', interval '15 minutes');
    return query select 'invalid', null::text, null::timestamptz; return;
  end if;

  perform public._clear_failures('guardian', v_s.family_id::text);
  if v_g.email_confirmed_at is null then
    return query select 'unconfirmed', null::text, null::timestamptz; return;
  end if;
  v_token := public._new_token();
  insert into public.guardian_mode_session (session_id, guardian_id, token_hash, expires_at)
    values (v_s.session_id, v_g.id, public._sha256(v_token), v_exp);
  insert into public.audit_log (family_id, actor, action, target)
    values (v_s.family_id, 'child:' || v_s.child_id::text, 'guardian_mode_entered', v_g.id::text);
  return query select 'ok', v_token, v_exp;
end
$$;

revoke all on function public._issue_email_token(text, text, text, interval), public.guardian_confirm_request(text, text),
  public.guardian_password_reset_request(text, text), public._consume_email_token(text, text, text),
  public.guardian_confirm_email(text, text), public.guardian_password_reset(text, text, text),
  public.guardian_login(text, text), public.guardian_mode_enter(text, text, text) from public;
