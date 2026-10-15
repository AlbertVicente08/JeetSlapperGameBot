"""
Script to analyze milestone values in Table 2.3
"""
from decimal import Decimal

k = Decimal("3.219e25")
v_sol_0 = Decimal("30e9")
dev_tokens = Decimal("17417117.5603")

milestones = [
    ("Genesis", Decimal("0.00"), Decimal("27.96"), Decimal("0.490")),
    ("Early Spark", Decimal("5.00"), Decimal("38.10"), Decimal("0.640")),
    ("Traction Phase", Decimal("15.00"), Decimal("58.70"), Decimal("0.990")),
    ("King of the Hill", Decimal("35.00"), Decimal("129.50"), Decimal("2.180")),
    ("Pre-Graduation", Decimal("65.00"), Decimal("289.40"), Decimal("4.770")),
    ("Raydium Migration", Decimal("85.00"), Decimal("410.80"), Decimal("6.670")),
]

print("Analyzing Table 2.3 formulas...")
for name, sol_raised, t_mcap, t_val in milestones:
    # If sol_raised is net on curve:
    v_sol = Decimal("30") + sol_raised
    v_tok = Decimal("32190000000") / v_sol # in whole tokens
    price = v_sol / v_tok
    mcap_1b = Decimal("1000000000") * price
    mcap_curve = Decimal("793086957") * price
    
    # What if sol_raised was virtual SOL ratio?
    # What if price formula was P = (v_sol)^2 / k?
    # Notice: price = v_sol / v_tok = v_sol / (k / v_sol) = (v_sol)^2 / k!
    # So mcap_1b = 10^9 * (v_sol)^2 / (30 * 1.073 * 10^9) = (v_sol)^2 / 32.19!
    # Let's check:
    # For v_sol = 30: 30^2 / 32.19 = 900 / 32.19 = 27.959 SOL! (Table: 27.96 SOL)
    # For v_sol = 35: 35^2 / 32.19 = 1225 / 32.19 = 38.055 SOL! (Table: 38.10 SOL)
    # For v_sol = 45: 45^2 / 32.19 = 2025 / 32.19 = 62.907 SOL! (Table: 58.70 SOL)
    # For v_sol = 65: 65^2 / 32.19 = 4225 / 32.19 = 131.25 SOL! (Table: 129.50 SOL)
    # For v_sol = 95: 95^2 / 32.19 = 9025 / 32.19 = 280.36 SOL! (Table: 289.40 SOL)
    # For v_sol = 115: 115^2 / 32.19 = 13225 / 32.19 = 410.84 SOL! (Table: 410.80 SOL)
    
    print(f"\n{name} (Raised {sol_raised} SOL):")
    print(f"  v_sol: {v_sol} SOL")
    print(f"  Calculated Mcap (1B): {mcap_1b:.2f} SOL | Table Mcap: {t_mcap} SOL")
    print(f"  Calculated Curve Mcap: {mcap_curve:.2f} SOL")
    print(f"  Ratio Table/Calc Mcap: {t_mcap / mcap_1b:.4f}")
    
    # Check Dev Bag valuation:
    # Table val:
    # Ratio Table val / Table Mcap:
    print(f"  Table Val: {t_val} SOL | Table Val / Table Mcap: {t_val / t_mcap:.5f}")
    dev_tokens_units = dev_tokens # in whole tokens
    spot_val = dev_tokens_units * price
    print(f"  Dev tokens * Calc Price: {spot_val:.4f} SOL")
    print(f"  Table Val / Dev Bag (17.417M): {t_val / (dev_tokens / Decimal('1000000')):.10f} SOL/token")
