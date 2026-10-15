// GET /api/curve -> { live: false } before the token exists, or
//                   { live: true, mint, progress, solRaised, priceSol, complete }
// Reads the pump.fun bonding curve on-chain. Cached 15 s at the edge.
import { heliusRpc, json, tokenLive, type Env, type PagesFunction } from '../../server/env.ts'
import { getBondingCurve } from '../../server/solana.ts'

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (!tokenLive(env)) return json({ live: false }, 200, { 'cache-control': 'public, max-age=60' })
  try {
    const curve = await getBondingCurve(heliusRpc(env), env.TOKEN_MINT!)
    if (!curve) return json({ live: true, mint: env.TOKEN_MINT, error: 'curve not found' }, 200)
    return json({ live: true, mint: env.TOKEN_MINT, ...curve }, 200, { 'cache-control': 'public, max-age=15' })
  } catch (e) {
    console.error(e)
    return json({ live: true, mint: env.TOKEN_MINT, error: 'rpc error' }, 200)
  }
}
