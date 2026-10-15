from decimal import Decimal

# Baseline check
sol_rate = Decimal("140.00")
total_eur = Decimal("100.00")
total_sol = total_eur / sol_rate
total_lamports = int(total_sol * Decimal("1000000000"))

rent_lamports = 20_000_000
buy_lamports = 500_000_000
gas_lamports = 30_000_000
cushion_lamports = 164_285_714

sum_lamports = rent_lamports + buy_lamports + gas_lamports + cushion_lamports

print(f"Total SOL: {total_sol:.9f}")
print(f"Total Lamports from 100 EUR: {total_lamports}")
print(f"Sum of Components Lamports:  {sum_lamports}")
assert sum_lamports == total_lamports, "Lamports sum mismatch!"

rent_eur = (Decimal(rent_lamports) / Decimal("1000000000")) * sol_rate
buy_eur = (Decimal(buy_lamports) / Decimal("1000000000")) * sol_rate
gas_eur = (Decimal(gas_lamports) / Decimal("1000000000")) * sol_rate
cushion_eur = (Decimal(cushion_lamports) / Decimal("1000000000")) * sol_rate

sum_eur = rent_eur + buy_eur + gas_eur + cushion_eur
print(f"Rent EUR:    {rent_eur:.2f}")
print(f"Buy EUR:     {buy_eur:.2f}")
print(f"Gas EUR:     {gas_eur:.2f}")
print(f"Cushion EUR: {cushion_eur:.2f}")
print(f"Sum EUR:     {sum_eur:.2f}")
assert round(sum_eur, 2) == Decimal("100.00")

# Sensitivity Matrix Verification
scenarios = [
    ("Bullish SOL (160 EUR)", Decimal("160"), Decimal("0.0200"), Decimal("0.4200"), Decimal("0.0300"), Decimal("0.1550")),
    ("Conservative (150 EUR)", Decimal("150"), Decimal("0.0200"), Decimal("0.4500"), Decimal("0.0300"), Decimal("0.1667")),
    ("Baseline (140 EUR)", Decimal("140"), Decimal("0.0200"), Decimal("0.5000"), Decimal("0.0300"), Decimal("0.1643")),
    ("Favorable (130 EUR)", Decimal("130"), Decimal("0.0200"), Decimal("0.5500"), Decimal("0.0300"), Decimal("0.1692")),
    ("Spot Market (~93 EUR)", Decimal("93"), Decimal("0.0200"), Decimal("0.8000"), Decimal("0.0300"), Decimal("0.2253")),
]

print("\n--- Sensitivity Matrix Checks ---")
for name, rate, rent, buy, gas, cushion in scenarios:
    tot_sol = total_eur / rate
    comp_sum = rent + buy + gas + cushion
    diff = abs(tot_sol - comp_sum)
    print(f"{name:<24} | Available: {tot_sol:.4f} SOL | Allocated Sum: {comp_sum:.4f} SOL | Diff: {diff:.4f} SOL")
    assert diff < Decimal("0.0005"), f"Discrepancy in scenario {name}"

print("\nALL BUDGET VERIFICATION ASSERTIONS PASSED!")
