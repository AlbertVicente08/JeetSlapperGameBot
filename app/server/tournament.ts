// Closing a tournament (weekly or monthly): save the results once, post them in the channel and
// send the winners (with their wallets and token prizes) to the admin.
import { rpc, type Env } from './env.ts'
import { COMMUNITY_CHANNEL, escapeHtml, tg } from './telegram.ts'
import { fmtTokens, MONTHLY_PRIZES, WEEKLY_PRIZES } from '../src/prizes.ts'

interface Results {
  top: { id: number; name: string; score: number; raw: number; wallet: string | null }[]
  players: number
}

const MEDALS = ['🥇', '🥈', '🥉']

export async function closeTournament(env: Env, kind: 'weekly' | 'monthly', period: string) {
  const isWeek = kind === 'weekly'
  const results = await rpc<Results>(env, isWeek ? 'weekly_leaderboard' : 'monthly_leaderboard', {
    [isWeek ? 'p_week' : 'p_month']: period,
    p_telegram_id: null,
    p_limit: 10,
  })
  const isNew = await rpc<boolean>(env, isWeek ? 'save_weekly' : 'save_monthly', {
    [isWeek ? 'p_week' : 'p_month']: period,
    p_results: results,
  })
  if (!isNew) return { ok: true, period, skipped: 'already posted' }
  if (!results.top.length) return { ok: true, period, skipped: 'no players' }

  const prizes = isWeek ? WEEKLY_PRIZES : MONTHLY_PRIZES
  const title = isWeek ? `Weekly tournament — week of ${period}` : `Monthly tournament — ${period.slice(0, 7)}`
  const lines = (isWeek ? results.top : results.top.slice(0, 5)).map(
    (r, i) => `${MEDALS[i] ?? `${i + 1}.`} ${escapeHtml(r.name)} — <b>${r.score}</b>`,
  )

  await tg(env.TELEGRAM_BOT_TOKEN, 'sendMessage', {
    chat_id: COMMUNITY_CHANNEL,
    parse_mode: 'HTML',
    text: [
      `🏆 <b>Jeet Slapper — ${title}</b>`,
      `${results.players} players`,
      '',
      ...lines,
      '',
      '<b>Prizes</b>',
      ...prizes.map(p => `${p.medal} ${fmtTokens(p.tokens)}`),
      '',
      isWeek ? 'A new week has started. Boosts count: join the channel, invite friends, hold $JSLAP. 👋💥' : 'A new month has started. 👋💥',
    ].join('\n'),
    reply_markup: { inline_keyboard: [[{ text: '🎮 Play now', url: 'https://t.me/JeetSlapperGameBot?start=tournament' }]] },
  })

  if (env.ADMIN_TELEGRAM_ID) {
    const winners = prizes.map((p, i) => {
      const w = results.top[i]
      if (!w) return `${p.medal} —`
      return `${p.medal} ${escapeHtml(w.name)} (id <code>${w.id}</code>) — ${w.score} pts (raw ${w.raw})\n   → ${fmtTokens(p.tokens)} to <code>${w.wallet ?? 'NO WALLET'}</code>`
    })
    await tg(env.TELEGRAM_BOT_TOKEN, 'sendMessage', {
      chat_id: env.ADMIN_TELEGRAM_ID,
      parse_mode: 'HTML',
      text: [
        `🏆 <b>${title} closed</b>. Prizes to send:`,
        ...winners,
        '',
        'Before sending, check their games in the <code>games</code> table (status, reason, stats). Send from the prize wallet and post the transaction link in the channel.',
      ].join('\n'),
    })
  }
  return { ok: true, period, posted: results.top.length }
}
