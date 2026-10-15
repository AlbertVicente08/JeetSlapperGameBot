const crypto = require('crypto');

function verifyTelegramWebAppData(telegramInitData, botToken, maxAgeSeconds = 86400) {
  if (!telegramInitData || !botToken) {
    return { isValid: false, user: null, error: 'Missing initData or botToken' };
  }

  try {
    const urlParams = new URLSearchParams(telegramInitData);
    const hash = urlParams.get('hash');
    if (!hash) {
      return { isValid: false, user: null, error: 'Missing hash' };
    }

    const authDateStr = urlParams.get('auth_date');
    if (!authDateStr) {
      return { isValid: false, user: null, error: 'Missing auth_date' };
    }
    const authDate = parseInt(authDateStr, 10);
    const currentTime = Math.floor(Date.now() / 1000);
    if (isNaN(authDate) || currentTime - authDate > maxAgeSeconds || authDate > currentTime + 60) {
      return { isValid: false, user: null, error: 'Session expired or invalid auth_date' };
    }

    urlParams.delete('hash');

    const paramsList = [];
    Array.from(urlParams.keys())
      .sort()
      .forEach((key) => {
        paramsList.push(`${key}=${urlParams.get(key)}`);
      });
    const dataCheckString = paramsList.join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    const calculatedHashBuf = Buffer.from(calculatedHash, 'hex');
    const expectedHashBuf = Buffer.from(hash, 'hex');

    if (
      calculatedHashBuf.length !== 32 ||
      expectedHashBuf.length !== 32 ||
      !crypto.timingSafeEqual(calculatedHashBuf, expectedHashBuf)
    ) {
      return { isValid: false, user: null, error: 'Hash mismatch' };
    }

    const userRaw = urlParams.get('user');
    const user = userRaw ? JSON.parse(userRaw) : null;

    return { isValid: true, user };
  } catch (err) {
    return { isValid: false, user: null, error: err.message || 'Verification exception' };
  }
}

// Test harness
const botToken = '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11';
const userObj = { id: 987654321, first_name: 'Chad', username: 'chad_slapper' };

function makePayload(authDate, user, token, tamper = false) {
  const p = new URLSearchParams();
  p.set('auth_date', authDate.toString());
  p.set('user', JSON.stringify(user));
  
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
  const sorted = Array.from(p.keys()).sort().map(k => `${k}=${p.get(k)}`).join('\n');
  let hash = crypto.createHmac('sha256', secretKey).update(sorted).digest('hex');
  if (tamper) {
    hash = hash.slice(0, -2) + '00';
  }
  p.set('hash', hash);
  return p.toString();
}

const now = Math.floor(Date.now() / 1000);

// Scenario 1: Fresh valid payload
const fresh = makePayload(now - 10, userObj, botToken);
const res1 = verifyTelegramWebAppData(fresh, botToken);
console.log('1. Fresh valid payload:', res1.isValid ? 'PASS' : 'FAIL', res1);

// Scenario 2: Ancient payload (replay attack from 48h ago)
const ancient = makePayload(now - 172800, userObj, botToken);
const res2 = verifyTelegramWebAppData(ancient, botToken);
console.log('2. Expired replay rejected:', (!res2.isValid && res2.error.includes('expired')) ? 'PASS' : 'FAIL', res2);

// Scenario 3: Future timestamp attack (+120s)
const future = makePayload(now + 120, userObj, botToken);
const res3 = verifyTelegramWebAppData(future, botToken);
console.log('3. Future timestamp rejected:', (!res3.isValid && res3.error.includes('invalid auth_date')) ? 'PASS' : 'FAIL', res3);

// Scenario 4: Allowable clock skew (+30s)
const skew = makePayload(now + 30, userObj, botToken);
const res4 = verifyTelegramWebAppData(skew, botToken);
console.log('4. Allowable clock skew accepted:', res4.isValid ? 'PASS' : 'FAIL', res4);

// Scenario 5: Tampered hash
const tampered = makePayload(now, userObj, botToken, true);
const res5 = verifyTelegramWebAppData(tampered, botToken);
console.log('5. Tampered hash rejected:', (!res5.isValid && res5.error === 'Hash mismatch') ? 'PASS' : 'FAIL', res5);

// Scenario 6: Malformed short hash
const malformed = fresh.replace(/hash=[a-f0-9]{64}/, 'hash=1234');
const res6 = verifyTelegramWebAppData(malformed, botToken);
console.log('6. Short hash rejected cleanly:', (!res6.isValid && res6.error === 'Hash mismatch') ? 'PASS' : 'FAIL', res6);

// Scenario 7: Missing hash
const noHash = fresh.replace(/&hash=[a-f0-9]{64}/, '');
const res7 = verifyTelegramWebAppData(noHash, botToken);
console.log('7. Missing hash rejected:', (!res7.isValid && res7.error === 'Missing hash') ? 'PASS' : 'FAIL', res7);

// Scenario 8: Missing auth_date
const noAuth = `user=${encodeURIComponent(JSON.stringify(userObj))}&hash=abcd`;
const res8 = verifyTelegramWebAppData(noAuth, botToken);
console.log('8. Missing auth_date rejected:', (!res8.isValid && res8.error === 'Missing auth_date') ? 'PASS' : 'FAIL', res8);
