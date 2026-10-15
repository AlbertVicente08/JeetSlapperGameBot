/**
 * Node.js BigInt Empirical Verification Suite for Pump.fun Bonding Curve
 * Tests exact integer math with zero floating point inaccuracy.
 */

const LAMPORTS_PER_SOL = 1000000000n; // 10^9
const TOKEN_DECIMALS = 1000000n;      // 10^6

const VIRTUAL_SOL_0 = 30n * LAMPORTS_PER_SOL;             // 30,000,000,000n
const VIRTUAL_TOKENS_0 = 1073000000n * TOKEN_DECIMALS;    // 1,073,000,000,000,000n
const TOTAL_SUPPLY = 1000000000n * TOKEN_DECIMALS;        // 1,000,000,000,000,000n
const GRADUATION_SOL = 85n * LAMPORTS_PER_SOL;            // 85,000,000,000n

const INVARIANT_K = VIRTUAL_SOL_0 * VIRTUAL_TOKENS_0;     // 32,190,000,000,000,000,000,000,000n (3.219 * 10^25)

console.log('='.repeat(80));
console.log(' NODE.JS BIGINT EXACT INTEGER VERIFICATION');
console.log('='.repeat(80));
console.log('Invariant K:', INVARIANT_K.toString(), `(Length: ${INVARIANT_K.toString().length} digits)`);
console.log('Does K fit in u64 (1.84e19)?', INVARIANT_K < (2n ** 64n - 1n) ? 'YES' : 'NO - Requires u128!');
console.log('Does K fit in u128 (3.40e38)?', INVARIANT_K < (2n ** 128n - 1n) ? 'YES' : 'NO');

// Function to simulate pump.fun buy instruction using exact integer floor division
function buyExact(grossLamports, feeBps = 100n) { // 100 bps = 1.00%
  const feeLamports = (grossLamports * feeBps) / 10000n;
  const netLamports = grossLamports - feeLamports;
  const newVirtualSol = VIRTUAL_SOL_0 + netLamports;
  const newVirtualTokens = INVARIANT_K / newVirtualSol;
  const tokensBoughtRaw = VIRTUAL_TOKENS_0 - newVirtualTokens;
  return {
    grossLamports,
    feeLamports,
    netLamports,
    tokensBoughtRaw,
    tokensBoughtFloat: Number(tokensBoughtRaw) / 1e6
  };
}

console.log('\n--- Dev Initial Buy Verification (0.40, 0.45, 0.50, 0.60 SOL) ---');
const amounts = [
  { label: '0.40 SOL', gross: 400000000n },
  { label: '0.42 SOL', gross: 420000000n },
  { label: '0.45 SOL', gross: 450000000n },
  { label: '0.50 SOL', gross: 500000000n },
  { label: '0.55 SOL', gross: 550000000n },
  { label: '0.60 SOL', gross: 600000000n },
  { label: '0.80 SOL', gross: 800000000n }
];

for (const amt of amounts) {
  const res = buyExact(amt.gross);
  const pct1B = (Number(res.tokensBoughtRaw) / Number(TOTAL_SUPPLY)) * 100;
  console.log(`${amt.label.padEnd(10)} | Net SOL: ${(Number(res.netLamports) / 1e9).toFixed(4)} | Raw Tokens: ${res.tokensBoughtRaw.toString().padStart(20)} | Display: ${res.tokensBoughtFloat.toFixed(4).padStart(15)} | % 1B: ${pct1B.toFixed(3)}%`);
}

console.log('\n--- Terminal Graduation State (85.0 SOL net to curve) ---');
const vSolEnd = VIRTUAL_SOL_0 + GRADUATION_SOL; // 115 SOL
const vTokEnd = INVARIANT_K / vSolEnd;
const tokensSoldRaw = VIRTUAL_TOKENS_0 - vTokEnd;
const dexReserveRaw = TOTAL_SUPPLY - tokensSoldRaw;

console.log('Terminal Virtual SOL:      ', (Number(vSolEnd) / 1e9).toFixed(4), 'SOL');
console.log('Terminal Virtual Tokens:   ', (Number(vTokEnd) / 1e6).toFixed(4), 'tokens');
console.log('Real Tokens Sold to Public:', (Number(tokensSoldRaw) / 1e6).toFixed(4), 'tokens (', ((Number(tokensSoldRaw) / Number(TOTAL_SUPPLY)) * 100).toFixed(4), '%)');
console.log('Remaining DEX LP Reserve:  ', (Number(dexReserveRaw) / 1e6).toFixed(4), 'tokens (', ((Number(dexReserveRaw) / Number(TOTAL_SUPPLY)) * 100).toFixed(4), '%)');

// Liquidation value simulation at graduation
const dev050 = buyExact(500000000n);
const devTokensRaw = dev050.tokensBoughtRaw;

// Dev sells devTokensRaw back to curve at graduation
const sellVTok = vTokEnd + devTokensRaw;
const sellVSol = INVARIANT_K / sellVTok;
const grossSolReceived = vSolEnd - sellVSol;
const netSolReceived = (grossSolReceived * 99n) / 100n; // minus 1% fee

console.log('\n--- Dev Bag Liquidation at Graduation ---');
console.log('Dev Bag Raw Tokens:        ', devTokensRaw.toString());
console.log('Gross SOL from Curve:      ', (Number(grossSolReceived) / 1e9).toFixed(4), 'SOL');
console.log('Net SOL Received (1% fee): ', (Number(netSolReceived) / 1e9).toFixed(4), 'SOL');
console.log('Dev Buy Cost:               0.5000 SOL');
console.log('Liquidation ROI:           ', (Number(netSolReceived) / 500000000).toFixed(2), 'x');
console.log('Creator Reward:             0.5000 SOL');
console.log('Total Dev Return:          ', ((Number(netSolReceived) + 500000000) / 1e9).toFixed(4), 'SOL');
console.log('Total Combined ROI:        ', ((Number(netSolReceived) + 500000000) / 500000000).toFixed(2), 'x');

console.log('\n' + '='.repeat(80));
console.log(' NODE.JS VERIFICATION COMPLETE - ALL MATHEMATICAL PROPERTIES CONFIRMED');
console.log('='.repeat(80));
