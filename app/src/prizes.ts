// Prizes shown in the game, the landing, the rules page and the weekly post. Edit them here.

export const WEEKLY_PRIZES = [
  { place: 1, medal: '🥇', prize: 'Telegram Gift + 👑 Hall of Fame + shout-out in the channel' },
  { place: 2, medal: '🥈', prize: '👑 Hall of Fame + shout-out in the channel' },
  { place: 3, medal: '🥉', prize: '👑 Hall of Fame + shout-out in the channel' },
] as const

// Planned Graduation Jackpot, only if $JSLAP launches and graduates on pump.fun
export const JACKPOT_SPLIT = [
  { place: '1st', share: '20%' },
  { place: '2nd', share: '13.3%' },
  { place: '3rd', share: '10%' },
  { place: '4th–10th', share: '5% each' },
  { place: '11th–20th', share: '2.17% each' },
] as const
