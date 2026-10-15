// Lógica pura del juego (sin React ni DOM) para poder testearla aparte.

export type Kind = 'jeet' | 'holder' | 'whale'

export interface Mole {
  id: number
  kind: Kind
  hp: number // golpes que faltan (la ballena necesita 3)
  until: number // ms (tiempo de juego) en que se escapa
}

export interface GameState {
  elapsed: number // ms desde el inicio de la ronda
  holes: (Mole | null)[]
  score: number
  streak: number // aciertos seguidos
  slaps: number
  escaped: number
  nextSpawn: number
  nextId: number
  over: boolean
}

export type Event =
  | { type: 'hit'; kind: Kind; points: number; hole: number; killed: boolean }
  | { type: 'escape'; hole: number }
  | { type: 'miss' }

export const ROUND_MS = 30_000
export const HOLES = 9

export function newGame(): GameState {
  return {
    elapsed: 0,
    holes: Array(HOLES).fill(null),
    score: 0,
    streak: 0,
    slaps: 0,
    escaped: 0,
    nextSpawn: 400,
    nextId: 1,
    over: false,
  }
}

/** 1x, 1.5x, 2x... hasta 3x cada 5 aciertos seguidos. */
export function comboMultiplier(streak: number): number {
  return Math.min(3, 1 + Math.floor(streak / 5) * 0.5)
}

/** Nivel según el tiempo: 0 Baby Jeets, 1 Sniper Bots, 2 Whale Season. */
export function tier(elapsed: number): 0 | 1 | 2 {
  if (elapsed < 10_000) return 0
  if (elapsed < 20_000) return 1
  return 2
}

export const TIER_NAMES = ['Baby Jeets', 'Sniper Bots', 'Whale Season'] as const

function difficulty(elapsed: number) {
  const t = Math.min(1, elapsed / ROUND_MS)
  return {
    spawnEvery: 850 - 480 * t, // 850ms -> 370ms
    lifetime: 1500 - 700 * t, // 1500ms -> 800ms
  }
}

function pickKind(elapsed: number, rand: () => number): Kind {
  const r = rand()
  const lvl = tier(elapsed)
  if (lvl >= 1 && r < 0.12) return 'whale'
  if (r < 0.32) return 'holder'
  return 'jeet'
}

/** Avanza el juego dt ms. Devuelve el nuevo estado y los eventos ocurridos. */
export function tick(s: GameState, dt: number, rand: () => number = Math.random): [GameState, Event[]] {
  if (s.over) return [s, []]
  const events: Event[] = []
  const elapsed = Math.min(ROUND_MS, s.elapsed + dt)
  let { streak, escaped, nextSpawn, nextId } = s
  const holes = s.holes.slice()

  // Los que se escapan
  holes.forEach((m, i) => {
    if (m && m.until <= elapsed) {
      holes[i] = null
      // Dejar escapar a un holder está bien; dejar escapar a un jeet rompe la racha
      if (m.kind !== 'holder') {
        streak = 0
        escaped++
        events.push({ type: 'escape', hole: i })
      }
    }
  })

  // Aparecen nuevos
  if (elapsed >= nextSpawn) {
    const free = holes.map((m, i) => (m ? -1 : i)).filter(i => i >= 0)
    if (free.length) {
      const hole = free[Math.floor(rand() * free.length)]
      const kind = pickKind(elapsed, rand)
      const { lifetime } = difficulty(elapsed)
      holes[hole] = {
        id: nextId++,
        kind,
        hp: kind === 'whale' ? 3 : 1,
        until: elapsed + (kind === 'whale' ? lifetime * 1.8 : lifetime),
      }
    }
    nextSpawn = elapsed + difficulty(elapsed).spawnEvery
  }

  return [{ ...s, elapsed, holes, streak, escaped, nextSpawn, nextId, over: elapsed >= ROUND_MS }, events]
}

/** El jugador toca un agujero. */
export function slap(s: GameState, hole: number): [GameState, Event[]] {
  if (s.over) return [s, []]
  const m = s.holes[hole]
  if (!m) return [{ ...s, streak: 0 }, [{ type: 'miss' }]]

  const holes = s.holes.slice()
  if (m.kind === 'holder') {
    // Abofetear a un diamond hand: penalización y se acaba la racha
    holes[hole] = null
    const points = -25
    return [
      { ...s, holes, score: Math.max(0, s.score + points), streak: 0 },
      [{ type: 'hit', kind: 'holder', points, hole, killed: true }],
    ]
  }

  const hp = m.hp - 1
  const killed = hp <= 0
  const streak = s.streak + 1
  const base = m.kind === 'whale' ? (killed ? 50 : 5) : 10
  const points = Math.round(base * comboMultiplier(streak))
  holes[hole] = killed ? null : { ...m, hp }
  return [
    { ...s, holes, score: s.score + points, streak, slaps: s.slaps + 1 },
    [{ type: 'hit', kind: m.kind, points, hole, killed }],
  ]
}
