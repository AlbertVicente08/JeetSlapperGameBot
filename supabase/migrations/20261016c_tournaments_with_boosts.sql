-- Applied to Supabase project jeet-slapper (pascirdtgdemrnxjfcyw).
-- Weekly and monthly tournaments now count boosts (community, squad, holder),
-- monthly results table, and the Holders League in the leaderboard.

create table if not exists public.monthly_results (
  month_start date primary key,
  results jsonb not null,
  posted_at timestamptz not null default now()
);
alter table public.monthly_results enable row level security;

-- Current boost multiplier of a player (same formula as players.ranked_score)
create or replace function public.boost_mult(p public.players)
returns numeric language sql immutable set search_path = '' as $$
  select (case when p.community_member then 1.5 else 1 end) * p.holder_mult * (1 + 0.1 * least(p.referral_count, 5));
$$;

-- Tournament ranking between two dates: best counted raw game of each player x their current boosts
create or replace function public.tournament_leaderboard(
  p_from timestamptz, p_to timestamptz, p_telegram_id bigint default null, p_limit integer default 10
) returns json language sql stable set search_path = '' as $$
  with best as (
    select distinct on (g.telegram_id) g.telegram_id, g.score as raw, g.created_at
    from public.games g
    where g.counted and g.created_at >= p_from and g.created_at < p_to
    order by g.telegram_id, g.score desc, g.created_at asc
  ),
  ranked as (
    select b.telegram_id, b.raw, b.created_at,
           round(b.raw * public.boost_mult(p))::integer as score,
           p.holder_mult as holder, p.community_member as community, p.wallet,
           coalesce('@' || p.username, p.first_name, 'Anon') as name
    from best b join public.players p using (telegram_id)
  ),
  ordered as (
    select r.*, row_number() over (order by r.score desc, r.created_at asc) as pos from ranked r
  )
  select json_build_object(
    'top', coalesce((
      select json_agg(json_build_object(
        'id', o.telegram_id, 'name', o.name, 'score', o.score, 'raw', o.raw,
        'holder', o.holder, 'community', o.community, 'wallet', o.wallet) order by o.pos)
      from ordered o where o.pos <= least(p_limit, 50)
    ), '[]'::json),
    'me', (select json_build_object('score', o.score, 'raw', o.raw, 'rank', o.pos) from ordered o where o.telegram_id = p_telegram_id),
    'players', (select count(*) from best)
  );
$$;

create or replace function public.weekly_leaderboard(p_week date default null, p_telegram_id bigint default null, p_limit integer default 10)
returns json language sql stable set search_path = '' as $$
  select (public.tournament_leaderboard(w, w + 7, p_telegram_id, p_limit)::jsonb || jsonb_build_object('week', w))::json
  from (select coalesce(p_week, public.week_start()) as w) x;
$$;

create or replace function public.month_start(p_ts timestamptz default now())
returns date language sql immutable set search_path = '' as $$
  select (date_trunc('month', p_ts at time zone 'utc'))::date;
$$;

create or replace function public.monthly_leaderboard(p_month date default null, p_telegram_id bigint default null, p_limit integer default 10)
returns json language sql stable set search_path = '' as $$
  select (public.tournament_leaderboard(m, (m + interval '1 month')::date, p_telegram_id, p_limit)::jsonb || jsonb_build_object('month', m))::json
  from (select coalesce(p_month, public.month_start()) as m) x;
$$;

-- Boosted score at position N of the current week / month (0 if fewer players): replay threshold
create or replace function public.weekly_at(p_rank integer)
returns integer language sql stable set search_path = '' as $$
  select coalesce((
    select (t->>'score')::integer
    from json_array_elements(public.weekly_leaderboard(null, null, p_rank)->'top') with ordinality as a(t, n)
    where n = p_rank
  ), 0);
$$;

create or replace function public.monthly_at(p_rank integer)
returns integer language sql stable set search_path = '' as $$
  select coalesce((
    select (t->>'score')::integer
    from json_array_elements(public.monthly_leaderboard(null, null, p_rank)->'top') with ordinality as a(t, n)
    where n = p_rank
  ), 0);
$$;

create or replace function public.save_monthly(p_month date, p_results jsonb)
returns boolean language plpgsql set search_path = '' as $$
begin
  insert into public.monthly_results (month_start, results) values (p_month, p_results)
  on conflict (month_start) do nothing;
  return found;
end;
$$;

-- All-time leaderboard + Holders League (players holding $JSLAP) + last week's medals
create or replace function public.leaderboard(p_telegram_id bigint default null, p_limit integer default 10)
returns json language sql stable set search_path = '' as $$
  with champs as (
    select (e->>'id')::bigint as id, ord as medal
    from public.weekly_results w,
         jsonb_array_elements(w.results->'top') with ordinality as t(e, ord)
    where w.week_start = (select max(week_start) from public.weekly_results) and ord <= 3
  ),
  rows as (
    select p.telegram_id as id,
           coalesce('@' || p.username, p.first_name, 'Anon') as name,
           p.ranked_score as score,
           p.community_member as community,
           p.best_verified as verified,
           p.holder_mult as holder,
           p.holder_tier as holder_tier,
           least(p.referral_count, 5) as squad,
           (select medal from champs c where c.id = p.telegram_id) as medal,
           p.member_checked_at as checked_at,
           p.holder_checked_at as holder_checked_at,
           p.wallet is not null as has_wallet,
           p.updated_at
    from public.players p
    where p.best_score > 0
  )
  select json_build_object(
    'top', coalesce((select json_agg(t) from (select * from rows order by score desc, updated_at asc limit least(p_limit, 50)) t), '[]'::json),
    'holders', coalesce((select json_agg(t) from (select * from rows where holder_tier > 0 order by score desc, updated_at asc limit least(p_limit, 50)) t), '[]'::json),
    'me', (
      select json_build_object(
        'best', me.best_score,
        'ranked', me.ranked_score,
        'community', me.community_member,
        'referrals', me.referral_count,
        'wallet', me.wallet,
        'holderTier', me.holder_tier,
        'holderMult', me.holder_mult,
        'holderSince', me.holder_tier_since,
        'rank', (select count(*) + 1 from public.players o where o.ranked_score > me.ranked_score)
      )
      from public.players me where me.telegram_id = p_telegram_id
    ),
    'players', (select count(*) from rows)
  );
$$;

do $$
declare f text;
begin
  foreach f in array array[
    'public.boost_mult(public.players)',
    'public.tournament_leaderboard(timestamptz, timestamptz, bigint, integer)',
    'public.weekly_leaderboard(date, bigint, integer)', 'public.monthly_leaderboard(date, bigint, integer)',
    'public.weekly_at(integer)', 'public.monthly_at(integer)', 'public.save_monthly(date, jsonb)',
    'public.leaderboard(bigint, integer)'
  ] loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;

-- 1st of every month 00:10 UTC: close last month's tournament
select cron.schedule(
  'jslap-monthly-results',
  '10 0 1 * *',
  $$
  select net.http_post(
    url := 'https://jeet-slapper.pages.dev/api/cron/monthly',
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'jslap_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
