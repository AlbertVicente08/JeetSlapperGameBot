# BRIEFING — 2026-10-15T12:20:00Z

## Mission
Exhaustive specification analysis of pump.fun and Solana token mechanics tailored to a budget of ~100€.

## 🔒 My Identity
- Archetype: specification-miner
- Roles: PumpFun and Solana Protocol Spec Miner
- Working directory: c:\Users\alber\..Proyectos\crypto\.agents\teamwork\explorer_survey_1
- Original parent: ffe17c80-7775-4e46-b7f5-5d417b9c4009
- Milestone: Exploration & Protocol Specification Mining

## 🔒 Key Constraints
- Exhaustive specification analysis of pump.fun and Solana token mechanics tailored to ~100€ budget
- Do NOT implement anything — read-only spec mining
- Enumerate full interfaces, formulas, constants, edge cases
- Strict table format for Discovered Features and Edge Cases
- All handoff and progress in designated directory: c:\Users\alber\..Proyectos\crypto\.agents\teamwork\explorer_survey_1

## Current Parent
- Conversation ID: ffe17c80-7775-4e46-b7f5-5d417b9c4009
- Updated: 2026-10-15T12:20:00Z

## Task Summary
- **What to build**: Comprehensive protocol specification report on pump.fun bonding curve mechanics, Solana token fees, dev initial buy curves, migration triggers, and ~100€ budget financial model.
- **Success criteria**: Exact constants, bonding curve formulas, slippage and dev buy calculations, migration economics, 100€ budget allocation down to lamports/cents, edge cases identified.
- **Interface contracts**: c:\Users\alber\..Proyectos\crypto\.agents\teamwork\ORIGINAL_REQUEST.md
- **Code layout**: c:\Users\alber\..Proyectos\crypto\.agents\teamwork\explorer_survey_1\handoff.md

## Key Decisions Made
- Fully documented pump.fun Anchor contract ID `6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P`.
- Derived exact bonding curve invariant $k = 3.219 \times 10^{25}$, proving initial virtual reserves of 30 SOL and 1.073B tokens.
- Established the "Golden Credibility Zone" for dev holding at 1.5% to 3.0% of total supply (acquired with 0.43 to 0.87 SOL). Holding >5% triggers sniper alerts and rug warnings.
- Formulated single-transaction atomic `create` + `buy` pattern that achieves 100% MEV protection without paying Jito bundle tips.
- Documented August 2024 creator incentive update (0.5 SOL reward at graduation) and March 2025 PumpSwap native AMM graduation with 0.05% creator volume share.
- Developed an exact capital allocation model for 100€ (0.7143 SOL at 140€/SOL): 0.020 SOL rent, 0.500 SOL dev buy (17.42M tokens = 1.742% supply), 0.030 SOL gas/priority buffer, 0.1643 SOL operational cushion.

## Artifact Index
- DISPATCH.md — Initial dispatch message
- progress.md — Real-time progress and heartbeat
- handoff.md — Comprehensive protocol specification report
