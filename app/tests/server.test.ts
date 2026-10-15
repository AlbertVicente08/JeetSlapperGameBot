import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseReferral, verifyInitData } from '../server/telegram.ts'
import { MATURATION_MS, nextHolder, tierFor } from '../server/holder.ts'
import { base58Decode, base58Encode, findProgramAddress, isAddress, verifySignature, walletLinkMessage } from '../server/solana.ts'
import { lastWeekStart } from '../server/weekly.ts'
import { signInitData } from './helpers.ts'

const TOKEN = '123456:TEST_ONLY'

test('valid initData is accepted, with the referral start_param', async () => {
  const data = signInitData(TOKEN, { id: 42, first_name: 'Ana' }, { start_param: 'ref_7' })
  const user = await verifyInitData(data, TOKEN)
  assert.equal(user?.id, 42)
  assert.equal(user?.startParam, 'ref_7')
})

test('tampered, expired or wrongly signed initData is rejected', async () => {
  const data = signInitData(TOKEN, { id: 42, first_name: 'Ana' })
  assert.equal(await verifyInitData(data.replace('Ana', 'Eve'), TOKEN), null)
  assert.equal(await verifyInitData(signInitData(TOKEN, { id: 1 }, {}, Math.floor(Date.now() / 1000) - 90_000), TOKEN), null)
  assert.equal(await verifyInitData(data, '999:OTHER'), null)
  assert.equal(await verifyInitData('', TOKEN), null)
})

test('referral codes', () => {
  assert.equal(parseReferral('ref_8369284549'), 8369284549)
  assert.equal(parseReferral('weekly'), null)
  assert.equal(parseReferral('ref_abc'), null)
  assert.equal(parseReferral(undefined), null)
})

test('holder tiers', () => {
  assert.equal(tierFor(99_999), 0)
  assert.equal(tierFor(100_000), 1)
  assert.equal(tierFor(500_000), 2)
})

test('holder boost needs 30 minutes and drops at once when selling', () => {
  const t0 = 1_000_000
  let h = nextHolder({ tier: 0, since: null, mult: 1 }, 600_000, t0)
  assert.deepEqual([h.tier, h.mult], [2, 1], 'not matured yet')
  h = nextHolder(h, 600_000, t0 + MATURATION_MS)
  assert.equal(h.mult, 5, 'matured: x5')
  h = nextHolder(h, 150_000, t0 + MATURATION_MS + 1)
  assert.deepEqual([h.tier, h.mult], [1, 2.5], 'sold down to tier 1: x2.5 at once')
  h = nextHolder(h, 10, t0 + MATURATION_MS + 2)
  assert.deepEqual([h.tier, h.mult], [0, 1], 'sold everything: x1')
})

test('base58 round trip and addresses', () => {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  assert.deepEqual(base58Decode(base58Encode(bytes)), bytes)
  assert.ok(isAddress('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P'))
  assert.ok(!isAddress('not-an-address'))
})

test('PDA derivation is deterministic and returns a valid address', async () => {
  const seeds = [new TextEncoder().encode('bonding-curve'), base58Decode('So11111111111111111111111111111111111111112')]
  const a = await findProgramAddress(seeds, '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P')
  const b = await findProgramAddress(seeds, '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P')
  assert.ok(isAddress(a))
  assert.equal(a, b)
})

test('wallet link signature (Ed25519) is verified', async () => {
  const keys = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])) as CryptoKeyPair
  const address = base58Encode(new Uint8Array(await crypto.subtle.exportKey('raw', keys.publicKey)))
  const msg = walletLinkMessage('a'.repeat(24), address)
  const sig = new Uint8Array(await crypto.subtle.sign('Ed25519', keys.privateKey, new TextEncoder().encode(msg)))
  assert.ok(await verifySignature(address, msg, sig))
  assert.ok(!(await verifySignature(address, msg + 'x', sig)), 'other message')
})

test('last week start is the previous Monday (UTC)', () => {
  assert.equal(lastWeekStart(new Date('2026-10-19T00:05:00Z')), '2026-10-12') // Monday
  assert.equal(lastWeekStart(new Date('2026-10-18T23:00:00Z')), '2026-10-05') // Sunday
})
