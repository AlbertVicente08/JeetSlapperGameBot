// POST /api/session  { initData }  ->  { sessionId, seed }
// Every ranked game starts by asking for a session: the server stores the seed so it can replay the game.
// If the Mini App was opened from a referral link (startapp=ref_123), the referral is recorded here.
import { json, rpc, type Env, type PagesFunction } from '../../server/env.ts'
import { parseReferral, verifyInitData } from '../../server/telegram.ts'

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const { initData } = (await request.json().catch(() => ({}))) as { initData?: string }
  const user = await verifyInitData(initData ?? '', env.TELEGRAM_BOT_TOKEN)
  if (!user) return json({ error: 'Unauthorized: open the game from Telegram' }, 401)

  try {
    const referrer = parseReferral(user.startParam)
    if (referrer) await rpc(env, 'add_referral', { p_referred: user.id, p_referrer: referrer })

    const seed = crypto.getRandomValues(new Uint32Array(1))[0]
    const sessionId = await rpc<string>(env, 'create_session', { p_telegram_id: user.id, p_seed: seed })
    return json({ sessionId, seed })
  } catch (e) {
    console.error(e)
    return json({ error: 'Could not start the game' }, 502)
  }
}
