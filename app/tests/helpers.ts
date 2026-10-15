// Shared helpers for the tests: a simulated player and signed Telegram initData.
import { createHmac } from 'node:crypto'
import { newGame, slap, tick, type Tap } from '../src/game/engine.ts'

export interface Strategy {
  reaction: () => number // ms the player needs to react to something
  skip?: number // chance of ignoring a good target
  mistake?: number // chance of hitting a bad target (holder / rug)
}

/** Plays a full game like a player with the given strategy. Returns the taps and the score. */
export function play(seed: number, { reaction, skip = 0, mistake = 0 }: Strategy, rand = Math.random) {
  let s = newGame(seed)
  const taps: Tap[] = []
  const plan = new Map<number, number | null>()
  const good = new Set(['jeet', 'golden', 'whale', 'pump', 'clock'])
  while (!s.over) {
    s.holes.forEach((m, hole) => {
      if (!m) return
      if (!plan.has(m.id)) {
        const willTap = good.has(m.kind) ? rand() >= skip : rand() < mistake
        plan.set(m.id, willTap ? m.born + reaction() : null)
      }
      const at = plan.get(m.id)
      if (at != null && s.elapsed >= at) {
        taps.push([s.elapsed, hole, 1])
        s = slap(s, hole)[0]
        if (s.holes[hole]?.id === m.id) plan.set(m.id, s.elapsed + reaction()) // whale: hit again
      }
    })
    s = tick(s)[0]
  }
  return { taps, score: s.score, state: s }
}

/** Normal-ish human reaction time (Box-Muller), never below 60 ms. */
export const human = (mu = 300, sd = 70) => () =>
  Math.max(60, Math.round(mu + sd * Math.sqrt(-2 * Math.log(Math.random() || 1e-9)) * Math.cos(2 * Math.PI * Math.random())))

/** Deterministic random generator for reproducible tests. */
export function seeded(seed: number) {
  let a = seed | 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Builds initData signed like Telegram does. */
export function signInitData(botToken: string, user: object, extra: Record<string, string> = {}, authDate = Math.floor(Date.now() / 1000)) {
  const p = new URLSearchParams({ auth_date: String(authDate), user: JSON.stringify(user), ...extra })
  const dcs = [...p.entries()].map(([k, v]) => `${k}=${v}`).sort().join('\n')
  const secret = createHmac('sha256', 'WebAppData').update(botToken).digest()
  p.set('hash', createHmac('sha256', secret).update(dcs).digest('hex'))
  return p.toString()
}
