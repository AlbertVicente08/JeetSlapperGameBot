-- Applied to Supabase project jeet-slapper (pascirdtgdemrnxjfcyw) on 2026-10-15.
-- Community Boost: x1.5 on the leaderboard if the player is in the Telegram channel.
alter table public.players
  add column community_member boolean not null default false,
  add column member_checked_at timestamptz;

-- Ranking score = record x boost (rounded)
alter table public.players
  add column ranked_score integer generated always as
    (round(best_score * case when community_member then 1.5 else 1 end)::integer) stored;

drop index if exists public.players_best_score_idx;
create index players_ranked_score_idx on public.players (ranked_score desc, updated_at asc);

drop function if exists public.submit_score(bigint, text, text, integer);

create function public.submit_score(
  p_telegram_id bigint, p_username text, p_first_name text, p_score integer, p_member boolean
) returns json
language plpgsql
set search_path = ''
as $$
declare
  v public.players;
  v_rank bigint;
begin
  insert into public.players as p (telegram_id, username, first_name, best_score, games, community_member, member_checked_at)
  values (p_telegram_id, p_username, p_first_name, p_score, 1, coalesce(p_member, false), case when p_member is null then null else now() end)
  on conflict (telegram_id) do update set
    username = excluded.username,
    first_name = excluded.first_name,
    games = p.games + 1,
    best_score = greatest(p.best_score, excluded.best_score),
    updated_at = case when excluded.best_score > p.best_score then now() else p.updated_at end,
    -- If the Telegram check failed (null), keep the previous state
    community_member = coalesce(p_member, p.community_member),
    member_checked_at = case when p_member is null then p.member_checked_at else now() end
  returning * into v;

  select count(*) + 1 into v_rank from public.players where ranked_score > v.ranked_score;
  return json_build_object(
    'best', v.best_score, 'ranked', v.ranked_score, 'rank', v_rank,
    'improved', v.best_score = p_score, 'community', v.community_member
  );
end;
$$;

-- Updates the channel membership of several players (checked by the server with the Telegram API)
create function public.set_membership(p_ids bigint[], p_members boolean[])
returns void
language sql
set search_path = ''
as $$
  update public.players p
  set community_member = m.member, member_checked_at = now()
  from unnest(p_ids, p_members) as m(id, member)
  where p.telegram_id = m.id;
$$;

drop function if exists public.leaderboard(bigint, integer);

-- Top N (with id and check date so the server can re-check membership) and the player's position.
create function public.leaderboard(p_telegram_id bigint default null, p_limit integer default 10)
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

revoke execute on function public.submit_score(bigint, text, text, integer, boolean) from public, anon, authenticated;
revoke execute on function public.set_membership(bigint[], boolean[]) from public, anon, authenticated;
revoke execute on function public.leaderboard(bigint, integer) from public, anon, authenticated;
grant execute on function public.submit_score(bigint, text, text, integer, boolean) to service_role;
grant execute on function public.set_membership(bigint[], boolean[]) to service_role;
grant execute on function public.leaderboard(bigint, integer) to service_role;
