r"""
Detailed Edge-Case & Stress-Testing Script for Challenger 1
"""
from decimal import Decimal, getcontext
getcontext().prec = 50

LAMPORTS_PER_SOL = Decimal(10**9)
TOKEN_DECIMALS = Decimal(10**6)

INITIAL_VIRTUAL_SOL = Decimal(30) * LAMPORTS_PER_SOL
INITIAL_VIRTUAL_TOKENS = Decimal("1073000000") * TOKEN_DECIMALS
INVARIANT_K = INITIAL_VIRTUAL_SOL * INITIAL_VIRTUAL_TOKENS # 3.219e25

def test_exact_yields():
    amounts = [
        Decimal("0.40"),
        Decimal("0.42"),
        Decimal("0.45"),
        Decimal("0.50"),
        Decimal("0.55"),
        Decimal("0.60"),
        Decimal("0.80")
    ]
    
    print("=== EXACT YIELDS WITH 1% PROTOCOL FEE ===")
    for a in amounts:
        net_sol = a * Decimal("0.99")
        net_lamports = net_sol * LAMPORTS_PER_SOL
        new_v_sol = INITIAL_VIRTUAL_SOL + net_lamports
        new_v_tok = INVARIANT_K / new_v_sol
        tokens_raw = INITIAL_VIRTUAL_TOKENS - new_v_tok
        tokens = tokens_raw / TOKEN_DECIMALS
        
        pct_1b = (tokens / Decimal("1000000000")) * Decimal(100)
        pct_curve = (tokens / Decimal("793086956.521739")) * Decimal(100)
        
        print(f"Gross: {a:.2f} SOL | Net: {net_sol:.4f} SOL | Tokens: {tokens:,.4f} | 1B%: {pct_1b:.3f}% | Curve%: {pct_curve:.3f}%")

    print("\n=== EXACT YIELDS WITHOUT PROTOCOL FEE (RAW SOL TO CURVE) ===")
    for a in amounts:
        net_sol = a
        net_lamports = net_sol * LAMPORTS_PER_SOL
        new_v_sol = INITIAL_VIRTUAL_SOL + net_lamports
        new_v_tok = INVARIANT_K / new_v_sol
        tokens_raw = INITIAL_VIRTUAL_TOKENS - new_v_tok
        tokens = tokens_raw / TOKEN_DECIMALS
        
        pct_1b = (tokens / Decimal("1000000000")) * Decimal(100)
        pct_curve = (tokens / Decimal("793086956.521739")) * Decimal(100)
        
        print(f"Gross: {a:.2f} SOL | Tokens: {tokens:,.4f} | 1B%: {pct_1b:.3f}% | Curve%: {pct_curve:.3f}%")

def test_dust_and_extremes():
    print("\n=== STRESS-TESTING DUST & EXTREMES ===")
    extremes = [
        Decimal("0.000000001"), # 1 lamport
        Decimal("0.000001"),    # 1 micro-SOL
        Decimal("0.001"),       # 1 milli-SOL
        Decimal("1.0"),
        Decimal("10.0"),
        Decimal("85.0"),        # Full graduation in single buy
    ]
    for a in extremes:
        net_lamports = (a * Decimal("0.99")) * LAMPORTS_PER_SOL
        # Integer truncation simulation (as done on-chain by Anchor)
        int_net_lamports = int(net_lamports)
        int_new_v_sol = int(INITIAL_VIRTUAL_SOL) + int_net_lamports
        int_new_v_tok = int(INVARIANT_K) // int_new_v_sol
        tokens_raw = int(INITIAL_VIRTUAL_TOKENS) - int_new_v_tok
        tokens = Decimal(tokens_raw) / TOKEN_DECIMALS
        print(f"Input: {a:.9f} SOL | Raw Tokens: {tokens_raw} | Display Tokens: {tokens:.6f}")

if __name__ == "__main__":
    test_exact_yields()
    test_dust_and_extremes()
