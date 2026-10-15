# HANDOFF — read this first (for Antigravity or any AI agent)

You are continuing the **Jeet Slapper / BertoBCN** project. Another agent built everything up to 2026-10-16. This file tells you where things are, the rules you must follow, and exactly what is left.

## 0. Ground rules (non-negotiable)
1. **Talk to the user in Spanish. Write EVERYTHING public or in the repo in English** (game UI, bot texts, website, docs, code comments, social posts). The community is global.
2. **Never print, log, commit or paste secrets.** They live in `.env` (git-ignored) and as Cloudflare Pages secrets. Read them from `.env` inside scripts only.
3. **Never commit** `.env`, `app/.dev.vars` or any `secrets.json`. Check `git diff --cached --name-only` before every commit.
4. **Keep honest risk warnings** on anything about $JSLAP (crypto is high risk, not financial advice, 18+, not available where prohibited). No coordinated raids, no private "alpha" groups, no paid undisclosed promotion, no promises of profit (EU MiCA / Spanish CNMV rules).
5. **Don't re-architect.** The stack is final: Vite + React + TypeScript on Cloudflare Pages + Pages Functions, Supabase, Groq, Helius. No Next.js, no Vercel, no Upstash.
6. After any code change: run the tests, build, deploy, verify in production, then commit and push.
7. Read `STATUS.md` (live to-do list) and `app/README.md` (architecture) before touching code. Update `STATUS.md` when you finish something.

## 1. What exists and works (verified in production)
- **Website**: https://jeet-slapper.pages.dev (landing) · `/play/` (Telegram Mini App game) · `/wallet/` (Phantom linking) · `/rules/` · `/privacy/`.
- **Bot**: @JeetSlapperGameBot — menu button "Play", `/start`, `/invite`, `/roast`, `/slap` (Groq `openai/gpt-oss-20b`), webhook `POST /api/bot`. The bot is **admin** of the channel `@RealBertoBcn` (can post).
- **Game**: 12 squares, 30 s rounds, jeets/golden/whales/power-ups/bombs, deterministic engine (seed + fixed 20 ms steps) in `app/src/game/engine.ts`.
- **Ranked mode requires a linked Phantom wallet**; without it the game is practice only (`/api/session` returns 403 `wallet_required`).
- **Rankings**: weekly, monthly, all-time and Holders League — all with boosts:
  Community x1.5 (member of @RealBertoBcn) · Squad +10%/invited friend, max +50% · Holder x2.5 (≥100k $JSLAP) / x5 (≥500k) after 30 min holding.
- **Prizes in $JSLAP** (`app/src/prizes.ts`): weekly 🥇100k 🥈50k 🥉25k, monthly 🏆250k, Graduation Jackpot (all-time top 20 share 1.5% of supply).
- **Automation** (Supabase `pg_cron`): weekly close Mon 00:05 UTC → `/api/cron/weekly`; monthly close 1st 00:10 UTC → `/api/cron/monthly`; daily cleanup. Results are posted in the channel and the admin gets the winners with wallets by DM.
- **Anti-cheat**: bot detector on every game + full server replay for games entering a prize place / top 3 (`app/server/anticheat.ts`). Admin alert on rejected top games.
- **Tests**: `npm --prefix app test` → 27 passing.
- **Brand assets** in `brand/`: avatar, token logo, banner 1500×500, 5 memes, 8 stickers ([pack](https://t.me/addstickers/jeetslapper_by_JeetSlapperGameBot)). Re-render with `powershell -File brand\source\render.ps1`.
- **Docs**: `blueprint/05_COMMUNITY_GROWTH_PLAN.md` (phased growth plan), `STATUS.md`, `app/README.md`.

### Key ids and commands
- Supabase project: `jeet-slapper` (`pascirdtgdemrnxjfcyw`, eu-central-1). Migrations in `supabase/migrations/`.
- Cloudflare Pages project: `jeet-slapper`. Admin Telegram id is in `.env` (`ADMIN_TELEGRAM_ID`).
- Community: channel `t.me/RealBertoBcn`, chat `t.me/+aGQnR6gxz_oxNWY0`, personal X **BertoBCN** = `@albertv_dev`.
- Commands (from the project root):
  - `npm --prefix app test`
  - `npm --prefix app run deploy` (build + deploy to Cloudflare Pages)
  - `npm --prefix app run dev` (game only, no API)

## 2. TASK FOR YOU NOW: X launch kit (the previous agent didn't get to finish it)
Create **`blueprint/06_X_LAUNCH_KIT.md`** (English) with ready-to-copy content, then give the user a short summary in Spanish.

### 2.1 Project X account
- Display name: `Jeet Slapper 👋💥`. Handle options in order (user must check availability): `@JeetSlapperGame`, `@JeetSlapper`, `@SlapTheJeets`, `@JSLAPgame`.
- Bio (≤160 chars), e.g.: `Slap the jeets. Never touch the diamond hands 👋💥 Free arcade game on Telegram · Weekly $JSLAP tournaments 🏆 · Built by @albertv_dev`
- Location `Telegram 🎮`, website `jeet-slapper.pages.dev`, avatar `brand/bot-avatar-640.jpg`, header `brand/banner-1500x500.png`, category Gaming.
- Pinned thread (4–6 posts): what it is, how to play, ranked + Phantom, prizes, boosts, "the only official CA is posted in t.me/RealBertoBcn and on the website", risk line.
- Once the user gives you the handle: add it to `app/src/community.ts` (LINKS), the landing footer, the bot `/start` buttons (`app/functions/api/bot.ts`) and the growth plan; redeploy.

### 2.2 Personal account (BertoBCN, @albertv_dev)
Bio, pinned build-in-public thread (draft in `05_COMMUNITY_GROWTH_PLAN.md` §Phase 1), and how it differs from the project account (builder voice vs product voice).

### 2.3 X Community (new) and Telegram texts
- X Community: name (e.g. `Jeet Slappers`), description, up to 10 rules (no spam, no scam links, no DM solicitations, no financial advice, English only, be respectful…), what to post there.
- Telegram channel description + pinned welcome post; chat pinned rules.

### 2.4 Banner prompts (same style as `brand/slap-original-2000.jpg`)
Write prompts for an image AI (ChatGPT/DALL·E, Ideogram, Midjourney) for: X header (1500×500, 3:1, keep the bottom-left ~400 px area clean because the avatar covers it), X Community header, Telegram channel avatar. Style reference to include in every prompt:
> 16-bit pixel art, dark purple/navy background with a soft vignette, neon hot-pink (#ff2e88) and cyan (#22e6ff) outlines and speed lines, a shiny golden armored gauntlet slapping a scared cartoon toilet-paper roll with a red "SELL" price tag, a big "SLAP!" comic burst in cyan with pink outline, retro arcade vibe, crisp pixels, high contrast, no extra text except the words given.
Add a negative prompt (blurry, photorealistic, 3D render, watermark, extra fingers, misspelled text) and a tip: generate wide, then crop to exact size.

### 2.5 4-week posting plan for BOTH accounts
- A day-by-day calendar for weeks 1–4 (what each account posts, what goes to Telegram).
- **Week 1 fully written** (~10 project posts + ~7 personal posts + 5 channel posts), the rest as templates.
- Weekly rhythm already automated: Monday results post (bot) → repost on X with a meme; Wednesday devlog; Friday challenge; Sunday last call.
- Reply strategy for the personal account at 0 followers (15–20 thoughtful replies/day in Solana / Telegram-games / indie-hacker threads; never "great post 🔥"). **Do not invent specific account handles to target**; describe the kind of accounts.
- Every post that mentions $JSLAP must include a short risk line (e.g. `NFA · high risk · DYOR`).
- KPIs to check each Monday (followers, profile link clicks, channel members/views, weekly players).

When done: link the new doc from `blueprint/INDEX.md` and `STATUS.md`, commit, push.

## 3. Open decisions — ASK THE USER before building
1. **Prize value**: at launch market cap (~$2.9k) the weekly 100k $JSLAP ≈ $0.29; at graduation (~$43k) ≈ $4.3 (SOL ≈ $105). Options proposed: (a) prizes defined in USD and paid in $JSLAP at the current curve price, with a cap; (b) bigger token amounts; (c) pay in SOL from creator fees. Previous recommendation: (a)+(c). Not decided.
2. **Prize budget**: current prizes ≈ 12.1M $JSLAP/year (1.2% of supply) — the dev bag (~17.4M) is mostly allocated to the jackpot (15M). Needs a decision on where prize tokens come from.
3. **"DEX paid" plan**: DexScreener Enhanced Info costs ~$299 and only matters if the token graduates. Proposed public rule: "if we graduate, DEX is paid with creator fees; if not enough, with a public community DEX fund". Optional: show the fund progress in the game. User hasn't confirmed.
4. **Legal**: the user was told once that token prizes where holding the token boosts your score can be treated as regulated gambling (organiser is in Spain). They accepted the risk. Don't re-argue; keep 18+ / not-where-prohibited / risk notices in place and suggest a legal check before paying the first token prize.

## 4. When the user creates the token (they will send the CA)
1. Ask for the mint address (CA). Never ask for private keys or seed phrases.
2. `npx wrangler pages secret put TOKEN_MINT --project-name jeet-slapper` (run from `app/`), also set `TOKEN_MINT=` in `.env`.
3. Add the CA to the landing (`app/index.html`, token section) with a copy button, and to the bot `/start` text.
4. Redeploy and verify: `GET https://jeet-slapper.pages.dev/api/curve` must return `live: true` with progress/solRaised; link a test wallet and check the Holder Boost in `/api/leaderboard`.
5. Remind the user: publish the CA pinned in the channel + X at the same time; create and announce the public prize wallet.

## 5. User-only to-dos (remind, don't do)
- Make the GitHub repo **private** (it's public now).
- Save `.env` in a password manager.
- BotFather → Bot Settings → Configure Mini App → `https://jeet-slapper.pages.dev/play/`.
- Create the project X account and the X Community.
- Play a ranked game from the phone after linking Phantom.

## 6. Later ideas (not started)
Seasons (reset all-time every 6–8 weeks + Hall of Fame), Telegram Stars cosmetics, an admin page to review suspicious games (today: SQL in `STATUS.md`).
