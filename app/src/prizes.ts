// Prizes shown in the game, the landing, the rules page and the automatic channel posts. Edit them here.
// Prizes are paid in $JSLAP to the winner's linked Phantom wallet, after the games are verified.

export const TICKER = '$JSLAP'

/** Weekly tournament (Monday–Sunday UTC), best game x boosts. */
export const WEEKLY_PRIZES = [
  { place: 1, medal: '🥇', tokens: 100_000 },
  { place: 2, medal: '🥈', tokens: 50_000 },
  { place: 3, medal: '🥉', tokens: 25_000 },
] as const

/** Monthly tournament (calendar month UTC), best game x boosts. */
export const MONTHLY_PRIZES = [{ place: 1, medal: '🏆', tokens: 250_000 }] as const

// Graduation Jackpot: all-time top 20 when $JSLAP graduates on pump.fun (1.5% of the supply)
export const JACKPOT_SPLIT = [
  { place: '1st', share: '20%' },
  { place: '2nd', share: '13.3%' },
  { place: '3rd', share: '10%' },
  { place: '4th–10th', share: '5% each' },
  { place: '11th–20th', share: '2.17% each' },
] as const

export const fmtTokens = (n: number) => `${n.toLocaleString('en-US')} ${TICKER}`
