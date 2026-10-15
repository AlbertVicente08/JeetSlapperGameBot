// POST /api/session  { initData }  ->  { sessionId, seed }
// Cada partida de ranking empieza pidiendo una sesión: el servidor guarda la semilla para poder repetirla.
import { json, rpc, type Env, type PagesFunction } from '../../server/env'
import { verifyInitData } from '../../server/telegram'

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const { initData } = (await request.json().catch(() => ({}))) as { initData?: string }
  const user = await verifyInitData(initData ?? '', env.TELEGRAM_BOT_TOKEN)
  if (!user) return json({ error: 'No autorizado: abre el juego desde Telegram' }, 401)

  const seed = crypto.getRandomValues(new Uint32Array(1))[0]
  try {
    const sessionId = await rpc<string>(env, 'create_session', { p_telegram_id: user.id, p_seed: seed })
    return json({ sessionId, seed })
  } catch (e) {
    console.error(e)
    return json({ error: 'No se pudo crear la partida' }, 502)
  }
}
