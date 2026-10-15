# Progress — PumpFun and Solana Protocol Spec Miner

- **Last visited**: 2026-10-15T12:18:00Z
- **Status**: Comprehensive Specification and Mathematical Modeling Complete
- **Current Task**: Writing comprehensive specification report (`handoff.md`) with Features Discovered and Edge Cases tables.

## Task Checklist
- [x] Workspace initialized and dispatch registered
- [x] BRIEFING.md established
- [x] Researched & verified pump.fun smart contract details (Anchor program ID: `6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P`, account layouts, instruction definitions: `create`, `buy`, `sell`)
- [x] Researched & verified bonding curve constants and formula:
  - Initial virtual SOL reserves: 30 SOL ($30 \times 10^9$ lamports)
  - Initial virtual token reserves: 1,073,000,000 tokens ($1.073 \times 10^{15}$ raw units)
  - Real token reserves on curve: 793,100,000 tokens (79.31%)
  - Tokens reserved for DEX liquidity: 206,900,000 tokens (20.69%)
  - Total supply: 1,000,000,000 (1B) with 6 decimals
  - $k = 3.219 \times 10^{25} \text{ lamports} \cdot \text{raw tokens}$
  - Migration threshold: 85 SOL collected (~$69,000 market cap)
- [x] Researched & verified protocol evolution & updates:
  - August 2024 update: Free token creation for deployer (cost shifted to 1st buyer; if dev buys in create tx, dev pays ~0.02 SOL rent + buy amount), 0.5 SOL creator graduation reward
  - March 2025 update: Native PumpSwap AMM graduation alongside legacy Raydium CPMM, zero migration fee friction, LP burn, ongoing 0.05% creator volume share
- [x] Dev initial buy mathematical modeling:
  - Analytical and Python verification for 0.05 to 1.0 SOL
  - Exact token acquisition: 0.50 SOL -> 17,417,117.56 tokens (1.742% of 1B supply, 2.196% of curve)
  - Golden credibility zone analysis (1.5% - 3.0% total supply optimal to prevent sniper red flags)
  - Value trajectory across curve milestones: 0.5 SOL buy reaches 6.67 SOL at 85 SOL graduation (13.34x ROI) + 0.5 SOL reward = 7.17 SOL (14.34x total)
- [x] Solana transaction & rent mechanics:
  - Base fee (5,000 lamports), compute budget priority fees (25,000 lamports)
  - Rent exemption breakdowns for Mint (0.00146 SOL), Metadata (0.00562 SOL), ATA (0.00204 SOL), Curve PDA
  - Atomic single-transaction create + buy (100% MEV sandwich protection without Jito tip overhead)
- [x] Comprehensive financial breakdown for ~100€ budget:
  - Rate analysis at 130€, 140€, 150€, 160€ / SOL, plus spot sensitivity at ~93€ / SOL
  - Exact allocation table down to lamports and cents
- [ ] Write `handoff.md`
- [ ] Update BRIEFING.md
- [ ] Notify caller via `send_message`
