// Detector de bots y verificación de partidas.
// - quickCheck: barato, se aplica a TODAS las partidas (solo mira el registro de toques).
// - replayCheck: repite la partida entera con la semilla; se usa cuando alguien entraría al top 3.
import { HOLES, MAX_BONUS_MS, replay, ROUND_MS, type Tap } from '../src/game/engine'

export type Status = 'ok' | 'suspicious' | 'rejected'

export interface Verdict {
  status: Status
  reason?: string
  stats: Record<string, number>
}

const MAX_GAME_MS = ROUND_MS + MAX_BONUS_MS
const MAX_TAPS = 800

// Umbrales (ajustables según lo que veamos en la tabla games)
const MAX_TAPS_PER_SEC = 10 // un humano muy rápido ronda 6-8 toques/s sostenidos
const MIN_INTERVAL_CV = 0.15 // ritmo demasiado regular = máquina
const MIN_MEDIAN_REACTION_MS = 170 // reacción humana típica 200-350 ms
const MAX_FAST_REACTION_SHARE = 0.3 // % de reacciones por debajo de 120 ms
const FAST_REACTION_MS = 120
const PERFECT_GAME_MIN_TAPS = 60

/** Valida la forma del registro de toques. Devuelve un motivo si no es válido. */
export function validateTaps(taps: unknown): taps is Tap[] {
  if (!Array.isArray(taps) || taps.length > MAX_TAPS) return false
  let last = -1
  for (const t of taps) {
    if (!Array.isArray(t) || t.length !== 3) return false
    const [ms, hole, trusted] = t
    if (!Number.isInteger(ms) || ms < 0 || ms > MAX_GAME_MS || ms < last) return false
    if (!Number.isInteger(hole) || hole < 0 || hole >= HOLES) return false
    if (trusted !== 0 && trusted !== 1) return false
    last = ms
  }
  return true
}

const median = (xs: number[]) => {
  if (!xs.length) return 0
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/** Revisión rápida del registro de toques (sin repetir la partida). */
export function quickCheck(taps: Tap[], score: number, realElapsedMs: number): Verdict {
  const n = taps.length
  const lastTap = n ? taps[n - 1][0] : 0
  const untrusted = taps.filter(t => t[2] === 0).length
  const intervals: number[] = []
  for (let i = 1; i < n; i++) intervals.push(taps[i][0] - taps[i - 1][0])
  const mean = intervals.length ? intervals.reduce((a, b) => a + b, 0) / intervals.length : 0
  const sd = intervals.length
    ? Math.sqrt(intervals.reduce((a, b) => a + (b - mean) ** 2, 0) / intervals.length)
    : 0
  const cv = mean ? sd / mean : 0
  const tapsPerSec = n / Math.max(1, Math.min(lastTap, MAX_GAME_MS) / 1000)

  const stats = {
    taps: n,
    untrusted,
    tapsPerSec: Math.round(tapsPerSec * 100) / 100,
    intervalCv: Math.round(cv * 1000) / 1000,
    realElapsedMs,
  }
  const verdict = (status: Status, reason?: string): Verdict => ({ status, reason, stats })

  if (score > 0 && n === 0) return verdict('rejected', 'Puntos sin ningún toque')
  if (realElapsedMs < ROUND_MS - 2_000) return verdict('rejected', 'La partida ha durado menos de lo posible')
  if (lastTap > realElapsedMs + 2_000) return verdict('rejected', 'Toques fuera del tiempo real de la partida')
  if (untrusted > 0) return verdict('rejected', 'Toques generados por código, no por un dedo')
  if (tapsPerSec > MAX_TAPS_PER_SEC) return verdict('rejected', 'Demasiados toques por segundo')
  // Con PUMP + FINAL PUMP + combo x3 un toque vale como mucho 50 x 12 = 600
  if (score > n * 600) return verdict('rejected', 'Puntuación imposible para esos toques')
  if (n >= 30 && cv < MIN_INTERVAL_CV) return verdict('suspicious', 'Ritmo de toques demasiado regular')
  return verdict('ok')
}

/** Repite la partida con la semilla y analiza las reacciones. */
export function replayCheck(seed: number, taps: Tap[], score: number): Verdict {
  const { state, hits, misses } = replay(seed, taps)
  const reactions = hits.map(h => h.reaction)
  const badHits = hits.filter(h => h.kind === 'holder' || h.kind === 'rug').length
  const fast = reactions.filter(r => r < FAST_REACTION_MS).length
  const stats = {
    replayScore: state.score,
    medianReactionMs: Math.round(median(reactions)),
    fastReactionShare: reactions.length ? Math.round((fast / reactions.length) * 100) / 100 : 0,
    badHits,
    misses,
  }
  const verdict = (status: Status, reason?: string): Verdict => ({ status, reason, stats })

  if (state.score !== score) return verdict('rejected', 'La partida no cuadra al repetirla')
  if (reactions.length >= 10 && stats.medianReactionMs < MIN_MEDIAN_REACTION_MS)
    return verdict('rejected', 'Reacciones más rápidas que un humano')
  if (reactions.length >= 10 && stats.fastReactionShare > MAX_FAST_REACTION_SHARE)
    return verdict('rejected', 'Demasiadas reacciones instantáneas')
  if (taps.length >= PERFECT_GAME_MIN_TAPS && badHits === 0 && misses === 0)
    return verdict('suspicious', 'Partida perfecta: pendiente de revisión')
  return verdict('ok')
}
