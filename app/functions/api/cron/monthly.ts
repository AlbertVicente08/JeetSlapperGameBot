// POST /api/cron/monthly — closes last month's tournament (called on the 1st at 00:10 UTC by Supabase pg_cron).
import { json, type Env, type PagesFunction } from '../../../server/env.ts'
import { closeTournament } from '../../../server/tournament.ts'
import { lastMonthStart } from '../../../server/weekly.ts'

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.CRON_SECRET || request.headers.get('x-cron-secret') !== env.CRON_SECRET) return json({ error: 'forbidden' }, 403)
  return json(await closeTournament(env, 'monthly', lastMonthStart()))
}
