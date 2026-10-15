-- Applied to Supabase project jeet-slapper (pascirdtgdemrnxjfcyw).
-- Referrals, weekly tournament + hall of fame, Phantom wallet linking and the Holder Boost.

-- ---------- players: new columns ----------
alter table public.players
  add column referral_count integer not null default 0,
  add column wallet text unique,
  add column holder_tier smallint not null default 0,       -- 0 none, 1 >=100k, 2 >=500k (last observed)
  add column holder_tier_since timestamptz,                  -- when the observed tier started
  add column holder_mult numeric(3,1) not null default 1,    -- effective multiplier (after 30 min maturation)
  add column holder_checked_at timestamptz;

-- Ranking score = best x community x holder x squad (+10% per active friend, max +50%)
drop index if exists public.players_ranked_score_idx;
alter table public.players drop column ranked_score;
alter table public.players
  add column ranked_score integer generated always as (
    round(best_score
          * case when community_member then 1.5 else 1 end
          * holder_mult
          * (1 + 0.1 * least(referral_count, 5)))::integer
  ) stored;
create index players_ranked_score_idx on public.players (ranked_score desc, updated_at asc);

-- ---------- games: whether the game counted for the ranking ----------
alter table public.games add column counted boolean not null default false;
create index games_week_idx on public.games (created_at) where counted;

-- ---------- referrals ----------
create table public.referrals (
  referred_id bigint primary key,
  referrer_id bigint not null,
  created_at timestamptz not null default now(),
  activated_at timestamptz,          -- first counted game of the referred player
  check (referred_id <> referrer_id)
);
alter table public.referrals enable row level security;

-- ---------- weekly tournament ----------
create table public.weekly_results (
  week_start date primary key,       -- Monday (UTC)
  results jsonb not null,
  posted_at timestamptz not null default now()
);
alter table public.weekly_results enable row level security;

-- ---------- wallet linking (one-time codes) ----------
create table public.wallet_links (
  code text primary key,
  telegram_id bigint not null,
  created_at timestamptz not null default now(),
  used_at timestamptz
);
alter table public.wallet_links enable row level security;

-- ================= functions =================

-- Monday 00:00 UTC of the week containing p_ts
create or replace function public.week_start(p_ts timestamptz default now())
returns date language sql immutable set search_path = '' as $$
  select (date_trunc('week', p_ts at time zone 'utc'))::date;
$$;

create or replace function public.add_referral(p_referred bigint, p_referrer bigint)
returns boolean language plpgsql set search_path = '' as $$
begin
  -- Only new players can be referred, and nobody can refer themselves
  if p_referred = p_referrer or exists (select 1 from public.players where telegram_id = p_referred) then
    return false;
  end if;
  insert into public.referrals (referred_id, referrer_id) values (p_referred, p_referrer)
  on conflict (referred_id) do nothing;
  return found;
end;
$$;

drop function if exists public.log_game(uuid, bigint, integer, text, text, boolean, jsonb);
create function public.log_game(
  p_session uuid, p_telegram_id bigint, p_score integer, p_status text, p_reason text,
  p_replayed boolean, p_stats jsonb, p_counted boolean
) returns void language sql set search_path = '' as $$
  insert into public.games (session_id, telegram_id, score, status, reason, replayed, stats, counted)
  values (p_session, p_telegram_id, p_score, p_status, p_reason, p_replayed, p_stats, p_counted);
$$;

drop function if exists public.submit_score(bigint, text, text, integer, boolean, boolean);
create function public.submit_score(
  p_telegram_id bigint, p_username text, p_first_name text, p_score integer, p_member boolean, p_verified boolean
) returns json language plpgsql set search_path = '' as $$
declare
  v public.players;
  v_rank bigint;
  v_referrer bigint;
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

  -- First counted game of a referred player: the friend who invited them gets +1 active referral
  update public.referrals set activated_at = now()
  where referred_id = p_telegram_id and activated_at is null
  returning referrer_id into v_referrer;
  if v_referrer is not null then
    update public.players set referral_count = referral_count + 1 where telegram_id = v_referrer;
  end if;

  select count(*) + 1 into v_rank from public.players where ranked_score > v.ranked_score;
  return json_build_object(
    'best', v.best_score, 'ranked', v.ranked_score, 'rank', v_rank,
    'improved', v.best_score = p_score, 'community', v.community_member, 'verified', v.best_verified
  );
end;
$$;

-- Weekly ranking: best counted raw score of the week (no boosts: pure skill)
create or replace function public.weekly_leaderboard(p_week date default null, p_telegram_id bigint default null, p_limit integer default 10)
returns json language sql stable set search_path = '' as $$
  with wk as (select coalesce(p_week, public.week_start()) as d),
  best as (
    select distinct on (g.telegram_id) g.telegram_id, g.score, g.created_at
    from public.games g, wk
    where g.counted and g.created_at >= wk.d and g.created_at < wk.d + 7
    order by g.telegram_id, g.score desc, g.created_at asc
  ),
  ranked as (
    select b.*, row_number() over (order by b.score desc, b.created_at asc) as pos
    from best b
  )
  select json_build_object(
    'week', (select d from wk),
    'top', coalesce((
      select json_agg(json_build_object(
        'id', r.telegram_id,
        'name', coalesce('@' || p.username, p.first_name, 'Anon'),
        'score', r.score) order by r.pos)
      from ranked r join public.players p using (telegram_id)
      where r.pos <= least(p_limit, 50)
    ), '[]'::json),
    'me', (select json_build_object('score', r.score, 'rank', r.pos) from ranked r where r.telegram_id = p_telegram_id),
    'players', (select count(*) from best)
  );
$$;

-- Score of position N in this week's ranking (0 if fewer players)
create or replace function public.weekly_at(p_rank integer)
returns integer language sql stable set search_path = '' as $$
  select coalesce((
    select score from (
      select distinct on (telegram_id) telegram_id, score, created_at
      from public.games
      where counted and created_at >= public.week_start()
      order by telegram_id, score desc, created_at asc
    ) b order by score desc, created_at asc offset greatest(p_rank - 1, 0) limit 1
  ), 0);
$$;

create or replace function public.save_weekly(p_week date, p_results jsonb)
returns boolean language plpgsql set search_path = '' as $$
begin
  insert into public.weekly_results (week_start, results) values (p_week, p_results)
  on conflict (week_start) do nothing;
  return found;
end;
$$;

-- All-time leaderboard (+ last week's medals for the hall of fame)
create or replace function public.leaderboard(p_telegram_id bigint default null, p_limit integer default 10)
returns json language sql stable set search_path = '' as $$
  with champs as (
    select (e->>'id')::bigint as id, ord as medal
    from public.weekly_results w,
         jsonb_array_elements(w.results->'top') with ordinality as t(e, ord)
    where w.week_start = (select max(week_start) from public.weekly_results) and ord <= 3
  )
  select json_build_object(
    'top', coalesce((
      select json_agg(t) from (
        select p.telegram_id as id,
               coalesce('@' || p.username, p.first_name, 'Anon') as name,
               p.ranked_score as score,
               p.community_member as community,
               p.best_verified as verified,
               p.holder_mult as holder,
               least(p.referral_count, 5) as squad,
               (select medal from champs c where c.id = p.telegram_id) as medal,
               p.member_checked_at as checked_at,
               p.holder_checked_at as holder_checked_at,
               p.wallet is not null as has_wallet
        from public.players p
        where p.best_score > 0
        order by p.ranked_score desc, p.updated_at asc
        limit least(p_limit, 50)
      ) t
    ), '[]'::json),
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
    'players', (select count(*) from public.players where best_score > 0)
  );
$$;

-- ---------- wallet ----------
create or replace function public.create_wallet_link(p_code text, p_telegram_id bigint)
returns void language sql set search_path = '' as $$
  insert into public.wallet_links (code, telegram_id) values (p_code, p_telegram_id);
$$;

-- Uses the code once and links the wallet. Returns 'ok', 'invalid_code' or 'wallet_taken'.
create or replace function public.link_wallet(p_code text, p_wallet text)
returns text language plpgsql set search_path = '' as $$
declare v_tg bigint;
begin
  update public.wallet_links set used_at = now()
  where code = p_code and used_at is null and created_at > now() - interval '15 minutes'
  returning telegram_id into v_tg;
  if v_tg is null then return 'invalid_code'; end if;

  if exists (select 1 from public.players where wallet = p_wallet and telegram_id <> v_tg) then
    return 'wallet_taken';
  end if;

  insert into public.players (telegram_id, wallet) values (v_tg, p_wallet)
  on conflict (telegram_id) do update set
    wallet = excluded.wallet, holder_tier = 0, holder_tier_since = null, holder_mult = 1, holder_checked_at = null;
  return 'ok';
end;
$$;

create or replace function public.set_holder(p_telegram_id bigint, p_tier smallint, p_since timestamptz, p_mult numeric)
returns void language sql set search_path = '' as $$
  update public.players
  set holder_tier = p_tier, holder_tier_since = p_since, holder_mult = p_mult, holder_checked_at = now()
  where telegram_id = p_telegram_id;
$$;

create or replace function public.get_holder(p_telegram_id bigint)
returns json language sql stable set search_path = '' as $$
  select json_build_object('wallet', wallet, 'tier', holder_tier, 'since', holder_tier_since, 'mult', holder_mult, 'checkedAt', holder_checked_at)
  from public.players where telegram_id = p_telegram_id;
$$;

-- ---------- permissions: only the server (service_role) ----------
do $$
declare f text;
begin
  foreach f in array array[
    'public.add_referral(bigint, bigint)',
    'public.log_game(uuid, bigint, integer, text, text, boolean, jsonb, boolean)',
    'public.submit_score(bigint, text, text, integer, boolean, boolean)',
    'public.weekly_leaderboard(date, bigint, integer)', 'public.weekly_at(integer)',
    'public.save_weekly(date, jsonb)', 'public.leaderboard(bigint, integer)',
    'public.create_wallet_link(text, bigint)', 'public.link_wallet(text, text)',
    'public.set_holder(bigint, smallint, timestamptz, numeric)', 'public.get_holder(bigint)'
  ] loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
