-- Imita só o que o Supabase fornece e as migrações usam (schema auth, auth.uid(), papéis).
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
end $$;

create schema if not exists auth;
create table if not exists auth.users (id uuid primary key default gen_random_uuid(), email text, encrypted_password text);
create or replace function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth, public to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
-- Sessões do Supabase Auth (a recuperação de senha as encerra).
create table if not exists auth.sessions (id uuid primary key default gen_random_uuid(), user_id uuid not null);
