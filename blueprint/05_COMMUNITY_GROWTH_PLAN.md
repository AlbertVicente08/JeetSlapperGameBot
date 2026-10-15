# Community Growth Plan — BertoBCN × Jeet Slapper

**Last updated**: 2026-10-16 · **Language of everything public: English** (the crypto community is global).

**Starting point**
- Personal X account: **BertoBCN** (`@albertv_dev`), ~0 followers.
- Telegram: channel [t.me/RealBertoBcn](https://t.me/RealBertoBcn) (only you post) + linked discussion chat.
- Product: **Jeet Slapper**, a Telegram game with a global leaderboard, weekly tournament, boosts and anti-cheat ([@JeetSlapperGameBot](https://t.me/JeetSlapperGameBot), [jeet-slapper.pages.dev](https://jeet-slapper.pages.dev)).
- Assets ready in `brand/`: avatar, banner (1500×500), 8 stickers ([sticker pack](https://t.me/addstickers/jeetslapper_by_JeetSlapperGameBot)), 5 memes, score cards generated in-game.

---

## 0. The idea

> **The asset is the audience, not the token.** Every project (game, bot, token, whatever comes next) exists to bring people into *your* community, and the community launches the next project.

```
   X (2 accounts)          Telegram                    Projects
 ┌──────────────────┐    ┌─────────────────────┐    ┌──────────────────────┐
 │ @albertv_dev      │    │ Channel (you post)  │    │ Jeet Slapper (now)   │
 │  = the builder    │──► │ Chat (people talk)  │──► │ $JSLAP (maybe later) │
 │ @JeetSlapper*     │    │ Bot (/start, /roast)│    │ Next projects…       │
 │  = the product    │    └─────────────────────┘    └──────────────────────┘
 └──────────────────┘              ▲                            │
          ▲                        └── weekly results, boosts ──┤
          └────────── score cards, invites, memes, clips ◄──────┘
```

- **X is discovery**: people find you there, but the algorithm owns them.
- **Telegram is ownership**: your messages reach them without an algorithm. The **Community Boost x1.5** (being in the channel) is the bridge.
- **Projects give a reason to stay** and are how you monetize.

### Two X accounts, two jobs

| | **@albertv_dev (BertoBCN)** — personal | **Project account** (create it: e.g. `@JeetSlapperGame`) |
|---|---|---|
| Voice | You, first person, builder | The game, fun, memes |
| Content | Build in public, numbers, lessons, opinions, replies | Clips, memes, weekly results, records, tournaments, updates |
| Goal | Trust and a personal brand that outlives any token | Players and virality |
| Links to | Telegram channel | The bot (`t.me/JeetSlapperGameBot`) and the channel |

Why two: if one day a project fails (or a token dumps), your personal brand doesn't die with it. The project account can be loud and meme-heavy; your account stays credible.

**Setting up the project account** (you have to do it, I can't create accounts):
- Handle: `@JeetSlapperGame` (or `@JeetSlapperBot`, `@SlapTheJeets` if taken).
- Avatar: `brand/bot-avatar-640.jpg` · Header: `brand/banner-1500x500.png`.
- Bio: *"Slap the jeets 👋💥 Free arcade game on Telegram · Weekly tournament 🏆 · Built by @albertv_dev"* · Link: `t.me/JeetSlapperGameBot`.
- When it exists, tell me the handle and I'll add it to the game, landing and bot.

---

## Phase 1 — Seed (weeks 1–4): 0 → 100 real players

**Goal**: 100 people who played at least once, 30 who come back, the first 3 weekly tournaments closed.

### Week 1: set everything up
- [ ] **@albertv_dev**: bio *"Building crypto & AI projects in public 🛠️ Now: Jeet Slapper, a Telegram game 🎮 Numbers, wins and fails 👇"*, link `t.me/RealBertoBcn`, banner, pinned intro thread (below).
- [ ] **Project X account** created and set up (above).
- [ ] **Channel**: 2-line description, pinned welcome post (what it is, the game, the x1.5 boost, rules link). Post the sticker pack.
- [ ] **Chat**: pinned short rules (no spam / no DMs from "admins" / not financial advice) + an anti-spam captcha bot (e.g. `@Rose` or `@Shieldy_bot`) + slow mode 10 s.
- [ ] **BotFather → Configure Mini App** with `https://jeet-slapper.pages.dev/play/` (direct link + Telegram app search).
- [ ] Invite **10–20 friends** personally to play and join the channel. Ask for honest feedback.

**Pinned intro thread (@albertv_dev)**
> 1/ I'm Berto from Barcelona. I'm going to build crypto & AI projects in public, with real numbers.
> 2/ First one: Jeet Slapper. A free arcade game on Telegram where you slap paper hands 🧻 and never touch diamond hands 💎. Global ranking, weekly tournament, anti-cheat. Cost to run: €0/month. [clip]
> 3/ I'll share everything: what works, what flops, what it costs.
> 4/ Daily updates and the tournament results live on Telegram 👉 t.me/RealBertoBcn

### Weeks 2–4: daily routine (45 min)

| What | How much | How |
|---|---|---|
| **Replies** on X (personal account) | 15–20/day | In crypto/Solana/Telegram-games/indie-hacker threads of accounts with 5k–50k followers. Add value (a data point, an experience, a good question). Never "great post 🔥". This is 70% of growth at 0 followers. |
| **Posts** | 1–2/day per account | Personal: build-in-public. Project: clip/meme/record. |
| **Telegram channel** | 1 post/day | Devlog, record of the day, poll, meme. |
| **Chat** | Be there | Greet newcomers by name, answer everything, ask questions. |

**Content pillars**
- *Personal (@albertv_dev)*: 40% build in public (screenshots, costs, mistakes) · 30% lessons (anti-cheat, Telegram Mini Apps, free stack) · 20% education/safety (how to spot a rug, how pump.fun curves work) · 10% opinion (never financial advice).
- *Project*: 40% gameplay clips (10–20 s, vertical, record your phone) · 30% memes (`brand/memes/`) · 20% leaderboard & records · 10% announcements.

**Calls to action**: 1 in 3–4 posts, always with a reason (*"This week's tournament results are on Telegram 👉"*). Put the link **in a reply to your own post**, not in the main post (X downranks outbound links).

**Weekly rhythm (automated parts already work)**
| Day | What |
|---|---|
| **Mon** | 🤖 The bot posts last week's top 10 in the channel automatically (00:05 UTC) and DMs you the winners. Repost the results on both X accounts with a meme. Deliver prizes after checking the games. |
| **Wed** | Devlog: what changed this week (channel + personal X). |
| **Fri** | Meme + "who can beat X points?" challenge. |
| **Sun** | "Last day of the tournament" reminder. |

**KPIs to check every Monday**: players (Supabase `players`), returning players (`games > 1`), weekly tournament players, channel members & views per post, X followers & profile link clicks.

---

## Phase 2 — Traction (months 2–3): 100 → 1,000 players

**Goal**: 1,000 players, 300 weekly active, channel 500+, a repeatable content engine.

- **Squad Boost push**: every player can share `/invite` (+10% per friend, max +50%). Remind it in the channel weekly; celebrate the top inviters.
- **Score cards**: encourage players to post their score card on X tagging the project account; repost the best ones every week.
- **Telegram directories**: list the Mini App in Telegram's app search (needs the Main Mini App set up), and directories like FindMini.app / tApps Center.
- **Collabs**: cross-promos with other small Telegram games and communities of similar size (shout-out for shout-out, joint tournaments). Ask before posting in other groups; `/roast` and `/slap` work in any group the bot is added to — a fun way in, with admin permission.
- **Live moments**: a monthly Telegram voice chat or X Space ("devlog + tournament live").
- **Seasons**: reset the all-time ranking every ~6–8 weeks ("Season 2") with a Hall of Fame for past champions. Fresh starts bring players back.
- **Stickers & memes**: add new ones from community ideas; credit the authors.

---

## Phase 3 — Community (months 3–6): 1,000 → 10,000

**Goal**: a community that talks without you prompting it, and the first income.

- **Monetization (only now)**, in this order:
  1. **Telegram Stars in the game** (cosmetics: skins, gauntlets, effects). Never pay-to-win in the weekly tournament.
  2. **Sponsors**: a sponsored weekly tournament (their logo + prize), clearly labelled.
  3. **Affiliates** for tools you actually use (wallets, exchanges, software), always disclosed (*"affiliate link"*).
- **Bigger prizes** funded by sponsors or Stars revenue.
- **Community roles**: 2–3 trusted members as chat moderators.
- **Next project**: ask the community in a poll. The channel is the launch pad.

---

## Phase 4 — Token (only if the gate is passed)

$JSLAP is **optional**. Launch it only if all of these are true for 4 weeks in a row:
- ≥ 1,000 weekly active players and ≥ 25% of them return the next week.
- ≥ 1,000 channel members with real engagement (views/post ≥ 30% of members).
- People in the chat ask for it without you pushing.

If it launches, follow `04_TACTICAL_LAUNCH_PLAN.md` and the launch checklist in `STATUS.md`. Everything technical is already prepared and dormant: Phantom linking, Holder Boost (30-minute maturation), bonding-curve bar, Graduation Jackpot rules. **Communication rules**: public fair launch, CA only in the channel and on the website, no private groups, no paid shills, risk warning on every post. More than 98% of pump.fun tokens never graduate: say it openly.

---

## Legal & ethics (EU / Spain)
- **Crypto ads (CNMV, Circular 1/2022)**: any promotion of crypto-assets needs a clear risk warning. Mass campaigns (audience > 100,000) must be notified to the CNMV 10 days before.
- **MiCA**: no market manipulation — no coordinated buys, no private "alpha" groups, no paid undisclosed promotion.
- **Ads & affiliates**: always label them (`#ad`, "affiliate link").
- **Prizes**: weekly prizes are free to enter (no purchase needed) — keep it that way. Rules at `/rules/`. Prizes with economic value may have tax implications; ask an advisor when they grow.
- **Privacy (GDPR)**: policy at `/privacy/`. Delete a player's data if they ask.
- **Never**: promise returns, buy followers/bots, run fake giveaways.

## Mistakes to avoid
1. Naming the channel after the token (if the token dies, the channel dies). ✅ Already avoided: the channel is BertoBCN.
2. Posting without replying (at 0 followers you're talking to nobody).
3. Asking without giving ("join my Telegram!" with no reason).
4. Leaving the chat alone (it fills with spam and dies).
5. Monetizing too early.
6. Promising anything about the token.
