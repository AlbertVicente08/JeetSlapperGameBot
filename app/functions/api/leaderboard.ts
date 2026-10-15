// POST /api/leaderboard  { initData? }
//   -> { top: [{name, score, community}], me: {best, ranked, rank, community} | null, players }
// El top es público; "me" solo si llega un initData válido. Se usa POST para no poner initData en la URL.
// Aquí también se revisa si los jugadores siguen en el canal: si alguien se sale, pierde el Boost Comunidad.
import { json, rpc, type Env, type PagesFunction } from '../../server/env'
import { isChannelMember, verifyInitData } from '../../server/telegram'

interface Row {
  id: number
  name: string
  score: number
  community: boolean
  verified: boolean
  checked_at: string | null
}

interface Board {
  top: Row[]
  me: unknown
  players: number
}

const RECHECK_MS = 60 * 60 * 1000 // revisar la pertenencia del top como mucho cada hora

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let initData = ''
  try {
    initData = ((await request.json()) as { initData?: string }).initData ?? ''
  } catch {
    /* cuerpo vacío: solo el top */
  }
  const user = initData ? await verifyInitData(initData, env.TELEGRAM_BOT_TOKEN) : null
  const load = () => rpc<Board>(env, 'leaderboard', { p_telegram_id: user?.id ?? null, p_limit: 10 })

  try {
    let board = await load()

    // Quién hay que comprobar: el jugador que mira y los del top sin comprobar en la última hora
    const now = Date.now()
    const ids = new Set<number>()
    if (user) ids.add(user.id)
    for (const r of board.top) {
      if (!r.checked_at || now - Date.parse(r.checked_at) > RECHECK_MS) ids.add(r.id)
    }

    if (ids.size) {
      const checks = await Promise.all([...ids].map(async id => [id, await isChannelMember(env.TELEGRAM_BOT_TOKEN, id)] as const))
      const known = checks.filter((c): c is readonly [number, boolean] => c[1] !== null)
      if (known.length) {
        await rpc(env, 'set_membership', { p_ids: known.map(c => c[0]), p_members: known.map(c => c[1]) })
        board = await load()
      }
    }

    // No exponemos ids de Telegram ni fechas internas
    return json({
      ...board,
      top: board.top.map(({ name, score, community, verified }) => ({ name, score, community, verified })),
    })
  } catch (e) {
    console.error(e)
    return json({ error: 'Error leyendo el ranking' }, 502)
  }
}
