-- Applied to Supabase project jeet-slapper (pascirdtgdemrnxjfcyw).
-- Weekly tournament close + daily cleanup with pg_cron. The secret lives in Supabase Vault
-- (set it with: POST /rest/v1/rpc/set_cron_secret {"p_secret": "<CRON_SECRET from .env>"} using the service key).
create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function public.set_cron_secret(p_secret text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  select id into v_id from vault.secrets where name = 'jslap_cron_secret';
  if v_id is null then
    perform vault.create_secret(p_secret, 'jslap_cron_secret', 'Secret for /api/cron/weekly');
  else
    perform vault.update_secret(v_id, p_secret);
  end if;
end;
$$;
revoke execute on function public.set_cron_secret(text) from public, anon, authenticated;
grant execute on function public.set_cron_secret(text) to service_role;

-- Every Monday 00:05 UTC: close last week's tournament
select cron.schedule(
  'jslap-weekly-results',
  '5 0 * * 1',
  $$
  select net.http_post(
    url := 'https://jeet-slapper.pages.dev/api/cron/weekly',
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'jslap_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Every day 03:30 UTC: delete game sessions and wallet codes older than 2 days
select cron.schedule(
  'jslap-cleanup',
  '30 3 * * *',
  $$
  delete from public.game_sessions where started_at < now() - interval '2 days';
  delete from public.wallet_links where created_at < now() - interval '2 days';
  $$
);
