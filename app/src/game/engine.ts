// Lógica pura del juego (sin React ni DOM) para poder testearla aparte.

export type Kind =
  | 'jeet' // +10, abofetéalo
  | 'holder' // diamond hand: −25 si le pegas
  | 'whale' // 3 golpes
  | 'golden' // jeet dorado: rápido y raro, +50
  | 'rug' // bomba: −50, rompe la racha y vacía el tablero
  | 'pump' // power-up: puntos x2 durante 5 s
  | 'clock' // power-up: +3 s de partida

export interface Mole {
  id: number
  kind: Kind
  hp: number // golpes que faltan (la ballena necesita 3)
  until: number // ms (tiempo de juego) en que se escapa
}

export interface GameState {
  elapsed: number // ms desde el inicio de la ronda
  duration: number // duración total (30 s + bonus de relojes)
  holes: (Mole | null)[]
  score: number
  streak: number // aciertos seguidos
  slaps: number
  escaped: number
  nextSpawn: number
  nextId: number
  pumpUntil: number // hasta cuándo dura el power-up PUMP
  over: boolean
}

export type Event =
  | { type: 'hit'; kind: Kind; points: number; hole: number; killed: boolean }
  | { type: 'escape'; hole: number; points: number }
  | { type: 'miss' }

export const ROUND_MS = 30_000
export const HOLES = 12
export const ESCAPE_PENALTY = 5 // jeet o ballena que se escapa
export const HOLDER_PENALTY = 25
export const RUG_PENALTY = 50
export const PUMP_MS = 5_000
export const CLOCK_MS = 3_000
export const MAX_BONUS_MS = 9_000 // como mucho +9 s por relojes
export const FINAL_MS = 5_000 // últimos 5 s: FINAL PUMP, puntos x2

export function newGame(): GameState {
  return {
    elapsed: 0,
    duration: ROUND_MS,
    holes: Array(HOLES).fill(null),
    score: 0,
    streak: 0,
    slaps: 0,
    escaped: 0,
    nextSpawn: 350,
    nextId: 1,
    pumpUntil: 0,
    over: false,
  }
}

/** 1x, 1.5x, 2x... hasta 3x cada 5 aciertos seguidos. */
export function comboMultiplier(streak: number): number {
  return Math.min(3, 1 + Math.floor(streak / 5) * 0.5)
}

export const pumpActive = (s: GameState) => s.elapsed < s.pumpUntil
export const finalPump = (s: GameState) => s.duration - s.elapsed <= FINAL_MS && !s.over

/** Multiplicador total que se aplica a los puntos positivos. */
export function pointsMultiplier(s: GameState, streak = s.streak): number {
  return comboMultiplier(streak) * (pumpActive(s) ? 2 : 1) * (finalPump(s) ? 2 : 1)
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
    spawnEvery: 600 - 370 * t, // 600ms -> 230ms
    lifetime: 1050 - 550 * t, // 1050ms -> 500ms
    doubleChance: [0.15, 0.35, 0.5][tier(elapsed)],
  }
}

// Probabilidades (pesos) de cada tipo por nivel: cada nivel trae más bombas y más premios
const WEIGHTS: Record<0 | 1 | 2, [Kind, number][]> = {
  0: [['jeet', 55], ['holder', 30], ['golden', 4], ['pump', 4], ['clock', 4], ['rug', 3]],
  1: [['jeet', 42], ['holder', 30], ['whale', 10], ['golden', 5], ['pump', 4], ['clock', 3], ['rug', 6]],
  2: [['jeet', 35], ['holder', 32], ['whale', 12], ['golden', 6], ['pump', 3], ['clock', 2], ['rug', 10]],
}

const LIFETIME_FACTOR: Record<Kind, number> = {
  jeet: 1,
  holder: 1,
  whale: 1.8,
  golden: 0.6,
  rug: 1.3,
  pump: 0.8,
  clock: 0.8,
}

function pickKind(elapsed: number, rand: () => number): Kind {
  const table = WEIGHTS[tier(elapsed)]
  const total = table.reduce((n, [, w]) => n + w, 0)
  let r = rand() * total
  for (const [kind, w] of table) {
    if ((r -= w) < 0) return kind
  }
  return 'jeet'
}

/** Avanza el juego dt ms. Devuelve el nuevo estado y los eventos ocurridos. */
export function tick(s: GameState, dt: number, rand: () => number = Math.random): [GameState, Event[]] {
  if (s.over) return [s, []]
  const events: Event[] = []
  const elapsed = Math.min(s.duration, s.elapsed + dt)
  let { score, streak, escaped, nextSpawn, nextId } = s
  const holes = s.holes.slice()

  // Los que se escapan
  holes.forEach((m, i) => {
    if (m && m.until <= elapsed) {
      holes[i] = null
      // Dejar escapar a un jeet o una ballena rompe la racha y resta
      if (m.kind === 'jeet' || m.kind === 'whale') {
        streak = 0
        escaped++
        score = Math.max(0, score - ESCAPE_PENALTY)
        events.push({ type: 'escape', hole: i, points: -ESCAPE_PENALTY })
      }
    }
  })

  // Aparecen nuevos
  if (elapsed >= nextSpawn) {
    const d = difficulty(elapsed)
    const count = rand() < d.doubleChance ? 2 : 1
    for (let n = 0; n < count; n++) {
      const free = holes.map((m, i) => (m ? -1 : i)).filter(i => i >= 0)
      if (!free.length) break
      const hole = free[Math.floor(rand() * free.length)]
      const kind = pickKind(elapsed, rand)
      holes[hole] = {
        id: nextId++,
        kind,
        hp: kind === 'whale' ? 3 : 1,
        until: elapsed + d.lifetime * LIFETIME_FACTOR[kind],
      }
    }
    nextSpawn = elapsed + d.spawnEvery
  }

  return [
    { ...s, elapsed, holes, score, streak, escaped, nextSpawn, nextId, over: elapsed >= s.duration },
    events,
  ]
}

/** El jugador toca un agujero. */
export function slap(s: GameState, hole: number): [GameState, Event[]] {
  if (s.over) return [s, []]
  const m = s.holes[hole]
  if (!m) return [{ ...s, streak: 0 }, [{ type: 'miss' }]]

  const holes = s.holes.slice()
  const hit = (points: number, killed = true): Event => ({ type: 'hit', kind: m.kind, points, hole, killed })

  switch (m.kind) {
    case 'holder': {
      // Abofetear a un diamond hand: penalización y se acaba la racha
      holes[hole] = null
      return [{ ...s, holes, score: Math.max(0, s.score - HOLDER_PENALTY), streak: 0 }, [hit(-HOLDER_PENALTY)]]
    }
    case 'rug': {
      // Rug pull: resta, rompe la racha y se lleva todo el tablero
      return [
        { ...s, holes: Array(HOLES).fill(null), score: Math.max(0, s.score - RUG_PENALTY), streak: 0 },
        [hit(-RUG_PENALTY)],
      ]
    }
    case 'pump': {
      holes[hole] = null
      return [{ ...s, holes, pumpUntil: s.elapsed + PUMP_MS, slaps: s.slaps + 1 }, [hit(0)]]
    }
    case 'clock': {
      holes[hole] = null
      const duration = Math.min(ROUND_MS + MAX_BONUS_MS, s.duration + CLOCK_MS)
      return [{ ...s, holes, duration, slaps: s.slaps + 1 }, [hit(0)]]
    }
    default: {
      // jeet, golden y ballena suman puntos con el multiplicador
      const hp = m.hp - 1
      const killed = hp <= 0
      const streak = s.streak + 1
      const base = m.kind === 'whale' ? (killed ? 50 : 5) : m.kind === 'golden' ? 50 : 10
      const points = Math.round(base * pointsMultiplier(s, streak))
      holes[hole] = killed ? null : { ...m, hp }
      return [{ ...s, holes, score: s.score + points, streak, slaps: s.slaps + 1 }, [hit(points, killed)]]
    }
  }
}
