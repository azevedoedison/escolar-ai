-- Tatá IA · B-03 · Convite de segundo responsável (openspec/changes/privacidade-e-retencao, tarefa 3.1).
--
-- O responsável dono da família convida outro adulto por e-mail. O convidado cria a própria conta,
-- aceita o convite e entra NA MESMA família como role 'member' (sem criar outra). O convite expira
-- em 7 dias, pode ser revogado e cada passo fica em audit_log. A família tem no máximo 2 responsáveis.
-- O token do convite só existe no e-mail: o banco guarda o hash. O envio é da API, pela fila email_outbox.

create table public.guardian_invite (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references public.family(id) on delete cascade,
  invited_by  uuid not null references auth.users(id) on delete cascade,
  email       text not null,
  token_hash  text not null unique,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id) on delete set null,
  revoked_at  timestamptz
);
create index guardian_invite_family_idx on public.guardian_invite(family_id, created_at desc);
create unique index guardian_invite_pending_email_idx
  on public.guardian_invite(family_id, lower(email)) where accepted_at is null and revoked_at is null;

-- Fila de envio de e-mail. Só a API (service role / dono do banco) lê e escreve.
create table public.email_outbox (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null,
  to_email   text not null,
  payload    jsonb not null,
  created_at timestamptz not null default now(),
  sent_at    timestamptz
);
create index email_outbox_pending_idx on public.email_outbox(created_at) where sent_at is null;

alter table public.guardian_invite enable row level security;
alter table public.email_outbox    enable row level security;
revoke all on public.guardian_invite, public.email_outbox from anon, authenticated;
-- Política que nega tudo: o responsável usa só as funções abaixo; a API usa o dono do banco.
create policy api_only on public.guardian_invite for all to authenticated using (false) with check (false);
create policy api_only on public.email_outbox    for all to authenticated using (false) with check (false);

create or replace function public._caller_owner_family()
returns uuid
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_family uuid;
begin
  select family_id into v_family from public.guardian where auth_user_id = auth.uid() and role = 'owner';
  if v_family is null then
    raise exception 'owner_required' using errcode = '42501';
  end if;
  return v_family;
end
$$;

-- Convida por e-mail. Devolve o id do convite; o token vai só para o e-mail (fila email_outbox).
create or replace function public.create_guardian_invite(p_email text)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_family  uuid := public._caller_owner_family();
  v_email   text := lower(btrim(coalesce(p_email, '')));
  v_token   text := encode(gen_random_bytes(24), 'hex');
  v_expires timestamptz := now() + interval '7 days';
  v_id      uuid;
  v_inviter text;
begin
  if length(v_email) > 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email' using errcode = '22023';
  end if;

  -- Serializa convites da mesma família (limite de 2 responsáveis).
  perform 1 from public.family where id = v_family for update;

  if exists (select 1 from public.guardian where family_id = v_family and lower(email) = v_email) then
    raise exception 'already_guardian' using errcode = '23505';
  end if;

  -- Convite vencido para este e-mail deixa de valer: é encerrado para liberar um novo convite.
  update public.guardian_invite set revoked_at = now()
   where family_id = v_family and lower(email) = v_email
     and accepted_at is null and revoked_at is null and expires_at <= now();

  if exists (select 1 from public.guardian_invite
              where family_id = v_family and lower(email) = v_email and accepted_at is null and revoked_at is null) then
    raise exception 'invite_pending' using errcode = '23505';
  end if;
  if (select count(*) from public.guardian where family_id = v_family)
     + (select count(*) from public.guardian_invite
         where family_id = v_family and accepted_at is null and revoked_at is null and expires_at > now()) >= 2 then
    raise exception 'family_full' using errcode = '23514';
  end if;

  insert into public.guardian_invite (family_id, invited_by, email, token_hash, expires_at)
    values (v_family, auth.uid(), v_email, encode(digest(v_token, 'sha256'), 'hex'), v_expires)
    returning id into v_id;

  select name into v_inviter from public.guardian where auth_user_id = auth.uid();
  insert into public.email_outbox (kind, to_email, payload)
    values ('guardian_invite', v_email,
            jsonb_build_object('token', v_token, 'inviter_name', v_inviter, 'expires_at', v_expires, 'invite_id', v_id));

  insert into public.audit_log (family_id, actor, action, target)
    values (v_family, auth.uid()::text, 'invite_created', v_id::text);
  return v_id;
end
$$;

-- Lista os convites da família (sem o token). Status: pending, accepted, revoked ou expired.
create or replace function public.list_guardian_invites()
returns table (id uuid, email text, status text, created_at timestamptz, expires_at timestamptz)
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_family uuid := public._caller_owner_family();
begin
  return query
    select i.id, i.email,
           case when i.accepted_at is not null then 'accepted'
                when i.revoked_at is not null then 'revoked'
                when i.expires_at <= now() then 'expired'
                else 'pending' end,
           i.created_at, i.expires_at
      from public.guardian_invite i
     where i.family_id = v_family
     order by i.created_at desc;
end
$$;

create or replace function public.revoke_guardian_invite(p_invite_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_family uuid := public._caller_owner_family();
begin
  update public.guardian_invite set revoked_at = now()
   where id = p_invite_id and family_id = v_family and accepted_at is null and revoked_at is null;
  if not found then
    raise exception 'invite_not_found' using errcode = '42501';
  end if;
  -- O token ainda não enviado não deve mais sair.
  delete from public.email_outbox
   where sent_at is null and kind = 'guardian_invite' and payload->>'invite_id' = p_invite_id::text;
  insert into public.audit_log (family_id, actor, action, target)
    values (v_family, auth.uid()::text, 'invite_revoked', p_invite_id::text);
end
$$;

-- O convidado (já logado, com o mesmo e-mail do convite) entra na família do convite como 'member'.
create or replace function public.accept_guardian_invite(p_token text, p_name text, p_consent boolean, p_consent_version text)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_email text;
  v_inv   public.guardian_invite;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_consent is not true then
    raise exception 'consent_required' using errcode = '22023';
  end if;
  if coalesce(btrim(p_name), '') = '' or coalesce(btrim(p_consent_version), '') = '' or coalesce(p_token, '') = '' then
    raise exception 'invalid_input' using errcode = '22023';
  end if;
  select lower(email) into v_email from auth.users where id = v_uid;
  if v_email is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into v_inv from public.guardian_invite
   where token_hash = encode(digest(p_token, 'sha256'), 'hex') for update;
  -- Token errado e e-mail diferente respondem igual: não revela de quem é o convite.
  if not found or lower(v_inv.email) <> v_email then
    raise exception 'invite_invalid' using errcode = '22023';
  end if;
  if v_inv.revoked_at is not null then
    raise exception 'invite_revoked' using errcode = '22023';
  end if;
  if v_inv.accepted_at is not null then
    raise exception 'invite_used' using errcode = '22023';
  end if;
  if v_inv.expires_at <= now() then
    raise exception 'invite_expired' using errcode = '22023';
  end if;
  if exists (select 1 from public.guardian where auth_user_id = v_uid) then
    raise exception 'already_registered' using errcode = '23505';
  end if;
  if (select count(*) from public.guardian where family_id = v_inv.family_id) >= 2 then
    raise exception 'family_full' using errcode = '23514';
  end if;

  insert into public.guardian (family_id, auth_user_id, name, email, role, consent_at, consent_version)
    values (v_inv.family_id, v_uid, btrim(p_name), v_email, 'member', now(), btrim(p_consent_version));
  update public.guardian_invite set accepted_at = now(), accepted_by = v_uid where id = v_inv.id;
  insert into public.audit_log (family_id, actor, action, target)
    values (v_inv.family_id, v_uid::text, 'consent_accepted', btrim(p_consent_version)),
           (v_inv.family_id, v_uid::text, 'invite_accepted', v_inv.id::text);
  return v_inv.family_id;
end
$$;

revoke all on function public._caller_owner_family() from public;
revoke all on function public.create_guardian_invite(text) from public;
revoke all on function public.list_guardian_invites() from public;
revoke all on function public.revoke_guardian_invite(uuid) from public;
revoke all on function public.accept_guardian_invite(text, text, boolean, text) from public;
grant execute on function public.create_guardian_invite(text) to authenticated;
grant execute on function public.list_guardian_invites() to authenticated;
grant execute on function public.revoke_guardian_invite(uuid) to authenticated;
grant execute on function public.accept_guardian_invite(text, text, boolean, text) to authenticated;
-- _caller_owner_family: só uso interno.
