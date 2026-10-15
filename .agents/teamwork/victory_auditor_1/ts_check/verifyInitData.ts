import crypto from 'crypto';

export interface TelegramUserData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export function verifyTelegramWebAppData(
  telegramInitData: string,
  botToken: string,
  maxAgeSeconds: number = 86400
): { isValid: boolean; user: TelegramUserData | null; error?: string } {
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

    const paramsList: string[] = [];
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
    const user: TelegramUserData | null = userRaw ? JSON.parse(userRaw) : null;

    return { isValid: true, user };
  } catch (err: any) {
    console.error('[verifyTelegramWebAppData] Verification error:', err);
    return { isValid: false, user: null, error: err?.message || 'Verification exception' };
  }
}
