# Project status — Jeet Slapper / BertoBCN

**Last updated**: 2026-10-16. This is the living list of what's done and what's pending. The `blueprint/` documents are the original plan (by Antigravity, corrected); this file is what's real.

---

## ✅ Done and live

| What | Where |
|---|---|
| Landing page (game, prizes, boosts, token, risk warning) | https://jeet-slapper.pages.dev |
| Rules & prizes page / Privacy policy (GDPR) | `/rules/` · `/privacy/` |
| Game (Telegram Mini App): 12 squares, power-ups, bombs, FINAL PUMP, English UI | https://jeet-slapper.pages.dev/play/ |
| Bot @JeetSlapperGameBot: Play button, `/start`, `/invite`, AI `/roast` and `/slap` (Groq), profile photo | Telegram |
| All-time leaderboard with boosts + **weekly tournament** (no boosts) | Game → Ranking |
| **Prizes zone** (weekly top 3 + Graduation Jackpot plan) | Game, landing, `/rules/` (edit in `app/src/prizes.ts`) |
| Weekly results posted automatically every Monday 00:05 UTC in the channel + winners DM'd to the admin | Supabase `pg_cron` → `/api/cron/weekly` |
| Hall of Fame 👑 for last week's top 3 | All-time ranking |
| Community Boost x1.5 (member of @RealBertoBcn) | ✅ bot is channel admin |
| Squad Boost +10% per invited friend who plays (max +50%) | `/invite`, game, `t.me/JeetSlapperGameBot?start=ref_<id>` |
| Share: X post, challenge a friend on Telegram, score card image | Results screen |
| Anti-cheat: bot detector on every game, full server replay for games entering the all-time or weekly top 3, admin alert on Telegram if one is rejected | `app/server/anticheat.ts`, table `games` |
| Automated tests (26): engine determinism, anti-cheat, initData, holder boost, Solana helpers | `npm --prefix app test` |
| Sticker pack (8) · meme kit (5) · banner 1500×500 · avatar · token logo | [t.me/addstickers/jeetslapper_by_JeetSlapperGameBot](https://t.me/addstickers/jeetslapper_by_JeetSlapperGameBot), `brand/` |
| Code on GitHub | https://github.com/AlbertVicente08/JeetSlapperGameBot |
| Monthly cost | €0 (Cloudflare Pages + Supabase + Groq free tiers) |

### Prepared for the token (dormant until `TOKEN_MINT` is set)
| What | Status |
|---|---|
| Connect Phantom (signature-verified, one wallet per account) | ✅ works now: Ranking → Connect Phantom → `/wallet/` page inside Phantom |
| Holder Boost x2.5 (≥100k) / x5 (≥500k), 30-min maturation, drops when selling | ✅ code ready, reads balances via Helius once the mint is set |
| Bonding-curve bar in the game | ✅ code ready, validated against a live pump.fun token |
| Graduation Jackpot rules published | ✅ `/rules/` section 4 |
| pump.fun / DexScreener banner + logo | ✅ `brand/banner-1500x500.png`, `brand/token-logo-1000.jpg` |

---

## 🔴 Your to-do (I can't do these for you)

- [ ] **Make the GitHub repo private** (Settings → Danger Zone → Change visibility). It has no secrets, but the anti-cheat thresholds are visible.
- [ ] **Save `.env` in a password manager** (Bitwarden, 1Password…).
- [ ] **Create the project X account** (e.g. `@JeetSlapperGame`) and send me the handle — see `blueprint/05_COMMUNITY_GROWTH_PLAN.md`.
- [ ] **BotFather → /mybots → Bot Settings → Configure Mini App** → `https://jeet-slapper.pages.dev/play/` (direct link `t.me/JeetSlapperGameBot?startapp` + Telegram app search).
- [ ] **Bot permissions in the channel**: it needs **"Post messages"** to publish the weekly results.
- [ ] **Play a game from your phone** to test the new version end to end.
- [ ] **Week 1 of the growth plan**: X bios + pinned thread, chat rules + anti-spam bot, invite 10–20 friends.
- [ ] **Buy a few Telegram Stars** for the weekly 🥇 Telegram Gift (or change the prize in `app/src/prizes.ts`).

## 🟡 Next ideas (not started)
- [ ] Seasons (reset all-time every 6–8 weeks, keep a Hall of Fame).
- [ ] Telegram Stars cosmetics (skins) — Phase 3 of the growth plan.
- [ ] Admin page to review suspicious games (today: SQL below).

---

## 🚀 Token launch-day checklist (only if the gate in the growth plan is passed)

1. Check the SOL price and fund a **clean** Phantom wallet (see `04_TACTICAL_LAUNCH_PLAN.md`).
2. Create the token on pump.fun: name `Jeet Slapper`, ticker `JSLAP`, image `brand/token-logo-1000.jpg`, website `https://jeet-slapper.pages.dev`, Telegram `https://t.me/RealBertoBcn`, X = project account. Dev buy as announced.
3. Set the mint everywhere:
   ```bash
   npx wrangler pages secret put TOKEN_MINT --project-name jeet-slapper
   ```
   then redeploy:
   ```bash
   npm --prefix app run deploy
   ```
   The bonding-curve bar and the Holder Boost switch on automatically.
4. Publish the CA **only** in the channel (pinned) and on the landing page (add it to `app/index.html`, token section).
5. Create the public prize wallet (Squads multisig, ideally with 1–2 independent co-signers) and publish its address.
6. Claim the DexScreener profile with the banner and links.

---

## ⚪ Deliberately changed from Antigravity's plan

| Original plan | Now | Why |
|---|---|---|
| Next.js 14 on Vercel | Vite + React on Cloudflare Pages | Vercel's free tier forbids commercial use |
| Upstash Redis, QuickNode, Gemini | Not used | Supabase + Helius + Groq are enough |
| Energy: 20 per game, 100 max | **Unlimited games** | Your decision |
| Secret alpha group, coordinated raids | Public beta, no raids | Market-manipulation risk (MiCA) and reputation |
| Fixed 0.5 SOL graduation reward, Raydium | Current creator fees, PumpSwap | pump.fun changed |
| Holder Boost after 1 h | 30 minutes | Your decision |
| Public roast naming sellers + −50% points | Not done: losing the boost is enough | Naming individuals publicly is harassment-adjacent and bad PR |
| 10% passive score share for referrals | Squad Boost +10% per friend (max +50%) | Simpler and harder to farm |
| Spanish | **Everything public in English** | Global crypto community |

## ⚠️ Known limits
- **Anti-cheat**: a bot that perfectly imitates a human (~300 ms, with mistakes) could pass, but only with a human-level score. Always review the top before giving prizes.
- **Supabase free pauses after 7 days without activity**: if nobody plays for a week the leaderboard stops until you click "Restore" on supabase.com.
- **Free tiers**: Cloudflare 100,000 requests/day, Supabase 500 MB, Groq rate limits (the bot falls back to built-in lines).
- **Token**: more than 98% of pump.fun tokens never graduate. Treat the €100 as risk capital.

---

## Useful commands

```bash
npm --prefix app run dev
```
Game locally without the API: http://localhost:5173/play/

```bash
npm --prefix app test
```
Run the 26 tests.

```bash
npm --prefix app run deploy
```
Publish to https://jeet-slapper.pages.dev

Review suspicious games (Supabase SQL editor):
```sql
select created_at, telegram_id, score, status, reason, replayed, stats
from public.games where status <> 'ok' order by created_at desc limit 50;
```

Regenerate brand assets / sticker pack:
```bash
powershell -File brand\source\render.ps1
```
```bash
powershell -File brand\source\upload-stickers.ps1
```
