-- Tatá IA · M-04/M-05/M-34 · Pareamento do aparelho, login da criança, modo Responsável e aparelhos.
--
-- Quem chama o quê:
--  * Responsável (papel authenticated, via RPC): create_pairing_code, set_child_credentials, list_devices, revoke_device.
--  * API (service role / dono do banco): redeem_pairing_code, child_login, verify_*, guardian_mode_*.
-- Tokens e códigos só existem em texto puro na resposta de quem os gera; no banco fica o hash (sha256).
-- Falhas de tentativa NÃO levantam exceção: a função devolve um status, para o contador sobreviver ao commit.

alter table public.device
  add column label      text,
  add column token_hash text unique;

alter table public.child
  add column login_email    text,
  add column password_hash  text;
create unique index child_login_email_idx on public.child (lower(login_email)) where login_email is not null;

-- O responsável não lê hashes nem o e-mail de login pela tabela.
revoke select on public.device from authenticated;
grant select (id, child_id, platform, label, paired_at, last_seen_at, revoked_at) on public.device to authenticated;

create table public.pairing_code (
  id         uuid primary key default gen_random_uuid(),
  child_id   uuid not null references public.child(id) on delete cascade,
  code_hash  text not null,
  expires_at timestamptz not null,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);
create index pairing_code_hash_idx on public.pairing_code(code_hash) where used_at is null;

create table public.child_session (
  id         uuid primary key default gen_random_uuid(),
  device_id  uuid not null references public.device(id) on delete cascade,
  child_id   uuid not null references public.child(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.guardian_mode_session (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.child_session(id) on delete cascade,
  guardian_id uuid not null references public.guardian(id) on delete cascade,
  token_hash  text not null unique,
  expires_at  timestamptz not null
);

-- Contador de tentativas persistido: sobrevive a reinício do servidor (ISO-10).
-- scope: 'child' (PIN/senha da criança), 'guardian' (senha no modo Responsável), 'pairing' (código, por origem).
create table public.attempt_counter (
  scope        text not null,
  key          text not null,
  failures     integer not null default 0,
  window_start timestamptz not null default now(),
  locked_until timestamptz,
  primary key (scope, key)
);

alter table public.pairing_code          enable row level security;
alter table public.child_session         enable row level security;
alter table public.guardian_mode_session enable row level security;
alter table public.attempt_counter       enable row level security;
revoke all on public.pairing_code, public.child_session, public.guardian_mode_session, public.attempt_counter
  from anon, authenticated;
-- Política explícita de recusa: só a API (service role, que ignora RLS) acessa estas tabelas.
create policy api_only on public.pairing_code          for all to authenticated using (false) with check (false);
create policy api_only on public.child_session         for all to authenticated using (false) with check (false);
create policy api_only on public.guardian_mode_session for all to authenticated using (false) with check (false);
create policy api_only on public.attempt_counter       for all to authenticated using (false) with check (false);

-- ---------------------------------------------------------------- utilitários internos

create or replace function public._sha256(p text) returns text
language sql immutable set search_path = public, extensions
as $$ select encode(digest(p, 'sha256'), 'hex') $$;

create or replace function public._new_token() returns text
language sql volatile set search_path = public, extensions
as $$ select encode(gen_random_bytes(32), 'hex') $$;

-- Devolve true se a chave está bloqueada agora.
create or replace function public._is_locked(p_scope text, p_key text) returns boolean
language sql stable set search_path = public
as $$
  select coalesce((select locked_until > now() from public.attempt_counter where scope = p_scope and key = p_key), false)
$$;

-- Registra uma falha. Ao atingir p_max falhas dentro de p_window, bloqueia por p_lock.
create or replace function public._register_failure(p_scope text, p_key text, p_max int, p_window interval, p_lock interval)
returns void
language plpgsql set search_path = public
as $$
declare
  v public.attempt_counter;
begin
  insert into public.attempt_counter (scope, key) values (p_scope, p_key) on conflict do nothing;
  select * into v from public.attempt_counter where scope = p_scope and key = p_key for update;
  if v.window_start < now() - p_window then
    v.failures := 0;
    v.window_start := now();
  end if;
  v.failures := v.failures + 1;
  if v.failures >= p_max then
    update public.attempt_counter set failures = 0, window_start = now(), locked_until = now() + p_lock
     where scope = p_scope and key = p_key;
  else
    update public.attempt_counter set failures = v.failures, window_start = v.window_start
     where scope = p_scope and key = p_key;
  end if;
end
$$;

create or replace function public._clear_failures(p_scope text, p_key text) returns void
language sql set search_path = public
as $$ delete from public.attempt_counter where scope = p_scope and key = p_key $$;

revoke all on function public._sha256(text), public._new_token(), public._is_locked(text, text),
  public._register_failure(text, text, int, interval, interval), public._clear_failures(text, text) from public;

-- ---------------------------------------------------------------- responsável (RPC, authenticated)

-- Código de 6 dígitos, vale 10 minutos e um único uso. Gerar outro invalida os anteriores do mesmo filho.
create or replace function public.create_pairing_code(p_child_id uuid)
returns table (code text, expires_at timestamptz)
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_family uuid;
  v_code   text;
  v_exp    timestamptz := now() + interval '10 minutes';
begin
  select family_id into v_family from public.child
   where id = p_child_id and active and family_id in (select public.current_family_ids());
  if v_family is null then
    raise exception 'child_not_found' using errcode = '42501';
  end if;

  update public.pairing_code set used_at = now() where child_id = p_child_id and used_at is null;

  loop
    v_code := lpad((floor(random() * 1000000))::int::text, 6, '0');
    exit when not exists (
      select 1 from public.pairing_code pc
       where pc.code_hash = public._sha256(v_code) and pc.used_at is null and pc.expires_at > now());
  end loop;

  insert into public.pairing_code (child_id, code_hash, expires_at) values (p_child_id, public._sha256(v_code), v_exp);
  insert into public.audit_log (family_id, actor, action, target)
    values (v_family, auth.uid()::text, 'pairing_code_created', p_child_id::text);
  return query select v_code, v_exp;
end
$$;

-- Login da criança com e-mail e senha definidos pelo responsável (além do PIN).
create or replace function public.set_child_credentials(p_child_id uuid, p_email text, p_password text)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_family uuid;
begin
  if p_email is null or p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email' using errcode = '22023';
  end if;
  if p_password is null or char_length(p_password) < 8 then
    raise exception 'invalid_password' using errcode = '22023';
  end if;
  select family_id into v_family from public.child
   where id = p_child_id and family_id in (select public.current_family_ids());
  if v_family is null then
    raise exception 'child_not_found' using errcode = '42501';
  end if;
  begin
    update public.child set login_email = lower(btrim(p_email)), password_hash = crypt(p_password, gen_salt('bf'))
     where id = p_child_id;
  exception when unique_violation then
    raise exception 'email_in_use' using errcode = '23505';
  end;
  insert into public.audit_log (family_id, actor, action, target)
    values (v_family, auth.uid()::text, 'child_credentials_set', p_child_id::text);
end
$$;

-- M-34: aparelhos pareados da família.
create or replace function public.list_devices()
returns table (id uuid, child_id uuid, child_nickname text, platform text, label text,
               paired_at timestamptz, last_seen_at timestamptz, revoked_at timestamptz)
language sql stable security definer set search_path = public
as $$
  select d.id, d.child_id, c.nickname, d.platform, d.label, d.paired_at, d.last_seen_at, d.revoked_at
    from public.device d join public.child c on c.id = d.child_id
   where c.family_id in (select public.current_family_ids())
   order by d.paired_at desc
$$;

-- Revoga o aparelho e derruba as sessões dele na hora.
create or replace function public.revoke_device(p_device_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_family uuid;
begin
  select c.family_id into v_family from public.device d join public.child c on c.id = d.child_id
   where d.id = p_device_id and c.family_id in (select public.current_family_ids());
  if v_family is null then
    raise exception 'device_not_found' using errcode = '42501';
  end if;
  update public.device set revoked_at = coalesce(revoked_at, now()) where id = p_device_id;
  delete from public.child_session where device_id = p_device_id;
  insert into public.audit_log (family_id, actor, action, target)
    values (v_family, auth.uid()::text, 'device_revoked', p_device_id::text);
end
$$;

revoke all on function public.create_pairing_code(uuid), public.set_child_credentials(uuid, text, text),
  public.list_devices(), public.revoke_device(uuid) from public;
grant execute on function public.create_pairing_code(uuid), public.set_child_credentials(uuid, text, text),
  public.list_devices(), public.revoke_device(uuid) to authenticated;

-- ---------------------------------------------------------------- API (service role)

-- Troca o código pelo token do aparelho. p_origin limita tentativas por origem (10 erros em 10 min bloqueiam 15 min).
create or replace function public.redeem_pairing_code(p_code text, p_platform text, p_origin text, p_label text default null)
returns table (status text, device_id uuid, child_id uuid, device_token text)
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_pc    public.pairing_code;
  v_token text;
  v_dev   uuid;
begin
  if public._is_locked('pairing', p_origin) then
    return query select 'locked', null::uuid, null::uuid, null::text; return;
  end if;
  if p_platform not in ('android', 'ios', 'web') or p_code is null or p_code !~ '^[0-9]{6}$' then
    perform public._register_failure('pairing', p_origin, 10, interval '10 minutes', interval '15 minutes');
    return query select 'invalid', null::uuid, null::uuid, null::text; return;
  end if;

  select * into v_pc from public.pairing_code
   where code_hash = public._sha256(p_code) and used_at is null and expires_at > now()
   order by created_at desc limit 1 for update;
  if not found then
    perform public._register_failure('pairing', p_origin, 10, interval '10 minutes', interval '15 minutes');
    return query select 'invalid', null::uuid, null::uuid, null::text; return;
  end if;

  update public.pairing_code set used_at = now() where id = v_pc.id;
  v_token := public._new_token();
  insert into public.device (child_id, platform, label, token_hash)
    values (v_pc.child_id, p_platform, nullif(btrim(p_label), ''), public._sha256(v_token))
    returning id into v_dev;
  insert into public.audit_log (family_id, actor, action, target)
    select family_id, 'device:' || v_dev::text, 'device_paired', v_dev::text from public.child where id = v_pc.child_id;
  perform public._clear_failures('pairing', p_origin);
  return query select 'ok', v_dev, v_pc.child_id, v_token;
end
$$;

-- Login da criança no aparelho pareado: PIN (p_identifier nulo) ou e-mail + senha.
-- 6 erros em 5 minutos bloqueiam o filho por 15 minutos. Sessão dura 12 horas.
create or replace function public.child_login(p_device_token text, p_identifier text, p_secret text)
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

  if p_identifier is null then
    v_ok := v_child.pin_hash is not null and p_secret is not null and v_child.pin_hash = crypt(p_secret, v_child.pin_hash);
  else
    v_ok := v_child.login_email is not null and v_child.password_hash is not null and p_secret is not null
      and lower(btrim(p_identifier)) = v_child.login_email
      and v_child.password_hash = crypt(p_secret, v_child.password_hash);
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

-- Valida a sessão da criança. Aparelho revogado ou sessão vencida: nenhuma linha (a API responde 401).
create or replace function public.verify_child_session(p_token text)
returns table (session_id uuid, child_id uuid, family_id uuid, device_id uuid, age integer)
language sql security definer set search_path = public, extensions
as $$
  select s.id, s.child_id, c.family_id, s.device_id, (extract(year from now())::int - c.birth_year)
    from public.child_session s
    join public.device d on d.id = s.device_id and d.revoked_at is null
    join public.child c on c.id = s.child_id and c.active
   where s.token_hash = public._sha256(coalesce(p_token, '')) and s.expires_at > now()
$$;

create or replace function public.child_logout(p_token text) returns void
language sql security definer set search_path = public, extensions
as $$ delete from public.child_session where token_hash = public._sha256(coalesce(p_token, '')) $$;

-- Modo Responsável: a criança só entra com o e-mail e a senha de um responsável da MESMA família.
-- A senha é conferida contra auth.users.encrypted_password (bcrypt do Supabase Auth). 5 erros em 5 min bloqueiam 15 min.
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

  select g.id, u.encrypted_password into v_g
    from public.guardian g join auth.users u on u.id = g.auth_user_id
   where g.family_id = v_s.family_id and lower(u.email) = lower(btrim(coalesce(p_email, '')));
  if not found or v_g.encrypted_password is null or p_password is null
     or v_g.encrypted_password <> crypt(p_password, v_g.encrypted_password) then
    perform public._register_failure('guardian', v_s.family_id::text, 5, interval '5 minutes', interval '15 minutes');
    return query select 'invalid', null::text, null::timestamptz; return;
  end if;

  perform public._clear_failures('guardian', v_s.family_id::text);
  v_token := public._new_token();
  insert into public.guardian_mode_session (session_id, guardian_id, token_hash, expires_at)
    values (v_s.session_id, v_g.id, public._sha256(v_token), v_exp);
  insert into public.audit_log (family_id, actor, action, target)
    values (v_s.family_id, 'child:' || v_s.child_id::text, 'guardian_mode_entered', v_g.id::text);
  return query select 'ok', v_token, v_exp;
end
$$;

create or replace function public.verify_guardian_mode(p_token text)
returns table (guardian_id uuid, family_id uuid)
language sql security definer set search_path = public, extensions
as $$
  select m.guardian_id, g.family_id
    from public.guardian_mode_session m
    join public.guardian g on g.id = m.guardian_id
    join public.child_session s on s.id = m.session_id and s.expires_at > now()
    join public.device d on d.id = s.device_id and d.revoked_at is null
   where m.token_hash = public._sha256(coalesce(p_token, '')) and m.expires_at > now()
$$;

-- Sair do modo Responsável encerra a sessão dele.
create or replace function public.guardian_mode_exit(p_token text) returns void
language sql security definer set search_path = public, extensions
as $$ delete from public.guardian_mode_session where token_hash = public._sha256(coalesce(p_token, '')) $$;

revoke all on function public.redeem_pairing_code(text, text, text, text), public.child_login(text, text, text),
  public.verify_child_session(text), public.child_logout(text), public.guardian_mode_enter(text, text, text),
  public.verify_guardian_mode(text), public.guardian_mode_exit(text) from public;
