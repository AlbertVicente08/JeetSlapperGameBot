// POST /api/leaderboard  { initData? }  ->  { top: [{name, score}], me: {best, rank} | null, players }
// El top es público; "me" solo si llega un initData válido. Se usa POST para no poner initData en la URL.
import { json, rpc, type Env, type PagesFunction } from '../../server/env'
import { verifyInitData } from '../../server/telegram'

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let initData = ''
  try {
    initData = ((await request.json()) as { initData?: string }).initData ?? ''
  } catch {
    /* cuerpo vacío: solo el top */
  }
  const user = initData ? await verifyInitData(initData, env.TELEGRAM_BOT_TOKEN) : null

  try {
    return json(await rpc(env, 'leaderboard', { p_telegram_id: user?.id ?? null, p_limit: 10 }))
  } catch (e) {
    console.error(e)
    return json({ error: 'Error leyendo el ranking' }, 502)
  }
}
