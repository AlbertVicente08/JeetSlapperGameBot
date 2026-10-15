from decimal import Decimal, ROUND_HALF_UP

weights = [
    Decimal("0.08"), Decimal("0.10"), Decimal("0.07"), Decimal("0.05"),
    Decimal("0.08"), Decimal("0.09"), Decimal("0.05"), Decimal("0.03"),
    Decimal("0.06"), Decimal("0.04"), Decimal("0.06"), Decimal("0.04"),
    Decimal("0.08"), Decimal("0.07"), Decimal("0.07"), Decimal("0.03")
]

cat_a = [
    Decimal("7.0"), Decimal("6.0"), Decimal("7.0"), Decimal("6.0"),
    Decimal("4.0"), Decimal("2.0"), Decimal("4.0"), Decimal("1.0"),
    Decimal("5.0"), Decimal("5.0"), Decimal("3.0"), Decimal("4.0"),
    Decimal("6.0"), Decimal("4.5"), Decimal("4.0"), Decimal("5.0")
]

cat_b = [
    Decimal("3.5"), Decimal("4.5"), Decimal("3.0"), Decimal("5.0"),
    Decimal("4.0"), Decimal("3.0"), Decimal("4.0"), Decimal("2.0"),
    Decimal("4.0"), Decimal("4.0"), Decimal("4.0"), Decimal("4.0"),
    Decimal("3.0"), Decimal("3.5"), Decimal("4.0"), Decimal("3.5")
]

cat_c = [
    Decimal("8.5"), Decimal("10.0"), Decimal("10.0"), Decimal("9.5"),
    Decimal("10.0"), Decimal("10.0"), Decimal("10.0"), Decimal("10.0"),
    Decimal("9.5"), Decimal("9.0"), Decimal("9.0"), Decimal("8.5"),
    Decimal("10.0"), Decimal("9.5"), Decimal("10.0"), Decimal("10.0")
]

assert sum(weights) == Decimal("1.00"), "Weights sum mismatch!"

score_a = sum(w * s for w, s in zip(weights, cat_a))
score_b = sum(w * s for w, s in zip(weights, cat_b))
score_c = sum(w * s for w, s in zip(weights, cat_c))

round_a = score_a.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
round_b = score_b.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
round_c = score_c.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

print(f"Cat A Weighted Score: {score_a:.4f} (Round half-up: {round_a})")
print(f"Cat B Weighted Score: {score_b:.4f} (Round half-up: {round_b})")
print(f"Cat C Weighted Score: {score_c:.4f} (Round half-up: {round_c})")

assert round_a == Decimal("4.75")
assert round_b == Decimal("3.71")
assert round_c == Decimal("9.63")
print("ALL SCORING ASSERTIONS PASSED!")
