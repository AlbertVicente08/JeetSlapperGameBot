// Cliente de la API del ranking (Cloudflare Pages Functions en /api).
import type { Tap } from './game/engine'
import { initData } from './telegram'

export interface Ranked {
  name: string
  score: number // puntuación del ranking (récord x boost)
  community: boolean // tiene el Boost Comunidad
  verified: boolean // récord verificado repitiendo la partida en el servidor
}

export interface Leaderboard {
  top: Ranked[]
  me: { best: number; ranked: number; rank: number; community: boolean } | null
  players: number
}

export interface SubmitResult {
  counted: boolean // false si el detector de bots la ha descartado
  status: 'ok' | 'suspicious' | 'rejected'
  reason?: string
  replayed: boolean // el servidor la ha repetido (entraba en el top 3)
  best?: number // récord sin boosts
  ranked?: number // récord x boost
  rank?: number
  improved?: boolean
  community?: boolean
  verified?: boolean
}

export interface Session {
  sessionId: string
  seed: number
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${path}: ${res.status}`)
  return res.json() as Promise<T>
}

export const startSession = () => post<Session>('/api/session', { initData: initData() })

export const submitScore = (sessionId: string, score: number, taps: Tap[]) =>
  post<SubmitResult>('/api/score', { initData: initData(), sessionId, score, taps })

export const fetchLeaderboard = () => post<Leaderboard>('/api/leaderboard', { initData: initData() })
