import { test } from 'node:test'
import assert from 'node:assert/strict'
import { comboMultiplier, newGame, replay, ROUND_MS, slap, tick, HOLES } from '../src/game/engine.ts'
import { human, play, seeded } from './helpers.ts'

test('the same seed always produces the same game', () => {
  const a = play(1234, { reaction: () => 250 }, seeded(1))
  const b = play(1234, { reaction: () => 250 }, seeded(1))
  assert.equal(a.score, b.score)
  assert.deepEqual(a.taps, b.taps)
})

test('different seeds produce different games', () => {
  const a = play(1, { reaction: () => 250 }, seeded(1))
  const b = play(2, { reaction: () => 250 }, seeded(1))
  assert.notDeepEqual(a.taps, b.taps)
})

test('replaying the taps gives exactly the same score', () => {
  for (const seed of [7, 99, 123456, 4_000_000_000]) {
    const p = play(seed, { reaction: human(), skip: 0.1, mistake: 0.05 })
    assert.equal(replay(seed, p.taps).state.score, p.score, `seed ${seed}`)
  }
})

test('a round lasts 30 s plus at most 9 s of clocks', () => {
  const p = play(42, { reaction: () => 200 })
  assert.ok(p.state.duration >= ROUND_MS && p.state.duration <= ROUND_MS + 9_000)
  assert.equal(p.state.elapsed, p.state.duration)
})

test('combo goes up 0.5x every 5 hits, capped at 3x', () => {
  assert.equal(comboMultiplier(0), 1)
  assert.equal(comboMultiplier(5), 1.5)
  assert.equal(comboMultiplier(10), 2)
  assert.equal(comboMultiplier(100), 3)
})

test('tapping an empty square breaks the streak', () => {
  let s = { ...newGame(5), streak: 7 }
  const empty = s.holes.findIndex(h => !h)
  ;[s] = slap(s, empty)
  assert.equal(s.streak, 0)
})

test('the score never goes below zero', () => {
  let s = newGame(9)
  while (!s.over) {
    const bad = s.holes.findIndex(h => h?.kind === 'holder' || h?.kind === 'rug')
    if (bad >= 0) [s] = slap(s, bad)
    ;[s] = tick(s)
    assert.ok(s.score >= 0)
  }
})

test('board has 12 squares', () => {
  assert.equal(newGame(1).holes.length, HOLES)
  assert.equal(HOLES, 12)
})
