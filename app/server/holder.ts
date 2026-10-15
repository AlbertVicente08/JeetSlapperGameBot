// Holder Boost: x2.5 holding >= 100k $JSLAP, x5 holding >= 500k, after 30 minutes of continuous holding.
// Dropping below a tier (selling) lowers the boost immediately.
import { heliusRpc, rpc, tokenLive, type Env } from './env.ts'
import { getTokenBalance } from './solana.ts'

export const HOLDER_TIERS = [
  { tier: 2, min: 500_000, mult: 5 },
  { tier: 1, min: 100_000, mult: 2.5 },
] as const
export const MATURATION_MS = 30 * 60 * 1000

export const tierFor = (balance: number) => HOLDER_TIERS.find(t => balance >= t.min)?.tier ?? 0
export const multFor = (tier: number) => HOLDER_TIERS.find(t => t.tier === tier)?.mult ?? 1

export interface HolderState {
  tier: number // tier currently observed on-chain
  since: number | null // ms timestamp when that tier started
  mult: number // effective multiplier
}

/** Pure state transition, given a new on-chain balance. */
export function nextHolder(prev: HolderState, balance: number, now: number): HolderState {
  const tier = tierFor(balance)
  let { since, mult } = prev
  if (tier !== prev.tier) {
    if (tier < prev.tier) {
      // Sold or transferred: down to the new tier at once. Still holding that tier counts as matured.
      mult = Math.min(mult, multFor(tier))
      since = tier > 0 ? now - MATURATION_MS : null
    } else {
      // Bought more: the higher tier needs 30 minutes of holding
      since = now
    }
  }
  if (tier === 0) return { tier: 0, since: null, mult: 1 }
  if (since !== null && now - since >= MATURATION_MS) mult = multFor(tier)
  return { tier, since, mult }
}

interface Stored {
  wallet: string | null
  tier: number
  since: string | null
  mult: number
}

/** Re-reads the balance of the player's linked wallet and stores the new Holder Boost. */
export async function refreshHolder(env: Env, telegramId: number): Promise<HolderState | null> {
  if (!tokenLive(env)) return null
  const stored = await rpc<Stored | null>(env, 'get_holder', { p_telegram_id: telegramId })
  if (!stored?.wallet) return null
  try {
    const balance = await getTokenBalance(heliusRpc(env), stored.wallet, env.TOKEN_MINT!)
    const next = nextHolder(
      { tier: stored.tier, since: stored.since ? Date.parse(stored.since) : null, mult: Number(stored.mult) },
      balance,
      Date.now(),
    )
    await rpc(env, 'set_holder', {
      p_telegram_id: telegramId,
      p_tier: next.tier,
      p_since: next.since ? new Date(next.since).toISOString() : null,
      p_mult: next.mult,
    })
    return next
  } catch (e) {
    console.error('refreshHolder', e)
    return null
  }
}
