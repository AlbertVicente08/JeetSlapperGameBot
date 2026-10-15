import { test } from 'node:test'
import assert from 'node:assert/strict'
import { quickCheck, replayCheck, validateTaps } from '../server/anticheat.ts'
import { human, play } from './helpers.ts'

const REAL_TIME = 40_000 // the game really lasted 40 s

test('a realistic human passes both checks', () => {
  for (const seed of [11, 22, 33, 44, 55]) {
    const p = play(seed, { reaction: human(300, 70), skip: 0.12, mistake: 0.06 })
    assert.equal(quickCheck(p.taps, p.score, REAL_TIME).status, 'ok', `quick, seed ${seed}`)
    assert.equal(replayCheck(seed, p.taps, p.score).status, 'ok', `replay, seed ${seed}`)
  }
})

test('a perfect bot (20 ms) is rejected when replayed', () => {
  const p = play(1, { reaction: () => 20 })
  const v = replayCheck(1, p.taps, p.score)
  assert.equal(v.status, 'rejected')
  assert.match(v.reason!, /faster than a human/)
})

test('a "slow" bot (140 ms, no mistakes) is rejected too', () => {
  const p = play(2, { reaction: () => 140 })
  assert.equal(replayCheck(2, p.taps, p.score).status, 'rejected')
})

test('an invented score does not add up', () => {
  const p = play(3, { reaction: human(), skip: 0.1, mistake: 0.05 })
  const v = replayCheck(3, p.taps, p.score + 500)
  assert.equal(v.status, 'rejected')
  assert.match(v.reason!, /doesn't add up/)
})

test('taps made by code are rejected', () => {
  const p = play(4, { reaction: human(), skip: 0.1 })
  const fake = p.taps.map(([t, h]) => [t, h, 0] as [number, number, 0])
  assert.equal(quickCheck(fake, p.score, REAL_TIME).status, 'rejected')
})

test('submitting before the game could have finished is rejected', () => {
  const p = play(5, { reaction: human() })
  assert.equal(quickCheck(p.taps, p.score, 5_000).status, 'rejected')
})

test('points without taps are rejected', () => {
  assert.equal(quickCheck([], 100, REAL_TIME).status, 'rejected')
})

test('a machine-regular rhythm is flagged', () => {
  const taps = Array.from({ length: 60 }, (_, i) => [i * 400, i % 12, 1] as [number, number, 1])
  assert.equal(quickCheck(taps, 600, REAL_TIME).status, 'suspicious')
})

test('tap log validation', () => {
  assert.ok(validateTaps([[0, 0, 1], [100, 11, 0]]))
  assert.ok(!validateTaps([[100, 0, 1], [50, 0, 1]]), 'times must not go back')
  assert.ok(!validateTaps([[0, 12, 1]]), 'square out of range')
  assert.ok(!validateTaps([[0, 0, 2]]), 'trusted must be 0/1')
  assert.ok(!validateTaps('nope'))
})
