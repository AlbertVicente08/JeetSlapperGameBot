// POST /api/wallet/link  { code, address, signature (base64) }  ->  { ok } | { error }
// The /wallet/ page (inside Phantom) signs a message with the code; we verify the Ed25519 signature,
// which proves the player owns the wallet, and link it to their Telegram account (one wallet per account).
import { json, rpc, type Env, type PagesFunction } from '../../../server/env.ts'
import { isAddress, verifySignature, walletLinkMessage } from '../../../server/solana.ts'

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = (await request.json().catch(() => ({}))) as { code?: unknown; address?: unknown; signature?: unknown }
  const { code, address, signature } = body
  if (typeof code !== 'string' || !/^[0-9a-f]{24}$/.test(code)) return json({ error: 'Invalid code' }, 400)
  if (!isAddress(address)) return json({ error: 'Invalid wallet address' }, 400)
  if (typeof signature !== 'string' || signature.length > 200) return json({ error: 'Invalid signature' }, 400)

  let sig: Uint8Array
  try {
    sig = Uint8Array.from(atob(signature), c => c.charCodeAt(0))
  } catch {
    return json({ error: 'Invalid signature' }, 400)
  }
  if (!(await verifySignature(address, walletLinkMessage(code, address), sig))) {
    return json({ error: 'The signature does not match this wallet' }, 401)
  }

  try {
    const result = await rpc<string>(env, 'link_wallet', { p_code: code, p_wallet: address })
    if (result === 'invalid_code') return json({ error: 'This link has expired. Start again from the game.' }, 409)
    if (result === 'wallet_taken') return json({ error: 'This wallet is already linked to another Telegram account.' }, 409)
    return json({ ok: true })
  } catch (e) {
    console.error(e)
    return json({ error: 'Could not link the wallet' }, 502)
  }
}
