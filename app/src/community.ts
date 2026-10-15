// Community links and boosts of BertoBCN.
export const LINKS = {
  channel: 'https://t.me/RealBertoBcn',
  chat: 'https://t.me/+aGQnR6gxz_oxNWY0',
  twitter: 'https://x.com/albertv_dev',
  twitterGame: 'https://x.com/JeetSlapperGame',
  pumpFun: 'https://pump.fun/coin/AvBWjB7doWb1h7TmketWaFfZ4i2vcfCvRXstyBMGpump',
  dexscreener: 'https://dexscreener.com/solana/AvBWjB7doWb1h7TmketWaFfZ4i2vcfCvRXstyBMGpump',
  ca: 'AvBWjB7doWb1h7TmketWaFfZ4i2vcfCvRXstyBMGpump',
  rules: 'https://jeet-slapper.pages.dev/rules/',
  privacy: 'https://jeet-slapper.pages.dev/privacy/',
}

/** Leaderboard multiplier for being in the main channel (applied on the server). */
export const COMMUNITY_BOOST = 1.5

/** Squad Boost: +10% per invited friend who plays, up to 5 friends. */
export const SQUAD_STEP = 0.1
export const SQUAD_MAX = 5

/** Minutes you must hold the tokens to activate the Holder Boost. */
export const HOLDER_HOLD_MINUTES = 30

// Holder Boost tiers (see blueprint/02_PROJECT_SPECIFICATION.md)
export const HOLDER_TIERS = [
  { min: 0, label: 'No wallet / < 100,000', boost: 'x1' },
  { min: 100_000, label: '≥ 100,000 $JSLAP', boost: 'x2.5' },
  { min: 500_000, label: '≥ 500,000 $JSLAP', boost: 'x5' },
]
