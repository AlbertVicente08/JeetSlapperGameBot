// Pure game logic (no React, no DOM). It is deterministic: the same seed and the same taps
// always produce the same game, so the server can replay it to verify it.

export type Kind =
  | 'jeet' // +10, slap it
  | 'holder' // diamond hand: −25 if you hit it
  | 'whale' // 3 hits
  | 'golden' // golden jeet: fast and rare, +50
  | 'rug' // bomb: −50, breaks the streak and clears the board
  | 'pump' // power-up: x2 points for 5 s
  | 'clock' // power-up: +3 s of game time

export interface Mole {
  id: number
  kind: Kind
  hp: number // hits left (the whale needs 3)
  born: number // game ms when it appeared
  until: number // game ms when it escapes
}

export interface GameState {
  elapsed: number // ms since the round started
  duration: number // total duration (30 s + clock bonuses)
  holes: (Mole | null)[]
  score: number
  streak: number // consecutive hits
  slaps: number
  escaped: number
  nextSpawn: number
  nextId: number
  pumpUntil: number // until when the PUMP power-up lasts
  rng: number // random generator state (comes from the seed)
  over: boolean
}

export type Event =
  | { type: 'hit'; kind: Kind; points: number; hole: number; killed: boolean }
  | { type: 'escape'; hole: number; points: number }
  | { type: 'miss' }

export const ROUND_MS = 30_000
export const HOLES = 12
export const ESCAPE_PENALTY = 5 // jeet or whale that escapes
export const HOLDER_PENALTY = 25
export const RUG_PENALTY = 50
export const PUMP_MS = 5_000
export const CLOCK_MS = 3_000
export const MAX_BONUS_MS = 9_000 // at most +9 s from clocks
export const FINAL_MS = 5_000 // last 5 s: FINAL PUMP, x2 points
export const STEP_MS = 20 // the game always advances in fixed 20 ms steps

/** mulberry32 pseudo-random generator: returns [number 0..1, new state]. */
function nextRand(state: number): [number, number] {
  const a = (state + 0x6d2b79f5) | 0
  let t = Math.imul(a ^ (a >>> 15), 1 | a)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, a]
}

export const randomSeed = () => Math.floor(Math.random() * 2 ** 32)

export function newGame(seed: number = randomSeed()): GameState {
  return {
    rng: seed | 0,
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

/** 1x, 1.5x, 2x... up to 3x, every 5 consecutive hits. */
export function comboMultiplier(streak: number): number {
  return Math.min(3, 1 + Math.floor(streak / 5) * 0.5)
}

export const pumpActive = (s: GameState) => s.elapsed < s.pumpUntil
export const finalPump = (s: GameState) => s.duration - s.elapsed <= FINAL_MS && !s.over

/** Total multiplier applied to positive points. */
export function pointsMultiplier(s: GameState, streak = s.streak): number {
  return comboMultiplier(streak) * (pumpActive(s) ? 2 : 1) * (finalPump(s) ? 2 : 1)
}

/** Level by time: 0 Baby Jeets, 1 Sniper Bots, 2 Whale Season. */
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

// Weights of each kind per level: every level brings more bombs and more rewards
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

/** Advances the game one fixed step (STEP_MS). Returns the new state and the events that happened. */
export function tick(s: GameState, dt: number = STEP_MS): [GameState, Event[]] {
  if (s.over) return [s, []]
  const events: Event[] = []
  let rng = s.rng
  const rand = () => {
    const [v, next] = nextRand(rng)
    rng = next
    return v
  }
  const elapsed = Math.min(s.duration, s.elapsed + dt)
  let { score, streak, escaped, nextSpawn, nextId } = s
  const holes = s.holes.slice()

  // The ones that escape
  holes.forEach((m, i) => {
    if (m && m.until <= elapsed) {
      holes[i] = null
      // Letting a jeet or a whale escape breaks the streak and costs points
      if (m.kind === 'jeet' || m.kind === 'whale') {
        streak = 0
        escaped++
        score = Math.max(0, score - ESCAPE_PENALTY)
        events.push({ type: 'escape', hole: i, points: -ESCAPE_PENALTY })
      }
    }
  })

  // New ones appear
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
        born: elapsed,
        until: elapsed + Math.round(d.lifetime * LIFETIME_FACTOR[kind]),
      }
    }
    nextSpawn = elapsed + Math.round(d.spawnEvery)
  }

  return [
    { ...s, elapsed, holes, score, streak, escaped, nextSpawn, nextId, rng, over: elapsed >= s.duration },
    events,
  ]
}

/** Recorded tap: [game ms, square, 1 if made by a real finger (isTrusted) / 0 if made by code]. */
export type Tap = [t: number, hole: number, trusted: 0 | 1]

export interface ReplayResult {
  state: GameState
  /** For every tap on something: what it was and how long the player took to react (ms). */
  hits: { kind: Kind; reaction: number }[]
  misses: number // taps on empty squares
}

/**
 * Replays a full game from the seed and the taps.
 * Taps are applied before the step whose time matches, exactly like in the client.
 */
export function replay(seed: number, taps: Tap[]): ReplayResult {
  let s = newGame(seed)
  const hits: ReplayResult['hits'] = []
  let misses = 0
  let i = 0
  while (!s.over) {
    while (i < taps.length && taps[i][0] <= s.elapsed) {
      const hole = taps[i][1]
      const m = s.holes[hole]
      if (m) hits.push({ kind: m.kind, reaction: s.elapsed - m.born })
      else misses++
      s = slap(s, hole)[0]
      i++
    }
    s = tick(s)[0]
  }
  return { state: s, hits, misses }
}

/** The player taps a square. */
export function slap(s: GameState, hole: number): [GameState, Event[]] {
  if (s.over) return [s, []]
  const m = s.holes[hole]
  if (!m) return [{ ...s, streak: 0 }, [{ type: 'miss' }]]

  const holes = s.holes.slice()
  const hit = (points: number, killed = true): Event => ({ type: 'hit', kind: m.kind, points, hole, killed })

  switch (m.kind) {
    case 'holder': {
      // Slapping a diamond hand: penalty and the streak ends
      holes[hole] = null
      return [{ ...s, holes, score: Math.max(0, s.score - HOLDER_PENALTY), streak: 0 }, [hit(-HOLDER_PENALTY)]]
    }
    case 'rug': {
      // Rug pull: costs points, breaks the streak and wipes the whole board
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
      // jeet, golden and whale add points with the multiplier
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
