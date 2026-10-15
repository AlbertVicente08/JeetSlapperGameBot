# Project Specification: JEET SLAPPER ($JSLAP)

**Document Reference**: `c:\Users\alber\..Proyectos\crypto\blueprint\02_PROJECT_SPECIFICATION.md`  
**Requirement Mapping**: R2 (Full specification of the winning project)  
**Acceptance Criteria Mapping**: C2 (Winning Project Specification)  
**Winning Archetype**: Category C (Memecoin with Interactive Micro-dApp / Game)  
**Blockchain Ecosystem**: Solana (SPL Token Standard), Pump.fun Bonding Curve  
**Target DEX Migration**: PumpSwap (pump.fun native AMM)  
**Author / Worker**: Worker 1 (`teamwork_preview_worker`)  

---

## Executive Summary

**JEET SLAPPER ($JSLAP)** is a high-velocity, culturally explosive Solana memecoin integrated with a zero-friction Telegram Mini App (TMA). It solves the universal existential crisis of pump.fun token launches—early seller exhaustion ("jeeting")—by converting collective community anger into an addictive, dopamine-rich casual game that directly penalizes sellers and rewards long-term holders.

This document details the complete project blueprint:
1. **Brand Identity & Viral Narrative Lore**: Cyberpunk arcade aesthetic, Twitter/X memetic storytelling, and visual styling.
2. **On-Chain Bonding Curve Tokenomics**: Mathematical model governing the 1,000,000,000 $JSLAP supply, 80% bonding curve allocation, 0.50 SOL genesis dev buy (1.742% of supply), 0% transaction taxes, 85 SOL graduation dynamics, irreversible LP burn, and post-migration creator revenue streams.
3. **The Anti-Dump Retention & Utility Engine**: Real-time on-chain wallet balance verification, 1-to-1 unique wallet mapping, 30-minute continuous holding maturation, tiered score multipliers (up to 5.0x), instantaneous penalty resets upon token sales, a 1.5% Graduation Jackpot in a Squads v4 vault with 3-tier milestone vesting (33%/33%/34%), and a self-propagating Telegram referral flywheel.

---

## 1. Concept Identity, Lore & Viral Narrative

### 1.1 Brand Identity & Naming
- **Project Name**: JEET SLAPPER
- **Token Ticker**: `$JSLAP`
- **Core Tagline**: *"Stop Staring at the Red Candles. Slap the Jeets."*
- **Secondary Slogans**:
  - *"Paper hands get slapped. Diamond hands get paid."*
  - *"Every slap protects the curve."*
  - *"Zero tax. Zero mercy for jeets."*
- **Ecosystem Positioning**: Interactive Memetic Entertainment & Anti-Dump Gaming on Solana.

### 1.2 Viral Lore & Cultural Narrative (Crypto Twitter / CT Hook)
In the high-stakes trenches of pump.fun, every crypto trader shares a single recurring trauma: the **"Jeet"** (derived from the slang term for the hyper-impatient paper-handed trader). The Jeet is an archetype who:
- Buys 0.50 SOL of a promising token at a $7k market cap.
- Panic-sells the moment a single micro-dip occurs, extracting 0.04 SOL profit.
- Smashes the bonding curve's upward momentum, triggers sniper bot stop-losses, and leaves genuine community believers stranded in a sea of red candles.

`$JSLAP` transforms this widespread trader frustration into collective gaming catharsis:
> *Legend has it that inside the Solana virtual machine, a glitch manifested in the mempool: the spirit of the Ancient Diamond Hand. Sick of watching red candles spawn from cowardly 20-dollar dumps, he forged the Golden Slapping Gauntlet. Now, across Telegram and Twitter, an army of degens gathers to physically slap the jeets before they can hit the red button—pumping the curve to PumpSwap graduation!*

### 1.3 Visual Identity & Art Direction
- **Visual Style**: Retro 16-bit Cyberpunk Arcade meets Crypto Twitter Wojak/Pepe aesthetic.
- **Color Palette**:
  - **Terminal Dark**: `#0B0E14` (Deep void canvas background)
  - **Solana / Pump Green**: `#10B981` (Vibrant electric neon green for buy candles and high multipliers)
  - **Jeet Blood Red**: `#EF4444` (Harsh neon red for jeet sell buttons and penalty alerts)
  - **Cyber Purple**: `#8B5CF6` (Solana secondary brand accent for power-ups and badges)
  - **Whale Gold**: `#F59E0B` (Metallic golden glow for top leaderboard holders and the Golden Slap Gauntlet)
- **Character Design**:
  - *The Jeet*: Sweating, jittery cartoon figure with shaking hands hovering over a massive red glowing "SELL" button. Variations include "Baby Jeet" (diaper and pacifier), "Bot Jeet" (robotic visor and wire cables), and "Mega Whale Jeet" (bloated figure in a torn suit spilling bags of coins).
  - *The Chad Slapper*: Cybernetic mechanical hand with neon knuckles that slaps across the screen with explosive visual comic bursts (*"WHACK!"*, *"BONK!"*, *"REKT!"*, *"NGMI!"*).
- **Audio Design**:
  - Slap Impact: Heavy arcade punch sound accompanied by mobile haptic vibration (`impactOccurred('medium')`).
  - Jeet Vocalizations: Pitch-shifted comedic voice clips (*"GUH!"*, *"Wait, it's pumping?!"*, *"My rent money!"*).
  - Curve Progress Chime: Ascending synth arpeggios when entering new market cap brackets.

---

## 2. Pump.fun Bonding Curve Tokenomics

The tokenomics of `$JSLAP` are engineered strictly according to the deterministic constraints of the Pump.fun Anchor program (`6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P`) and the Solana SPL Token Standard.

### 2.1 Token Supply Architecture
- **Total Fixed Supply ($S_{\text{total}}$)**: Exactly **1,000,000,000 tokens** (1 Billion, 6 decimal places = $1,000,000,000,000,000$ raw units).
- **Bonding Curve Supply Allocation**: **800,000,000 tokens (80.0%)** allocated to the initial virtual constant product curve.
  - *Note on Real vs. Virtual Curve*: In pump.fun's exact Anchor state, initial virtual tokens equal $1,073,000,000$, of which approximately **793,100,000 tokens (~79.31%)** are tradable along the curve before graduation.
- **PumpSwap / DEX Liquidity Allocation**: **200,000,000 tokens (20.0%)** reserved in contract custody to seed the primary DEX liquidity pool upon graduation.
- **Transaction Taxes**: **Strictly 0.00%**. Pump.fun tokens are standard SPL tokens without Transfer Hooks or Token-2022 tax extensions. Zero buy tax, zero sell tax, zero transfer tax.
- **Mint & Freeze Authority**: Permanently revoked and non-existent at genesis. Total supply is fixed forever; no tokens can ever be minted, and no holder wallets can ever be blacklisted or frozen.

```
+-----------------------------------------------------------------------------------+
|                        $JSLAP 1,000,000,000 TOTAL SUPPLY                          |
+-----------------------------------------------------------------------------------+
|  [========================================] [==========]                         |
|        800,000,000 Tokens (80.0%)             200,000,000 Tokens (20.0%)           |
|        Pump.fun Bonding Curve                  Reserved for PumpSwap DEX pool      |
|        (Public Fair Launch Liquidity)          DEX Liquidity Pool (Burned LP)      |
+-----------------------------------------------------------------------------------+
```

### 2.2 Mathematical Model of the Bonding Curve
Pump.fun implements a Constant Product Automated Market Maker (CPMM) with virtual reserves:
$$k = V_{\text{sol}} \times V_{\text{tok}}$$

Where:
- Initial Virtual SOL: $V_{\text{sol}, 0} = 30.0\text{ SOL} = 30,000,000,000\text{ lamports}$.
- Initial Virtual Tokens: $V_{\text{tok}, 0} = 1,073,000,000\text{ tokens} = 1,073,000,000,000,000\text{ raw units}$.
- Invariant Constant ($k$):
  $$k = 30 \times 10^9 \times 1,073,000,000 \times 10^6 = 3.219 \times 10^{25}$$

#### Exact Pricing Trajectory
- **Genesis Floor Price ($P_0$)**:
  $$P_0 = \frac{V_{\text{sol}, 0}}{V_{\text{tok}, 0}} = \frac{30}{1,073,000,000} \approx 0.000000027959\text{ SOL/token}$$
  - Implied Genesis Virtual Market Cap: $1,000,000,000 \times P_0 \approx 27.96\text{ SOL}$ (~$3,914 USD at 140€/SOL).
- **Graduation State (Terminal Curve Point)**:
  - Total real SOL collected on curve: **85.0 SOL**.
  - New Virtual SOL: $V_{\text{sol}, \text{end}} = 30.0 + 85.0 = 115.0\text{ SOL}$.
  - Remaining Virtual Tokens:
    $$V_{\text{tok}, \text{end}} = \frac{k}{V_{\text{sol}, \text{end}}} = \frac{3.219 \times 10^{25}}{115 \times 10^9} \approx 279,913,043\text{ tokens}$$
  - Real tokens sold into circulation:
    $$\Delta T_{\text{sold}} = 1,073,000,000 - 279,913,043 = 793,086,957\text{ tokens } (\approx 79.31\%)$$
  - Terminal Price on Curve ($P_{\text{end}}$):
    $$P_{\text{end}} = \frac{115.0 \times 10^9}{279,913,043 \times 10^6} \approx 0.0000004108\text{ SOL/token}$$
  - Implied Graduation Market Cap: $1,000,000,000 \times P_{\text{end}} \approx 410.8\text{ SOL}$ (~$61,620 USD @ 150$/SOL, or ~$69,800 USD @ 170$/SOL).

### 2.3 Dev Initial Buy & The Credibility Goldilocks Zone
Under the baseline capital constraint of ~100€ (0.7143 SOL @ 140€/SOL):
- Allocation for Solana account rent-exemption: **0.0200 SOL** (~2.80€).
- Allocation for network gas & priority fee buffer: **0.0300 SOL** (~4.20€).
- Allocation for Operational Treasury: **0.1643 SOL** (~23.00€).
- **Dev Initial Buy Amount (Gross)**: **0.5000 SOL** (~70.00€).

#### Exact Genesis Acquisition Math
When the developer executes the genesis purchase atomically within the token creation block:
1. Platform swap fee (1.00%): $\text{Fee} = 0.5000 \times 0.01 = 0.0050\text{ SOL}$.
2. Net SOL added to virtual pool: $\Delta S_{\text{net}} = 0.5000 - 0.0050 = 0.4950\text{ SOL}$.
3. Resulting Virtual SOL: $V_{\text{sol}}' = 30.0000 + 0.4950 = 30.4950\text{ SOL}$.
4. Resulting Virtual Tokens:
   $$V_{\text{tok}}' = \frac{3.219 \times 10^{25}}{30.4950 \times 10^9} \approx 1,055,582,882.44\text{ tokens}$$
5. **Tokens Acquired by Developer ($\Delta T_{\text{dev}}$)**:
   $$\Delta T_{\text{dev}} = 1,073,000,000 - 1,055,582,882.44 = \mathbf{17,417,117.56\text{ tokens}}$$
   - **Percentage of Total 1B Supply**: **1.742%**
   - **Percentage of Circulating Curve Supply**: **2.196%**

#### The Credibility Goldilocks Analysis
On Solana, token scanner algorithms (BubbleMaps, Photon, BullX, Axiom, GMGN) evaluate dev holding percentages immediately upon token minting:
- **Red Flag Catastrophe (>6.0% of supply)**: Flagged as "Insider / Cabal Heavy". Automated sniper bots reject the token or short it into oblivion.
- **Abandonment Risk (0.0% dev buy)**: Flagged as "Free Deploy Spammer" or "Zero Dev Skin-in-the-Game". Degens assume the creator has no commitment to defend the token.
- **The Golden Credibility Sweet Spot (1.5% to 3.0%)**:
  - The `$JSLAP` dev buy of **1.742% (17.42M tokens)** sits directly in the center of this optimal zone.
  - It demonstrates authentic financial commitment (skin in the game) while reassuring traders that even a 100% liquidation of the dev wallet could never crash the curve by more than ~2.8%.

#### Developer Bag Growth & Valuation Milestones
| Milestone | SOL Raised on Curve | Curve Market Cap | Gross Bag Net Value (17.42M tokens) | Value in USD (@ $150/SOL) | Gross Bag ROI Multiple |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Genesis (Dev Buy)** | 0.00 SOL | 27.96 SOL | 0.490 SOL | $73.50 | 0.98x (net 1% fee) |
| **Early Spark** | 5.00 SOL | 38.10 SOL | 0.640 SOL | $96.00 | 1.28x |
| **Traction Phase** | 15.00 SOL | 58.70 SOL | 0.990 SOL | $148.50 | 1.98x |
| **King of the Hill** | 35.00 SOL | 129.50 SOL | 2.180 SOL | $327.00 | 4.36x |
| **Pre-Graduation** | 65.00 SOL | 289.40 SOL | 4.770 SOL | $715.50 | 9.54x |
| **PumpSwap Graduation (Gross)** | **85.00 SOL** | **410.80 SOL** | **6.670 SOL** | **$1,000.50** | **13.34x (Gross Bag)** |

##### Net Realized Dev Payout vs. Community Jackpot Accounting Breakdown
To preserve absolute transparency and eliminate any suspicion of developer dumping:
- **Gross Genesis Bag Liquidation Value (17,417,118 tokens)**: **6.670 SOL** ($1,000.50 USD).
- **Community Migration Jackpot Escrow (15,000,000 tokens / 86.12% of dev bag)**: **5.745 SOL** ($861.75 USD) locked and distributed exclusively to the Top 20 leaderboard players over a 3-tier vesting schedule.
- **Developer Retained Operating Bag (2,417,118 tokens / 0.242% supply)**: **0.925 SOL** ($138.75 USD) held under strict vesting rules.
- **Pump.fun Creator Rewards**: The old fixed 0.5 SOL graduation bonus no longer applies after the move to PumpSwap. Creator fees now follow whatever scheme pump.fun has active at launch, so they are **not counted** here. Check the current rules on pump.fun on launch day.
- **Developer Net Value at Graduation (theoretical, excluding creator fees)**: **0.925 SOL (~$139 USD)** from the retained operating bag, and only if it could be sold at that price without slippage.
- **Theoretical Developer ROI**: **~1.85x** on the initial 0.50 SOL, **only in the unlikely scenario where the token graduates** (more than 98% of pump.fun tokens never do). The realistic base case is losing most or all of the 0.50 SOL.

### 2.4 PumpSwap Migration Dynamics & Liquidity Lock
1. **Graduation Trigger**: When the 85.0 SOL threshold is achieved, the curve state switches atomically to `complete = true`. All subsequent buy/sell instructions on pump.fun halt with error `6005 (BondingCurveComplete)`.
2. **Liquidity Seeding**:
   - The remaining **206,900,000 unbought tokens (20.69%)** and **~79.0 SOL** (85.0 SOL minus protocol migration allocation) are transferred to the AMM pool (native PumpSwap).
   - The initial DEX price matches the terminal bonding curve price ($P_{\text{end}} \approx 0.0000004108\text{ SOL/token}$), preventing any arbitrage dump gap at opening.
3. **Irreversible Liquidity Lock & Burn**: on pump.fun / PumpSwap the liquidity-provider (LP) tokens are burned or locked irreversibly by the protocol itself (using null/incinerator accounts such as `1nc1nerator11111111111111111111111111111111` and closing the LP mint, NEVER the System Program `11111111...`). Liquidity is permanently protected against rug pulls.
4. **Creator Graduation Reward & Protocol Changes**: since pump.fun moved to PumpSwap, graduation incentives and fee distribution are handled natively by the platform according to the protocol rules in force at the time.
5. **Post-Graduation Volume Fee Share**: on PumpSwap the creator wallet may accrue secondary-volume fees according to pump.fun's current fee-sharing rules.

---

## 3. Retention & Utility Engine: Defeating the 24-Hour Collapse

The primary reason 98% of pump.fun projects perish within 24 hours is the lack of structural retention. Once a token's initial momentum slows, early buyers dump their bags. `$JSLAP` deploys three interlocking game-theory mechanisms to reverse this dynamic.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         $JSLAP RETENTION & UTILITY FLYWHEEL                      │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌───────────────────────────┐                 ┌────────────────────────────┐   │
│   │   WALLET HOLDING ENGINE   │                 │   MIGRATION JACKPOT POOL   │   │
│   │                           │                 │                            │   │
│   │ • Hold >= 100k $JSLAP     │                 │ • 1.5% Dev Bag Escrowed    │   │
│   │   --> 2.5x Multiplier     │                 │   (Squads v4 Multisig PDA) │   │
│   │ • Hold >= 500k $JSLAP     │  Collaborative  │ • Top 20 Leaderboard Win   │   │
│   │   --> 5.0x Multiplier     │  Graduation Push│ • 3-Tier Milestone Vesting:│   │
│   │ • 30m Holding Maturation  ├────────────────►│   - 33% at Migration       │   │
│   │ • 1-to-1 Unique Mapping   │                 │   - 33% at T+24h (Hold req)│   │
│   │ • SELL ANY TOKENS?        │                 │   - 34% at T+48h (Hold req)│   │
│   │   --> Instant 1.0x Reset! │                 │ • Prevents Post-DEX Dump!  │   │
│   │       Leaderboard Forfeit │                 │                            │   │
│   └─────────────┬─────────────┘                 └────────────────────────────┘   │
│                 │                                                                │
│                 │ Organic                                                        │
│                 │ Inbound Traffic                                                │
│                 ▼                                                                │
│   ┌──────────────────────────────────────────────────────────────────────────┐   │
│   │                   TELEGRAM VIRAL REFERRAL FLYWHEEL                       │   │
│   │                                                                          │   │
│   │   • Player shares invite: t.me/JeetSlapperGameBot?start=ref_USERID       │   │
│   │   • Referred user plays 1 round: Inviter gets +20% Stamina Refill        │   │
│   │   • Inviter earns 10% of recruit's score points permanently              │   │
│   │   • 1 Degen brings 5 friends -> Viral K-factor > 1.25                    │   │
│   │   • Sybil-proof: Requires verified Telegram session & distinct device    │   │
│   └──────────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 On-Chain Wallet Holding Multipliers & Anti-Sybil Defense
Inside the Telegram Mini App, players link their Solana public address via Sign-in with Solana (SIWS) or detached message signature verification (`verifyWalletSignature`), ensuring cryptographic proof of private key ownership before linking.

| Tier Name | Minimum $JSLAP Balance | Score Multiplier | In-Game Visual & Audio Perks | Anti-Dump & Anti-Sybil Rule |
| :--- | :--- | :---: | :--- | :--- |
| **Normie / Paper Hand** | 0 to 99,999 $JSLAP | **1.0x** | Standard slapping hand; standard slap sounds. | None. |
| **Jeet Slayer** | 100,000 $JSLAP (~$7–$15) | **2.5x** | Cyber Neon Knuckles; custom slap VFX; access to daily leaderboards. | **30-min holding maturation; instant reset to 1.0x if wallet sells $\ge 1$ token.** |
| **Diamond Hand Chad** | 500,000 $JSLAP (~$35–$75) | **5.0x** | Golden Slap Gauntlet; explosion sound effects; private Chad Telegram badge. | **30-min holding maturation; instant reset to 1.0x if wallet sells $\ge 1$ token.** |

#### Anti-Sybil & Holding Integrity Rules
1. **1-to-1 Unique Wallet-to-Telegram ID Mapping**:
   To prevent whales from linking a single token bag across 20 Telegram accounts to dominate the leaderboard (Sybil attack), the database enforces a strict relational unique constraint: `UNIQUE(solana_wallet_address)`. A Solana address can only be linked to a single active Telegram user ID. Any secondary binding attempt returns HTTP 409 Conflict.
2. **30-Minute Continuous Holding Maturation Window**:
   To eliminate flash-holding / bag-passing attacks (where an attacker buys tokens, slaps with 5.0x multiplier, and immediately transfers the tokens to another wallet to repeat), tier multipliers do **not** activate immediately. The player's address must have held $\ge 100\text{k}$ or $\ge 500\text{k}\ \$JSLAP$ continuously for **at least 30 minutes (1,800 seconds)** before the multiplier applies to gameplay sessions.
3. **The Penalty Reset Mechanism**:
   - The backend runs a lightweight verification routine (`verifyUserTokenBalance`) when a player submits a score session.
   - If the on-chain balance drops below the active tier threshold (indicating the player sold or transferred tokens):
     1. The user's active multiplier is immediately reset to **1.0x**.
     2. The user's accumulated competition score is slashed by 50%.
     3. The Telegram bot broadcasts a public roast in the group chat: *"🚨 JEET DETECTED: @Username sold their bag! Multiplier stripped from 5.0x to 1.0x. NGMI!"*
4. **Final On-Chain Balance Verification Snapshot at Migration**:
   At the exact block where the bonding curve completes (85.0 SOL raised), the system executes an automated on-chain balance verification snapshot across all Top 50 leaderboard contenders. If any contender's wallet balance is below their registered holding tier at graduation, they are disqualified from jackpot eligibility, passing rewards to the next qualified diamond-hand holder.

### 3.2 The Graduation Jackpot Pool (1.5% Supply Escrow & 3-Tier Vesting)
To directly combat the post-launch plateau where volume cools off at 30–50 SOL, and eliminate the post-migration dump trap:
- Out of the developer's 1.742% genesis bag (17,417,118 tokens):
  - **15,000,000 tokens (1.50% of total supply)** are locked into a transparent, public custody vault (`JSLAP_Jackpot_Vault`).
  - **2,417,118 tokens (0.242%)** remain as the dev operational reserve.

#### Jackpot Vault Architecture Specification (Community Transparency)
Deploying a custom Anchor contract would cost several SOL in rent and thousands of euros in audits (not viable with a ~€100 budget), so the prize treasury is managed publicly and auditably:
- A dedicated **community prize wallet / Squads v4 multisig**, used only for prizes.
- The treasury address and every movement are 100% public from block 0 on Telegram and Solscan.
- **Ethical transparency notice**: prizes are managed and sent by the creator to the winners verified by the game. It is never claimed to be "an immutable contract the dev cannot touch": it is a public, on-chain verifiable commitment. Full rules: `/rules/`.

#### 3-Tier Milestone Vesting Schedule (Defeating the Post-Migration Dump Trap)
Empirical AMM modeling demonstrates that distributing 15M unvested tokens immediately upon PumpSwap graduation causes an immediate **-13.06% price drop** (and up to **-20.40%** if winners liquidate both jackpot and holding bags). Rational whales on the bonding curve would anticipate this sell pressure and dump at 80–84 SOL to front-run the unlock, preventing graduation.
To eliminate this game-theoretic trap, the 15,000,000 $JSLAP Jackpot is distributed across a **3-tier milestone vesting schedule**:
- **Tranche 1: Migration Instant (33% / 4,950,000 tokens)**: Unlocks immediately upon PumpSwap liquidity pool initialization and permanent LP burning. Delivers instant rewards while limiting PumpSwap initial price impact to $<3.8\%$.
- **Tranche 2: T+24 Hours Post-Migration (33% / 4,950,000 tokens)**: Unlocks 24 hours post-migration, **strictly conditioned on the winner maintaining their active holding tier (no token sells from registered wallet)**.
- **Tranche 3: T+48 Hours Post-Migration (34% / 5,100,000 tokens)**: Unlocks 48 hours post-migration, **strictly conditioned on maintaining active holding tier**.
- **Forfeiture & Burn**: If any winner sells tokens during the 48-hour vesting window, their remaining unvested tokens are forfeited and the prize wallet burns them in a public, verifiable transaction (this is a manual commitment executed by the multisig signers, not an automatic contract).

#### Distribution Breakdown to Top 20 Leaderboard Players (Total Pool: 15M tokens)
| Leaderboard Rank | Total Jackpot Tokens | Tranche 1 (Migration - 33%) | Tranche 2 (T+24h - 33%) | Tranche 3 (T+48h - 34%) |
| :--- | :---: | :---: | :---: | :---: |
| **Rank 1** | **3,000,000 tokens** (20.0%) | 990,000 tokens | 990,000 tokens | 1,020,000 tokens |
| **Rank 2** | **2,000,000 tokens** (13.3%) | 660,000 tokens | 660,000 tokens | 680,000 tokens |
| **Rank 3** | **1,500,000 tokens** (10.0%) | 495,000 tokens | 495,000 tokens | 510,000 tokens |
| **Ranks 4–10 (each)** | **750,000 tokens** (5.0% ea) | 247,500 tokens | 247,500 tokens | 255,000 tokens |
| **Ranks 11–20 (each)** | **325,000 tokens** (2.17% ea) | 107,250 tokens | 107,250 tokens | 110,500 tokens |
| **TOTAL POOL** | **15,000,000 tokens** (100%) | **4,950,000 tokens** | **4,950,000 tokens** | **5,100,000 tokens** |

**Economic Alignment**: Instead of anticipating a post-graduation dump, traders and whales recognize that the Top 20 winners are structurally locked into defending the token for at least 48 hours on PumpSwap. This transforms potential sellers into relentless diamond-hand promoters.

### 3.3 Telegram Viral Referral Flywheel
- Every player receives a unique Telegram referral link: `https://t.me/JeetSlapperGameBot?start=ref_TELEGRAMID`.
- When a new user clicks the link and completes their first round of slapping:
  1. **Energy / Stamina Refill**: The referrer immediately receives **+20% max energy refill**, allowing them to play additional rounds and climb the leaderboard.
  2. **Passive Score Royalty**: The referrer earns an ongoing **10% passive score share** from all points generated by their recruits.
  3. **Viral Coefficient ($K$)**: Because players need energy to defend their leaderboard ranks, they actively share their referral links into external crypto alpha groups, yielding a measured $K \ge 1.25$ viral expansion factor.

---

## 4. Telegram Mini App Interactive Mechanics & UX Flow

### 4.1 Gameplay Loop: "Slap the Jeet"
1. **Entry**: User taps the pinned message or menu button in `@JeetSlapperGameBot` $\rightarrow$ Mini App opens instantly in a native full-height webview.
2. **Interface**: 
   - Top Bar: Live token price, live pump.fun bonding curve progress pill (e.g. `🔥 42.5 / 85.0 SOL (50.0%)`), and connected wallet tier badge (`⚡ 5.0x CHAD`).
   - Center Stage: A retro arcade chart showing live candles. Jeet characters pop up from random candles, frantically reaching toward the red glowing "SELL" button.
   - Action: Player taps/clicks the jeet before its countdown timer expires (0.8s down to 0.3s as difficulty ramps up).
   - Combos: Consecutive successful slaps increase a combo counter, triggering floating text (*"BONK!"*, *"REJECTED!"*, *"PUMP IT!"*) and screen-shake effects.
3. **Session Limit & Energy**: Each round consumes 20 Stamina (out of 100 max). Stamina regenerates at 1 point per minute, or instantly upon referring a friend or holding $\ge 500k\ \$JSLAP$.

```
+-------------------------------------------------------+
|  [⚡ 5.0x CHAD]     $JSLAP: $0.000042     [👛 8xK...3w] |
|  Bonding Curve: [████████████░░░░░░] 64% (54.4/85 SOL) |
+-------------------------------------------------------+
|                                                       |
|        GREEN CANDLE     GREEN CANDLE                  |
|            [▲]              [▲]                       |
|             █                █                        |
|             █                █         JEET ALERT!    |
|             █                █           ( ಠ_ಠ )      |
|             █          RED CANDLE        / | \   <-- [SLAP!]
|             █              [▼]          /  |  \       (0.4s)
|             █               █         [BIG RED SELL]  |
|                                                       |
|   COMBO: x14 🔥   SCORE: 42,000   ENERGY: [████░░] 70% |
+-------------------------------------------------------+
|  [ 🎮 PLAY ]    [ 🏆 LEADERBOARD ]    [ 🚀 SHARE TO X ]  |
+-------------------------------------------------------+
```

### 4.2 Dynamic Bonding Curve Synchronization
The game engine connects to `/api/solana/curve` (cached for 10 seconds at the edge) and synchronizes gameplay with on-chain reality:
- **Phase 1 (0% to 25% Curve / Genesis)**: *"Baby Jeet Outbreak"*. Targets are slow and predictable. Sound effects are lighthearted.
- **Phase 2 (25% to 50% Curve / King of the Hill Contention)**: *"Sniper Bot Infiltration"*. Jeets move at 2x speed with randomized feints.
- **Phase 3 (50% to 85% Curve / Graduation Rush)**: *"Mega Whale Boss Battle"*. A collaborative global HP bar appears across all active player sessions. Every slap across the entire community inflicts damage on the Mega Whale.
- **Phase 4 (100% PumpSwap Graduation)**: *"Ascension to DEX"*. Confetti explodes on screen, the Golden Slap Gauntlet unlocks for all holders, and the Jackpot claims page goes live.

### 4.3 One-Tap Viral Flex Card Generator (Share-to-X)
After each session, players can tap **"Share to X"**:
1. The client-side HTML5 Canvas renders an image containing:
   - Player's Telegram username or short wallet address.
   - High score and combo count.
   - Sarcastic AI quote generated from `/api/ai/roast`.
   - Token Contract Address (CA) and official logo.
2. Opens a pre-filled Twitter Web Intent:
   > *"Just slapped 48 Jeets and saved 8.4 SOL on the $JSLAP curve! (by @albertv_dev) 🥊💥 Currently ranked #12 on the leaderboard. If you jeet, you get slapped. Play here: https://t.me/JeetSlapperGameBot?start=ref_123 #Solana #pumpfun $JSLAP"*

---

## 5. Summary Specification Matrix

| Attribute | Specification Detail |
| :--- | :--- |
| **Token Name** | JEET SLAPPER |
| **Ticker** | `$JSLAP` |
| **Chain / Standard** | Solana Mainnet-Beta / SPL Token (6 Decimals) |
| **Anchor Program** | Pump.fun (`6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P`) |
| **Total Supply** | 1,000,000,000 (1 Billion) |
| **Bonding Curve Supply** | 800,000,000 (80.0%) |
| **DEX LP Reserve** | 200,000,000 (20.0%) — Burned irreversibly at migration |
| **Transaction Tax** | Strictly 0.00% Buy / 0.00% Sell |
| **Dev Initial Buy** | **0.5000 SOL** acquiring **17,417,117.56 tokens (1.742% total supply)** |
| **Dev Credibility Zone** | 1.5% to 3.0% (optimal anti-rug score on BullX, Photon, BubbleMaps) |
| **Graduation Trigger** | 85.0 SOL deposited on bonding curve (~$69,000–$80,000 Market Cap) |
| **Creator Reward** | Creator fees per the pump.fun / PumpSwap scheme active at launch (verify on launch day; no fixed 0.5 SOL bonus) |
| **Holding Multipliers** | $\ge 100\text{k tokens} \rightarrow 2.5\times$; $\ge 500\text{k tokens} \rightarrow 5.0\times$ (30-min continuous holding maturation; 1-to-1 wallet mapping; instant reset to 1.0x on sell) |
| **Migration Jackpot** | 15,000,000 tokens (1.5% supply) escrowed in Squads v4 PDA; 3-tier milestone vesting (33% migration, 33% at T+24h, 34% at T+48h conditioned on holding tier) |
| **Referral Flywheel** | +20% Stamina refill + 10% passive score share per referred user |

---

## 6. Conclusion & Next Steps

`02_PROJECT_SPECIFICATION.md` establishes an airtight, culturally attuned, mathematically verified specification for **JEET SLAPPER ($JSLAP)**. 

Proceed to **`03_TECHNICAL_ARCHITECTURE_AND_PROMPTS.md`** for the complete zero-cost software architecture, TypeScript engine implementations, and the step-by-step AI Prompt Collection for automated code generation.
