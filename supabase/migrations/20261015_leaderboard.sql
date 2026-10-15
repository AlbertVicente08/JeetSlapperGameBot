-- Aplicada en el proyecto Supabase jeet-slapper (pascirdtgdemrnxjfcyw) el 2026-10-15.
-- Ranking de Jeet Slapper. Solo el servidor (service_role) lee y escribe.
create table public.players (
  telegram_id bigint primary key,
  username text,
  first_name text,
  best_score integer not null default 0 check (best_score >= 0),
  games integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index players_best_score_idx on public.players (best_score desc, updated_at asc);

alter table public.players enable row level security;
-- Sin políticas: anon/authenticated no pueden acceder. service_role ignora RLS.

-- Guarda una partida y devuelve el récord del jugador y su posición.
create or replace function public.submit_score(
  p_telegram_id bigint, p_username text, p_first_name text, p_score integer
) returns json
language plpgsql
set search_path = ''
as $$
declare
  v_best integer;
  v_rank bigint;
  v_improved boolean;
begin
  insert into public.players as p (telegram_id, username, first_name, best_score, games)
  values (p_telegram_id, p_username, p_first_name, p_score, 1)
  on conflict (telegram_id) do update set
    username = excluded.username,
    first_name = excluded.first_name,
    games = p.games + 1,
    best_score = greatest(p.best_score, excluded.best_score),
    updated_at = case when excluded.best_score > p.best_score then now() else p.updated_at end
  returning best_score, (best_score = p_score) into v_best, v_improved;

  select count(*) + 1 into v_rank from public.players where best_score > v_best;
  return json_build_object('best', v_best, 'rank', v_rank, 'improved', v_improved);
end;
$$;

-- Top N y la posición de un jugador.
create or replace function public.leaderboard(p_telegram_id bigint default null, p_limit integer default 10)
returns json
language sql
stable
set search_path = ''
as $$
  select json_build_object(
    'top', coalesce((
      select json_agg(t) from (
        select coalesce('@' || username, first_name, 'Anon') as name, best_score as score
        from public.players
        where best_score > 0
        order by best_score desc, updated_at asc
        limit least(p_limit, 50)
      ) t
    ), '[]'::json),
    'me', (
      select json_build_object(
        'best', me.best_score,
        'rank', (select count(*) + 1 from public.players o where o.best_score > me.best_score)
      )
      from public.players me where me.telegram_id = p_telegram_id
    ),
    'players', (select count(*) from public.players)
  );
$$;

revoke execute on function public.submit_score(bigint, text, text, integer) from public, anon, authenticated;
revoke execute on function public.leaderboard(bigint, integer) from public, anon, authenticated;
grant execute on function public.submit_score(bigint, text, text, integer) to service_role;
grant execute on function public.leaderboard(bigint, integer) to service_role;
