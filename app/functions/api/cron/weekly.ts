// POST /api/cron/weekly — closes last week's tournament (called every Monday 00:05 UTC by Supabase pg_cron).
import { json, type Env, type PagesFunction } from '../../../server/env.ts'
import { closeTournament } from '../../../server/tournament.ts'
import { lastWeekStart } from '../../../server/weekly.ts'

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.CRON_SECRET || request.headers.get('x-cron-secret') !== env.CRON_SECRET) return json({ error: 'forbidden' }, 403)
  return json(await closeTournament(env, 'weekly', lastWeekStart()))
}
