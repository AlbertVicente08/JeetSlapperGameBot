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

export interface TournamentBoard {
  week?: string
  month?: string
  top: { name: string; score: number; raw: number; holder: number; community: boolean }[]
  me: { score: number; raw: number; rank: number } | null
  players: number
}

export interface Leaderboard {
  top: Ranked[]
  holders: Ranked[]
  me: Me | null
  players: number
  weekly: TournamentBoard
  monthly: TournamentBoard
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

export class ApiError extends Error {
  status: number
  code?: string
  constructor(path: string, status: number, code?: string) {
    super(`${path}: ${status}${code ? ` ${code}` : ''}`)
    this.status = status
    this.code = code
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    throw new ApiError(path, res.status, data.error)
  }
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
