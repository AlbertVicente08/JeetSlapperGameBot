# Jeet Slapper — game, website and API

| Page | Source | URL |
|---|---|---|
| Landing | `index.html` | https://jeet-slapper.pages.dev |
| Game (Telegram Mini App) | `play/index.html` + `src/` | /play/ |
| Wallet linking (inside Phantom) | `wallet/index.html` + `src/wallet.ts` | /wallet/ |
| Rules & prizes / Privacy | `rules/`, `privacy/` | /rules/ · /privacy/ |

- **API**: Cloudflare Pages Functions in `functions/api/*`, shared logic in `server/`.
- **Database**: Supabase (migrations in `../supabase/migrations/`), with `pg_cron` for the weekly tournament.

## The game

12 squares, 30-second rounds:

| | |
|---|---|
| 🧻 Jeet | +10 × multiplier |
| 🪙 Golden jeet | +50 × multiplier (fast and rare) |
| 🐋 Whale | 3 hits: +5, +5, +50 |
| 🚀 PUMP | x2 points for 5 s |
| ⏱️ Clock | +3 s (max +9 s) |
| 💎 Diamond hand | −25, breaks the streak |
| 💣 Rug | −50, breaks the streak, clears the board |
| 💨 Escaped jeet | −5 |

- **Combo**: +0.5x every 5 consecutive hits (max x3).
- **FINAL PUMP**: the last 5 s count x2.

The engine (`src/game/engine.ts`) is **deterministic**: fixed 20 ms steps and a seed, so the server can replay any game from its taps.

## API

| Route | What it does |
|---|---|
| `POST /api/session` | Validates Telegram initData, requires a linked Phantom wallet (403 `wallet_required` = practice mode), creates a one-time session with a seed, records `startapp` referrals |
| `POST /api/score` | Bot detector; replays games entering the all-time or weekly top 3; saves to `games` / `players`; alerts the admin on rejected top games |
| `POST /api/leaderboard` | All-time top 10 (boosts, 👑 medals) + weekly top 10 + your position; re-checks channel membership and holder balances |
| `POST /api/bot` | Bot webhook: `/start`, `/invite`, `/roast`, `/slap` (protected by `TELEGRAM_WEBHOOK_SECRET`) |
| `POST /api/cron/weekly` · `POST /api/cron/monthly` | Close last week's / month's tournament, post it in the channel and DM the admin the winners with wallets and $JSLAP prizes (called by Supabase `pg_cron`, `CRON_SECRET`) |
| `POST /api/wallet/start` · `POST /api/wallet/link` | Phantom wallet linking with an Ed25519 signature |
| `GET /api/curve` | pump.fun bonding curve of `TOKEN_MINT` (`{ live: false }` until the token exists) |

Cloudflare secrets: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_TELEGRAM_ID`, `CRON_SECRET`, `GROQ_API_KEY`, `HELIUS_API_KEY` and `TOKEN_MINT` (the $JSLAP mint). Locally they go in `.dev.vars` (never committed).

## Commands

Game only (no API):
```bash
npm run dev
```

Tests:
```bash
npm test
```

Game + API locally (uses `.dev.vars`):
```bash
npm run build && npx wrangler pages dev --port 8788
```

Publish:
```bash
npm run deploy
```

Project status and to-dos: [`../STATUS.md`](../STATUS.md).
