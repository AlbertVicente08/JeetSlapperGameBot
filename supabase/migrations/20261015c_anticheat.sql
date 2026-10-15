-- Aplicada en el proyecto Supabase jeet-slapper (pascirdtgdemrnxjfcyw) el 2026-10-15.
-- Anti-trampas: sesiones de partida con semilla, registro de partidas y verificación del top 3.
create table public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint not null,
  seed bigint not null,
  started_at timestamptz not null default now(),
  used_at timestamptz
);
create index game_sessions_user_idx on public.game_sessions (telegram_id, started_at desc);
alter table public.game_sessions enable row level security;

-- Cada partida enviada, con el veredicto del detector (para poder revisar cómo juega la gente)
create table public.games (
  id bigint generated always as identity primary key,
  session_id uuid,
  telegram_id bigint not null,
  score integer not null,
  status text not null check (status in ('ok', 'suspicious', 'rejected')),
  reason text,
  replayed boolean not null default false,
  stats jsonb,
  created_at timestamptz not null default now()
);
create index games_user_idx on public.games (telegram_id, created_at desc);
create index games_status_idx on public.games (status, created_at desc);
alter table public.games enable row level security;

alter table public.players add column best_verified boolean not null default false;

-- Crea una sesión y devuelve su id
create function public.create_session(p_telegram_id bigint, p_seed bigint)
returns uuid
language sql
set search_path = ''
as $$
  insert into public.game_sessions (telegram_id, seed) values (p_telegram_id, p_seed) returning id;
$$;

-- Marca la sesión como usada (solo una vez y solo su dueño). Devuelve seed y ms transcurridos, o null.
create function public.claim_session(p_id uuid, p_telegram_id bigint)
returns json
language sql
set search_path = ''
as $$
  update public.game_sessions
  set used_at = now()
  where id = p_id and telegram_id = p_telegram_id and used_at is null
    and started_at > now() - interval '15 minutes'
  returning json_build_object('seed', seed, 'elapsed_ms', round(extract(epoch from (now() - started_at)) * 1000));
$$;

-- Puntuación de ranking del puesto N (0 si hay menos de N jugadores): para saber si alguien entra al top 3
create function public.ranked_at(p_rank integer)
returns integer
language sql
stable
set search_path = ''
as $$
  select coalesce((
    select ranked_score from public.players where best_score > 0
    order by ranked_score desc, updated_at asc offset greatest(p_rank - 1, 0) limit 1
  ), 0);
$$;

create function public.log_game(
  p_session uuid, p_telegram_id bigint, p_score integer, p_status text, p_reason text, p_replayed boolean, p_stats jsonb
) returns void
language sql
set search_path = ''
as $$
  insert into public.games (session_id, telegram_id, score, status, reason, replayed, stats)
  values (p_session, p_telegram_id, p_score, p_status, p_reason, p_replayed, p_stats);
$$;

-- submit_score ahora recibe si la partida fue verificada repitiéndola
drop function if exists public.submit_score(bigint, text, text, integer, boolean);
create function public.submit_score(
  p_telegram_id bigint, p_username text, p_first_name text, p_score integer, p_member boolean, p_verified boolean
) returns json
language plpgsql
set search_path = ''
as $$
declare
  v public.players;
  v_rank bigint;
begin
  insert into public.players as p (telegram_id, username, first_name, best_score, games, community_member, member_checked_at, best_verified)
  values (p_telegram_id, p_username, p_first_name, p_score, 1, coalesce(p_member, false),
          case when p_member is null then null else now() end, p_verified)
  on conflict (telegram_id) do update set
    username = excluded.username,
    first_name = excluded.first_name,
    games = p.games + 1,
    best_score = greatest(p.best_score, excluded.best_score),
    best_verified = case when excluded.best_score > p.best_score then excluded.best_verified else p.best_verified end,
    updated_at = case when excluded.best_score > p.best_score then now() else p.updated_at end,
    community_member = coalesce(p_member, p.community_member),
    member_checked_at = case when p_member is null then p.member_checked_at else now() end
  returning * into v;

  select count(*) + 1 into v_rank from public.players where ranked_score > v.ranked_score;
  return json_build_object(
    'best', v.best_score, 'ranked', v.ranked_score, 'rank', v_rank,
    'improved', v.best_score = p_score, 'community', v.community_member, 'verified', v.best_verified
  );
end;
$$;

-- El ranking incluye si el récord está verificado
create or replace function public.leaderboard(p_telegram_id bigint default null, p_limit integer default 10)
returns json
language sql
stable
set search_path = ''
as $$
  select json_build_object(
    'top', coalesce((
      select json_agg(t) from (
        select telegram_id as id,
               coalesce('@' || username, first_name, 'Anon') as name,
               ranked_score as score,
               community_member as community,
               best_verified as verified,
               member_checked_at as checked_at
        from public.players
        where best_score > 0
        order by ranked_score desc, updated_at asc
        limit least(p_limit, 50)
      ) t
    ), '[]'::json),
    'me', (
      select json_build_object(
        'best', me.best_score,
        'ranked', me.ranked_score,
        'community', me.community_member,
        'rank', (select count(*) + 1 from public.players o where o.ranked_score > me.ranked_score)
      )
      from public.players me where me.telegram_id = p_telegram_id
    ),
    'players', (select count(*) from public.players)
  );
$$;

do $$
declare f text;
begin
  foreach f in array array[
    'public.create_session(bigint, bigint)', 'public.claim_session(uuid, bigint)', 'public.ranked_at(integer)',
    'public.log_game(uuid, bigint, integer, text, text, boolean, jsonb)',
    'public.submit_score(bigint, text, text, integer, boolean, boolean)', 'public.leaderboard(bigint, integer)'
  ] loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
