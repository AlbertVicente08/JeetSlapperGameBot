// POST /api/score  { initData, score }  ->  { best, ranked, rank, improved, community }
import { json, rpc, type Env, type PagesFunction } from '../../server/env'
import { isChannelMember, verifyInitData } from '../../server/telegram'

// Tope de cordura (puntos sin boosts): con PUMP + FINAL PUMP + combo x3 un jeet vale hasta 120.
const MAX_SCORE = 20_000

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: { initData?: string; score?: number }
  try {
    body = await request.json()
  } catch {
    return json({ error: 'JSON inválido' }, 400)
  }

  const user = await verifyInitData(body.initData ?? '', env.TELEGRAM_BOT_TOKEN)
  if (!user) return json({ error: 'No autorizado: abre el juego desde Telegram' }, 401)

  const score = body.score
  if (typeof score !== 'number' || !Number.isInteger(score) || score < 0 || score > MAX_SCORE) {
    return json({ error: 'Puntuación inválida' }, 400)
  }

  try {
    const member = await isChannelMember(env.TELEGRAM_BOT_TOKEN, user.id)
    const result = await rpc(env, 'submit_score', {
      p_telegram_id: user.id,
      p_username: user.username ?? null,
      p_first_name: user.first_name ?? null,
      p_score: score,
      p_member: member,
    })
    return json(result)
  } catch (e) {
    console.error(e)
    return json({ error: 'Error guardando la puntuación' }, 502)
  }
}
