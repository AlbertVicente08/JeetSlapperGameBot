// POST /api/cron/weekly — closes last week's tournament (called every Monday by Supabase pg_cron).
// Saves the results (once per week), posts the top 10 in the channel and sends the winners to the admin.
import { json, rpc, type Env, type PagesFunction } from '../../../server/env.ts'
import { COMMUNITY_CHANNEL, escapeHtml, tg } from '../../../server/telegram.ts'
import { WEEKLY_PRIZES } from '../../../src/prizes.ts'
import { lastWeekStart } from '../../../server/weekly.ts'

interface Weekly {
  week: string
  top: { id: number; name: string; score: number }[]
  players: number
}

const MEDALS = ['🥇', '🥈', '🥉']

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.CRON_SECRET || request.headers.get('x-cron-secret') !== env.CRON_SECRET) return json({ error: 'forbidden' }, 403)

  const week = lastWeekStart()
  const results = await rpc<Weekly>(env, 'weekly_leaderboard', { p_week: week, p_telegram_id: null, p_limit: 10 })
  const isNew = await rpc<boolean>(env, 'save_weekly', { p_week: week, p_results: results })
  if (!isNew) return json({ ok: true, week, skipped: 'already posted' })
  if (!results.top.length) return json({ ok: true, week, skipped: 'no players' })

  const lines = results.top.map((r, i) => `${MEDALS[i] ?? `${i + 1}.`} ${escapeHtml(r.name)} — <b>${r.score}</b>`)
  const prizeLines = WEEKLY_PRIZES.map(p => `${p.medal} ${escapeHtml(p.prize)}`)
  await tg(env.TELEGRAM_BOT_TOKEN, 'sendMessage', {
    chat_id: COMMUNITY_CHANNEL,
    parse_mode: 'HTML',
    text: [
      `🏆 <b>Jeet Slapper — weekly tournament results</b>`,
      `Week of ${week} · ${results.players} players`,
      '',
      ...lines,
      '',
      '<b>Prizes</b>',
      ...prizeLines,
      '',
      'A new week has started. Every game counts, no boosts: pure skill. 👋💥',
    ].join('\n'),
    reply_markup: { inline_keyboard: [[{ text: '🎮 Play now', url: 'https://t.me/JeetSlapperGameBot?start=weekly' }]] },
  })

  if (env.ADMIN_TELEGRAM_ID) {
    const winners = results.top
      .slice(0, 3)
      .map((r, i) => `${MEDALS[i]} ${escapeHtml(r.name)} (id <code>${r.id}</code>) — ${r.score} → ${escapeHtml(WEEKLY_PRIZES[i]?.prize ?? '')}`)
    await tg(env.TELEGRAM_BOT_TOKEN, 'sendMessage', {
      chat_id: env.ADMIN_TELEGRAM_ID,
      parse_mode: 'HTML',
      text: [
        `🏆 <b>Week ${week} closed</b>. Winners to reward:`,
        ...winners,
        '',
        'Before sending any prize, check their games in the <code>games</code> table (status, reason, stats).',
      ].join('\n'),
    })
  }

  return json({ ok: true, week, posted: results.top.length })
}
