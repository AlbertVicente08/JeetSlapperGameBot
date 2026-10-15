// POST /api/leaderboard  { initData? }
//   -> { top, me, players, weekly: { week, top, me, players } }
// The tops are public; "me" only with a valid initData (POST so initData never goes in the URL).
// It also re-checks the boosts of the viewer and of the top 10 (channel membership hourly,
// token holdings every 10 minutes once the token is live).
import { json, rpc, tokenLive, type Env, type PagesFunction } from '../../server/env.ts'
import { isChannelMember, verifyInitData } from '../../server/telegram.ts'
import { refreshHolder } from '../../server/holder.ts'

interface Row {
  id: number
  name: string
  score: number
  community: boolean
  verified: boolean
  holder: number
  squad: number
  medal: number | null
  checked_at: string | null
  holder_checked_at: string | null
  has_wallet: boolean
}

interface Board {
  top: Row[]
  me: unknown
  players: number
}

interface Weekly {
  week: string
  top: { id: number; name: string; score: number }[]
  me: unknown
  players: number
}

const MEMBER_RECHECK_MS = 60 * 60 * 1000
const HOLDER_RECHECK_MS = 10 * 60 * 1000

const stale = (at: string | null, ms: number) => !at || Date.now() - Date.parse(at) > ms

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let initData = ''
  try {
    initData = ((await request.json()) as { initData?: string }).initData ?? ''
  } catch {
    /* empty body: public tops only */
  }
  const user = initData ? await verifyInitData(initData, env.TELEGRAM_BOT_TOKEN) : null
  const load = () => rpc<Board>(env, 'leaderboard', { p_telegram_id: user?.id ?? null, p_limit: 10 })

  try {
    let board = await load()

    // Channel membership: the viewer always, the top 10 at most once an hour
    const memberIds = new Set<number>()
    if (user) memberIds.add(user.id)
    for (const r of board.top) if (stale(r.checked_at, MEMBER_RECHECK_MS)) memberIds.add(r.id)
    const checks = await Promise.all(
      [...memberIds].map(async id => [id, await isChannelMember(env.TELEGRAM_BOT_TOKEN, id)] as const),
    )
    const known = checks.filter((c): c is readonly [number, boolean] => c[1] !== null)
    let changed = false
    if (known.length) {
      await rpc(env, 'set_membership', { p_ids: known.map(c => c[0]), p_members: known.map(c => c[1]) })
      changed = true
    }

    // Holder Boost: only once the token exists
    if (tokenLive(env)) {
      const holderIds = new Set<number>()
      if (user) holderIds.add(user.id)
      for (const r of board.top) if (r.has_wallet && stale(r.holder_checked_at, HOLDER_RECHECK_MS)) holderIds.add(r.id)
      const refreshed = await Promise.all([...holderIds].map(id => refreshHolder(env, id)))
      if (refreshed.some(Boolean)) changed = true
    }

    if (changed) board = await load()
    const weekly = await rpc<Weekly>(env, 'weekly_leaderboard', { p_week: null, p_telegram_id: user?.id ?? null, p_limit: 10 })

    // Never expose Telegram ids or internal timestamps
    return json({
      ...board,
      top: board.top.map(({ name, score, community, verified, holder, squad, medal }) => ({
        name,
        score,
        community,
        verified,
        holder: Number(holder),
        squad,
        medal,
      })),
      weekly: { ...weekly, top: weekly.top.map(({ name, score }) => ({ name, score })) },
    })
  } catch (e) {
    console.error(e)
    return json({ error: 'Error reading the leaderboard' }, 502)
  }
}
