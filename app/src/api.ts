// Cliente de la API del ranking (Cloudflare Pages Functions en /api).
import { initData } from './telegram'

export interface Ranked {
  name: string
  score: number
}

export interface Leaderboard {
  top: Ranked[]
  me: { best: number; rank: number } | null
  players: number
}

export interface SubmitResult {
  best: number
  rank: number
  improved: boolean
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

export const submitScore = (score: number) => post<SubmitResult>('/api/score', { initData: initData(), score })

export const fetchLeaderboard = () => post<Leaderboard>('/api/leaderboard', { initData: initData() })
