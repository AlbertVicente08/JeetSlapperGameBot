// Minimal Solana helpers without @solana/web3.js: base58, PDAs, Ed25519 signatures,
// token balances and the pump.fun bonding curve.
import { ed25519 } from '@noble/curves/ed25519.js'

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

export function base58Decode(s: string): Uint8Array {
  let n = 0n
  for (const c of s) {
    const i = ALPHABET.indexOf(c)
    if (i < 0) throw new Error('invalid base58')
    n = n * 58n + BigInt(i)
  }
  const bytes: number[] = []
  while (n > 0n) {
    bytes.unshift(Number(n % 256n))
    n /= 256n
  }
  for (const c of s) {
    if (c !== '1') break
    bytes.unshift(0)
  }
  return new Uint8Array(bytes)
}

export function base58Encode(b: Uint8Array): string {
  let n = 0n
  for (const x of b) n = n * 256n + BigInt(x)
  let out = ''
  while (n > 0n) {
    out = ALPHABET[Number(n % 58n)] + out
    n /= 58n
  }
  for (const x of b) {
    if (x !== 0) break
    out = '1' + out
  }
  return out
}

/** A valid Solana address is 32 bytes in base58. */
export function isAddress(s: unknown): s is string {
  if (typeof s !== 'string' || s.length < 32 || s.length > 44) return false
  try {
    return base58Decode(s).length === 32
  } catch {
    return false
  }
}

const toHex = (b: Uint8Array) => [...b].map(x => x.toString(16).padStart(2, '0')).join('')

function isOnCurve(bytes: Uint8Array): boolean {
  try {
    ed25519.Point.fromHex(toHex(bytes))
    return true
  } catch {
    return false
  }
}

/** Equivalent of PublicKey.findProgramAddressSync. */
export async function findProgramAddress(seeds: Uint8Array[], programId: string): Promise<string> {
  const program = base58Decode(programId)
  const marker = new TextEncoder().encode('ProgramDerivedAddress')
  for (let bump = 255; bump >= 0; bump--) {
    const parts = [...seeds, new Uint8Array([bump]), program, marker]
    const buf = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
    let o = 0
    for (const p of parts) {
      buf.set(p, o)
      o += p.length
    }
    const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', buf))
    if (!isOnCurve(hash)) return base58Encode(hash)
  }
  throw new Error('no PDA found')
}

/** Verifies an Ed25519 signature (Phantom signMessage) of `message` by `address`. */
export async function verifySignature(address: string, message: string, signature: Uint8Array): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey('raw', base58Decode(address) as BufferSource, { name: 'Ed25519' }, false, ['verify'])
    return await crypto.subtle.verify('Ed25519', key, signature as BufferSource, new TextEncoder().encode(message))
  } catch {
    return false
  }
}

/** The exact message the player signs in Phantom to link a wallet. */
export const walletLinkMessage = (code: string, address: string) =>
  `Jeet Slapper: link this wallet to my Telegram account.\n\nWallet: ${address}\nCode: ${code}\n\nThis does not cost anything and does not give access to your funds.`

async function rpcCall<T>(rpcUrl: string, method: string, params: unknown[]): Promise<T> {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  })
  const data = (await res.json()) as { result?: T; error?: { message: string } }
  if (data.error) throw new Error(`RPC ${method}: ${data.error.message}`)
  return data.result as T
}

/** Total balance (UI units) of `mint` held by `owner` (works for SPL Token and Token-2022). */
export async function getTokenBalance(rpcUrl: string, owner: string, mint: string): Promise<number> {
  const r = await rpcCall<{ value: { account: { data: { parsed: { info: { tokenAmount: { uiAmount: number | null } } } } } }[] }>(
    rpcUrl,
    'getTokenAccountsByOwner',
    [owner, { mint }, { encoding: 'jsonParsed', commitment: 'confirmed' }],
  )
  return r.value.reduce((sum, a) => sum + (a.account.data.parsed.info.tokenAmount.uiAmount ?? 0), 0)
}

export const PUMP_PROGRAM = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P'
const INITIAL_REAL_TOKEN_RESERVES = 793_100_000_000_000n // 793.1M tokens with 6 decimals

export interface CurveState {
  progress: number // 0..1 of the bonding curve
  solRaised: number
  priceSol: number // SOL per token
  complete: boolean // graduated to PumpSwap
}

/** Reads the pump.fun bonding curve account of `mint`. */
export async function getBondingCurve(rpcUrl: string, mint: string): Promise<CurveState | null> {
  const pda = await findProgramAddress([new TextEncoder().encode('bonding-curve'), base58Decode(mint)], PUMP_PROGRAM)
  const r = await rpcCall<{ value: { data: [string, string] } | null }>(rpcUrl, 'getAccountInfo', [
    pda,
    { encoding: 'base64', commitment: 'confirmed' },
  ])
  if (!r.value) return null
  const raw = Uint8Array.from(atob(r.value.data[0]), c => c.charCodeAt(0))
  const view = new DataView(raw.buffer)
  // Layout: 8 discriminator | virtualToken u64 | virtualSol u64 | realToken u64 | realSol u64 | supply u64 | complete bool
  const u64 = (o: number) => view.getBigUint64(o, true)
  const virtualToken = u64(8)
  const virtualSol = u64(16)
  const realToken = u64(24)
  const realSol = u64(32)
  const complete = raw[48] === 1
  const progress = complete ? 1 : Number(INITIAL_REAL_TOKEN_RESERVES - realToken) / Number(INITIAL_REAL_TOKEN_RESERVES)
  return {
    progress: Math.max(0, Math.min(1, progress)),
    solRaised: Number(realSol) / 1e9,
    priceSol: virtualToken > 0n ? Number(virtualSol) / 1e9 / (Number(virtualToken) / 1e6) : 0,
    complete,
  }
}
