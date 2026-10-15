from decimal import Decimal

sol_0 = Decimal("79.0")
tok_0 = Decimal("206913043.48")
k = sol_0 * tok_0
p_0 = sol_0 / tok_0

print(f"Initial Raydium Pool SOL:   {sol_0} SOL")
print(f"Initial Raydium Pool Tok:   {tok_0:,.2f} tokens")
print(f"Initial Price P_0:          {p_0:.12f} SOL/token")

def simulate_dump(dump_tokens, label):
    new_tok = tok_0 + dump_tokens
    new_sol = k / new_tok
    p_1 = new_sol / new_tok
    sol_extracted = sol_0 - new_sol
    price_impact_pct = ((p_0 - p_1) / p_0) * Decimal(100)
    print(f"\n[{label}] Dump {dump_tokens:,.0f} tokens:")
    print(f"  SOL Extracted:     {sol_extracted:.4f} SOL")
    print(f"  New Price P_1:     {p_1:.12f} SOL/token")
    print(f"  Price Impact Drop: -{price_impact_pct:.2f}%")
    return price_impact_pct, sol_extracted

simulate_dump(Decimal("15000000"), "Original Unvested 15M Lump-Sum Dump")
simulate_dump(Decimal("25000000"), "Original 15M Jackpot + 10M Whale Bags Dump")
simulate_dump(Decimal("4950000"),  "Remediated Tranche 1 (33% = 4.95M tokens)")
simulate_dump(Decimal("2145000"),  "Top 3 Winners Tranche 1 (2.145M tokens)")
