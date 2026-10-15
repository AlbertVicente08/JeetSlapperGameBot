// POST /api/score  { initData, sessionId, score, taps }
//   -> { counted, status, reason?, replayed, best?, ranked?, rank?, improved?, community?, verified? }
//
// 1. The session must belong to the player, be unused and match a real game duration.
// 2. Quick bot detector on the tap log (every game).
// 3. If the game would enter the all-time top 3 or this week's top 3, the server replays it from the seed
//    and checks that the score adds up and the reactions are human.
// 4. If a replayed game is rejected or flagged, the admin gets a Telegram alert.
import { json, rpc, type Env, type PagesFunction } from '../../server/env.ts'
import { isChannelMember, tg, verifyInitData, escapeHtml } from '../../server/telegram.ts'
import { quickCheck, replayCheck, validateTaps, type Status, type Verdict } from '../../server/anticheat.ts'
import { refreshHolder } from '../../server/holder.ts'

const MAX_SCORE = 20_000
const COMMUNITY_BOOST = 1.5
const VERIFY_TOP = 3

const severity: Record<Status, number> = { ok: 0, suspicious: 1, rejected: 2 }

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: { initData?: string; sessionId?: string; score?: number; taps?: unknown }
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const user = await verifyInitData(body.initData ?? '', env.TELEGRAM_BOT_TOKEN)
  if (!user) return json({ error: 'Unauthorized: open the game from Telegram' }, 401)

  const { score, sessionId, taps } = body
  if (typeof score !== 'number' || !Number.isInteger(score) || score < 0 || score > MAX_SCORE) {
    return json({ error: 'Invalid score' }, 400)
  }
  if (typeof sessionId !== 'string' || !/^[0-9a-f-]{36}$/i.test(sessionId)) {
    return json({ error: 'Missing game session' }, 400)
  }
  if (!validateTaps(taps)) return json({ error: 'Invalid tap log' }, 400)

  try {
    const session = await rpc<{ seed: number; elapsed_ms: number } | null>(env, 'claim_session', {
      p_id: sessionId,
      p_telegram_id: user.id,
    })
    if (!session) return json({ error: 'Game expired or already submitted' }, 409)

    let verdict: Verdict = quickCheck(taps, score, session.elapsed_ms)
    let replayed = false
    const [member] = await Promise.all([isChannelMember(env.TELEGRAM_BOT_TOKEN, user.id), refreshHolder(env, user.id)])

    if (verdict.status !== 'rejected' && score > 0) {
      const ranked = Math.round(score * (member ? COMMUNITY_BOOST : 1)) // lower bound: holder/squad boosts only add
      const [allTime, weekly] = await Promise.all([
        rpc<number>(env, 'ranked_at', { p_rank: VERIFY_TOP }),
        rpc<number>(env, 'weekly_at', { p_rank: VERIFY_TOP }),
      ])
      if (ranked >= allTime || score >= weekly) {
        // Would enter a top 3: replay the whole game
        const r = replayCheck(session.seed, taps, score)
        replayed = true
        verdict = {
          status: severity[r.status] > severity[verdict.status] ? r.status : verdict.status,
          reason: r.status !== 'ok' ? r.reason : verdict.reason,
          stats: { ...verdict.stats, ...r.stats },
        }
      }
    }

    // Suspicious games count unless they're going to a top 3; rejected games never count
    const counted = verdict.status === 'ok' || (verdict.status === 'suspicious' && !replayed)
    await rpc(env, 'log_game', {
      p_session: sessionId,
      p_telegram_id: user.id,
      p_score: score,
      p_status: verdict.status,
      p_reason: verdict.reason ?? null,
      p_replayed: replayed,
      p_stats: verdict.stats,
      p_counted: counted,
    })

    if (replayed && verdict.status !== 'ok' && env.ADMIN_TELEGRAM_ID) {
      const name = user.username ? `@${user.username}` : (user.first_name ?? 'Anon')
      await tg(env.TELEGRAM_BOT_TOKEN, 'sendMessage', {
        chat_id: env.ADMIN_TELEGRAM_ID,
        parse_mode: 'HTML',
        text: [
          `🚨 <b>Top-3 game ${verdict.status}</b>`,
          `Player: ${escapeHtml(name)} (id <code>${user.id}</code>)`,
          `Score: <b>${score}</b>`,
          `Reason: ${escapeHtml(verdict.reason ?? '-')}`,
          `Stats: <code>${escapeHtml(JSON.stringify(verdict.stats))}</code>`,
        ].join('\n'),
      })
    }

    if (!counted) {
      return json({ counted: false, status: verdict.status, reason: verdict.reason, replayed })
    }

    const result = await rpc<Record<string, unknown>>(env, 'submit_score', {
      p_telegram_id: user.id,
      p_username: user.username ?? null,
      p_first_name: user.first_name ?? null,
      p_score: score,
      p_member: member,
      p_verified: replayed && verdict.status === 'ok',
    })
    return json({ ...result, counted: true, status: verdict.status, reason: verdict.reason, replayed })
  } catch (e) {
    console.error(e)
    return json({ error: 'Error saving the score' }, 502)
  }
}
