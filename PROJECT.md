# Project: Solana Pump.fun Low-Cost Crypto Blueprint & MVP

## Architecture
- **Ecosystem**: Solana Blockchain, Pump.fun deterministic bonding curve ($k = 3.219 \times 10^{25}$), PumpSwap DEX.
- **Client & Interface**: Telegram Mini App (TMA) built with Next.js 14 / Vite + React, Tailwind CSS, Telegram WebApp SDK (`@twa-dev/sdk`), Solana Mobile Wallet Adapter.
- **Serverless Backend**: Cloudflare Pages Edge Runtime, Serverless Telegram Webhooks with HMAC-SHA256 signature validation.
- **Zero-Cost Storage & Cache**: Supabase Free Tier (500MB PostgreSQL) + Upstash Redis Free Tier (10,000 cmds/day) for leaderboards and user profiles.
- **RPC & Data Feeds**: Multi-provider failover engine (Helius Free 1M credits + QuickNode Discover 10M credits + Solana Public/Ankr RPCs).
- **AI Inference Engine**: Free cascade (Groq Cloud Llama 3.1 8B @ 14,400 RPD + Google Gemini Flash @ 1,500 RPD + algorithmic degen roast fallback).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Comparative Evaluation Matrix | Benchmark 3 concepts (AI Agent, Utility Bot, Memecoin + Micro-dApp) across 4 metrics (virality, cost <=10€/mo, dev complexity, pump.fun fit) | M1 | R1, C1 |
| F2 | Selection Justification | Deep argument why Category C ("JEET SLAPPER") wins under ~100€ capital constraint | M1 | R1, C1 |
| F3 | Winning Project Lore & Identity | Concept specification: "JEET SLAPPER" ($JSLAP), Crypto Twitter narrative, viral hooks, visual styling | M1 | R2, C2 |
| F4 | Bonding Curve Tokenomics | Mathematical model: 1B supply, 800M curve, 200M DEX, dev buy (0.50 SOL = 1.74% supply), 0% tax, 85 SOL graduation, LP burn, creator rewards | M1 | R2, C2 |
| F5 | Retention & Anti-Dump Engine | Wallet-linked Holding Multiplier (2.5x-5x), Graduation Jackpot (1.5% dev reserve), Telegram viral referral flywheel | M1 | R2, C2 |
| F6 | Zero-Cost Infrastructure Stack | Serverless topology, component inventory, cost audit demonstrating exact 0.00€/month recurring expense | M1 | R3, C3 |
| F7 | Multi-Provider Failover Engines | TypeScript implementations for resilient RPC failover and Groq/Gemini AI inference cascading | M1 | R3, C3 |
| F8 | Serverless Telegram Webhook & Security | Edge API route with HMAC-SHA256 Telegram `initData` cryptographic verification | M1 | R3, C3 |
| F9 | Executable AI Prompt Suite | 6 production-ready prompts (Scaffolding, Webhook, RPC/Curve, AI Persona, Mini App UI, Deployment) for Cursor/Claude/ChatGPT | M1 | R3, C3 |
| F10 | Setup & Deployment Playbook | Step-by-step instructions for zero-cost API provisioning, GitHub Actions CI/CD, and Cloudflare Pages hosting | M1 | R3, C3 |
| F11 | Exact ~100€ Financial Breakdown | Detailed capital allocation in SOL (0.714 SOL @ 140€/SOL): 0.020 SOL rent, 0.500 SOL buy, 0.030 SOL gas, 0.164 SOL safety reserve + sensitivity matrix | M1 | R4, C4 |
| F12 | T-48h to T-0h Launch Timeline | 3-phase chronological pre-launch schedule: public beta, public meme toolkit, public opening, voice chat, block 0 atomic create+buy | M1 | R4, C4 |
| F13 | Post-Launch Bonding Curve Milestones | Tactical progression: 0-25% (Spark), 25-50% (King of Hill), 50-85% (Graduation Rush), 100% PumpSwap graduation and LP burn | M1 | R4, C4 |
| F14 | Contingency & Anti-Jeet Tactics | Handling volume dips, copycats, FUD, automated chat roasts, transparent dev holding rules | M1 | R4, C4 |
| F15 | Peer Technical Review & Verification | Rigorous review by 2 independent reviewers on completeness, feasibility, and correctness | M2 | Acceptance Gates |
| F16 | Adversarial Challenge & Stress-Testing | Empirical validation by 2 challengers: curve math, RPC limits, prompt execution, security audits | M2 | Acceptance Gates |
| F17 | Forensic Integrity Audit | Systematic integrity audit by forensic auditor ensuring authentic, zero-cost, genuine delivery | M3 | Audit Mandate |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Blueprint Production | Author all 4 deliverables + Index in `c:\Users\alber\..Proyectos\crypto\blueprint` (F1-F14) | Survey | DONE (5 comprehensive deliverables authored & hardened) |
| M2 | Review & Adversarial Verification | 2 Reviewers + 2 Challengers verify deliverables against C1-C4 (F15-F16) | M1 | DONE (Reviewer 1, Reviewer 2, Challenger 1, Challenger Re-verifier all APPROVE) |
| M3 | Forensic Integrity Audit | Forensic Auditor verifies genuine implementation and integrity checks (F17) | M2 | DONE (Auditor 1 and Auditor Re-verifier certified CLEAN) |

## Interface Contracts
### Blueprint Deliverables ↔ Acceptance Criteria
- `c:\Users\alber\..Proyectos\crypto\blueprint\01_COMPARATIVE_ANALYSIS.md` satisfies R1 & C1.
- `c:\Users\alber\..Proyectos\crypto\blueprint\02_PROJECT_SPECIFICATION.md` satisfies R2 & C2.
- `c:\Users\alber\..Proyectos\crypto\blueprint\03_TECHNICAL_ARCHITECTURE_AND_PROMPTS.md` satisfies R3 & C3.
- `c:\Users\alber\..Proyectos\crypto\blueprint\04_TACTICAL_LAUNCH_PLAN.md` satisfies R4 & C4.
- `c:\Users\alber\..Proyectos\crypto\blueprint\INDEX.md` provides Master Index, Executive Summary & Cross-References.

## Code Layout
```
c:\Users\alber\..Proyectos\crypto\
├── .agents\teamwork\                 # Orchestrator & agent metadata
│   ├── ORIGINAL_REQUEST.md
│   ├── orchestrator_1\
│   ├── explorer_survey_1\
│   ├── explorer_survey_2\
│   ├── explorer_survey_3\
│   ├── worker_1\
│   ├── reviewer_1\
│   ├── reviewer_2\
│   ├── challenger_1\
│   ├── challenger_2\
│   └── auditor_1\
├── PROJECT.md                        # Master project index & feature inventory
└── blueprint\                        # Deliverables directory (Owned by Workers)
    ├── INDEX.md                      # Executive summary & navigation
    ├── 01_COMPARATIVE_ANALYSIS.md     # R1 / C1 deliverable
    ├── 02_PROJECT_SPECIFICATION.md   # R2 / C2 deliverable
    ├── 03_TECHNICAL_ARCHITECTURE_AND_PROMPTS.md # R3 / C3 deliverable
    └── 04_TACTICAL_LAUNCH_PLAN.md    # R4 / C4 deliverable
```
