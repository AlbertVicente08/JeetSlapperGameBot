// Validación del initData de Telegram Mini Apps (HMAC-SHA256), con WebCrypto.
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app

export interface TgUser {
  id: number
  first_name?: string
  username?: string
}

const enc = new TextEncoder()

async function hmac(key: BufferSource, data: string): Promise<ArrayBuffer> {
  const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return crypto.subtle.sign('HMAC', k, enc.encode(data))
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
}

/** Comparación en tiempo constante para no filtrar información por tiempos. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/**
 * Devuelve el usuario si el initData es auténtico y reciente; si no, null.
 * maxAgeSec: antigüedad máxima de auth_date (por defecto 24 h).
 */
export async function verifyInitData(
  initData: string,
  botToken: string,
  maxAgeSec = 86_400,
  nowSec = Math.floor(Date.now() / 1000),
): Promise<TgUser | null> {
  if (!initData || !botToken) return null
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) return null
  params.delete('hash')

  const dataCheckString = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n')

  const secret = await hmac(enc.encode('WebAppData'), botToken)
  const expected = toHex(await hmac(secret, dataCheckString))
  if (!safeEqual(expected, hash.toLowerCase())) return null

  const authDate = Number(params.get('auth_date'))
  if (!authDate || nowSec - authDate > maxAgeSec) return null

  try {
    const user = JSON.parse(params.get('user') ?? '') as TgUser
    return typeof user.id === 'number' ? user : null
  } catch {
    return null
  }
}
