// POST /api/wallet/start  { initData }  ->  { code, url }
// Creates a one-time code (15 min) and the Phantom link that opens our /wallet/ page inside Phantom.
import { json, rpc, type Env, type PagesFunction } from '../../../server/env.ts'
import { verifyInitData } from '../../../server/telegram.ts'

const SITE = 'https://jeet-slapper.pages.dev'

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const { initData } = (await request.json().catch(() => ({}))) as { initData?: string }
  const user = await verifyInitData(initData ?? '', env.TELEGRAM_BOT_TOKEN)
  if (!user) return json({ error: 'Unauthorized: open the game from Telegram' }, 401)

  const code = [...crypto.getRandomValues(new Uint8Array(12))].map(b => b.toString(16).padStart(2, '0')).join('')
  try {
    await rpc(env, 'create_wallet_link', { p_code: code, p_telegram_id: user.id })
  } catch (e) {
    console.error(e)
    return json({ error: 'Could not create the link' }, 502)
  }
  const page = `${SITE}/wallet/?code=${code}`
  // Phantom universal link: opens the page in Phantom's in-app browser (mobile) or phantom.app (desktop)
  const url = `https://phantom.app/ul/browse/${encodeURIComponent(page)}?ref=${encodeURIComponent(SITE)}`
  return json({ code, url, page })
}
