// Client of the game API (Cloudflare Pages Functions under /api).
import type { Tap } from './game/engine'
import { initData } from './telegram'

export interface Ranked {
  name: string
  score: number // leaderboard score (record x boosts)
  community: boolean // Community Boost
  verified: boolean // record verified by replaying the game on the server
  holder: number // Holder Boost multiplier (1 = none)
  squad: number // active invited friends (max 5)
  medal: number | null // 1-3 if top 3 of last week's tournament (Hall of Fame)
}

export interface Me {
  best: number
  ranked: number
  rank: number
  community: boolean
  referrals: number
  wallet: string | null
  holderTier: number
  holderMult: number
  holderSince: string | null
}

export interface Leaderboard {
  top: Ranked[]
  me: Me | null
  players: number
  weekly: {
    week: string
    top: { name: string; score: number }[]
    me: { score: number; rank: number } | null
    players: number
  }
}

export interface SubmitResult {
  counted: boolean // false if the bot detector discarded it
  status: 'ok' | 'suspicious' | 'rejected'
  reason?: string
  replayed: boolean // the server replayed it (it was entering a top 3)
  best?: number
  ranked?: number
  rank?: number
  improved?: boolean
  community?: boolean
  verified?: boolean
}

export interface Session {
  sessionId: string
  seed: number
}

export interface Curve {
  live: boolean
  mint?: string
  progress?: number
  solRaised?: number
  priceSol?: number
  complete?: boolean
  error?: string
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

export const startWalletLink = () => post<{ code: string; url: string; page: string }>('/api/wallet/start', { initData: initData() })

export async function fetchCurve(): Promise<Curve> {
  const res = await fetch('/api/curve')
  if (!res.ok) throw new Error(`/api/curve: ${res.status}`)
  return res.json() as Promise<Curve>
}
