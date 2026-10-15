// POST /api/score  { initData, sessionId, score, taps }
//   -> { counted, status, reason?, replayed, best?, ranked?, rank?, improved?, community?, verified? }
//
// 1. La sesión debe ser del jugador, no usada y con el tiempo real de una partida.
// 2. Detector de bots rápido sobre el registro de toques (todas las partidas).
// 3. Si la partida entraría en el top 3, el servidor la repite entera con la semilla y comprueba
//    que la puntuación cuadra y que las reacciones son humanas.
import { json, rpc, type Env, type PagesFunction } from '../../server/env'
import { isChannelMember, verifyInitData } from '../../server/telegram'
import { quickCheck, replayCheck, validateTaps, type Status, type Verdict } from '../../server/anticheat'

const MAX_SCORE = 20_000
const COMMUNITY_BOOST = 1.5
const VERIFY_TOP = 3

const severity: Record<Status, number> = { ok: 0, suspicious: 1, rejected: 2 }

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: { initData?: string; sessionId?: string; score?: number; taps?: unknown }
  try {
    body = await request.json()
  } catch {
    return json({ error: 'JSON inválido' }, 400)
  }

  const user = await verifyInitData(body.initData ?? '', env.TELEGRAM_BOT_TOKEN)
  if (!user) return json({ error: 'No autorizado: abre el juego desde Telegram' }, 401)

  const { score, sessionId, taps } = body
  if (typeof score !== 'number' || !Number.isInteger(score) || score < 0 || score > MAX_SCORE) {
    return json({ error: 'Puntuación inválida' }, 400)
  }
  if (typeof sessionId !== 'string' || !/^[0-9a-f-]{36}$/i.test(sessionId)) {
    return json({ error: 'Falta la sesión de la partida' }, 400)
  }
  if (!validateTaps(taps)) return json({ error: 'Registro de toques inválido' }, 400)

  try {
    const session = await rpc<{ seed: number; elapsed_ms: number } | null>(env, 'claim_session', {
      p_id: sessionId,
      p_telegram_id: user.id,
    })
    if (!session) return json({ error: 'Partida caducada o ya enviada' }, 409)

    let verdict: Verdict = quickCheck(taps, score, session.elapsed_ms)
    let replayed = false
    const member = await isChannelMember(env.TELEGRAM_BOT_TOKEN, user.id)

    if (verdict.status !== 'rejected' && score > 0) {
      const ranked = Math.round(score * (member ? COMMUNITY_BOOST : 1))
      const threshold = await rpc<number>(env, 'ranked_at', { p_rank: VERIFY_TOP })
      if (ranked >= threshold) {
        // Entraría en el top 3: se repite la partida entera
        const r = replayCheck(session.seed, taps, score)
        replayed = true
        verdict = {
          status: severity[r.status] > severity[verdict.status] ? r.status : verdict.status,
          reason: r.status !== 'ok' ? r.reason : verdict.reason,
          stats: { ...verdict.stats, ...r.stats },
        }
      }
    }

    // Lo sospechoso cuenta salvo que vaya al top 3; lo rechazado nunca cuenta
    const counted = verdict.status === 'ok' || (verdict.status === 'suspicious' && !replayed)
    await rpc(env, 'log_game', {
      p_session: sessionId,
      p_telegram_id: user.id,
      p_score: score,
      p_status: verdict.status,
      p_reason: verdict.reason ?? null,
      p_replayed: replayed,
      p_stats: verdict.stats,
    })

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
    return json({ error: 'Error guardando la puntuación' }, 502)
  }
}
