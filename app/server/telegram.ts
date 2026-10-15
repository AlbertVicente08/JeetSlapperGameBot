// Telegram helpers: Mini App initData validation (HMAC-SHA256 with WebCrypto), Bot API calls
// and community membership checks.
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app

export interface TgUser {
  id: number
  first_name?: string
  username?: string
  /** start_param of the Mini App link (t.me/<bot>?startapp=ref_123), if any */
  startParam?: string
}

const enc = new TextEncoder()

async function hmac(key: BufferSource, data: string): Promise<ArrayBuffer> {
  const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return crypto.subtle.sign('HMAC', k, enc.encode(data))
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
}

/** Constant-time comparison, so timing doesn't leak information. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/**
 * Returns the user if initData is authentic and recent, otherwise null.
 * maxAgeSec: maximum age of auth_date (24 h by default).
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
    if (typeof user.id !== 'number') return null
    const startParam = params.get('start_param')
    return startParam ? { ...user, startParam } : user
  } catch {
    return null
  }
}

/** Calls a Bot API method. Returns the result, or null on error (errors are logged). */
export async function tg<T = unknown>(botToken: string, method: string, payload: unknown): Promise<T | null> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = (await res.json()) as { ok: boolean; result?: T; description?: string }
    if (!data.ok) {
      console.error(`Telegram ${method}: ${data.description}`)
      return null
    }
    return data.result ?? null
  } catch (e) {
    console.error(`Telegram ${method}`, e)
    return null
  }
}

/** "ref_123" -> 123 (referral codes from /start or startapp). */
export function parseReferral(param: string | undefined): number | null {
  const m = /^ref_(\d{1,15})$/.exec(param ?? '')
  return m ? Number(m[1]) : null
}

/**
 * BertoBCN main channel: being in it gives the Community Boost.
 * The bot must be an administrator of the channel to check membership.
 */
export const COMMUNITY_CHANNEL = '@RealBertoBcn'

/**
 * Is the user in the channel? true/false, or null if Telegram couldn't tell
 * (e.g. the bot is not an administrator of the channel).
 */
export async function isChannelMember(botToken: string, userId: number): Promise<boolean | null> {
  const member = await tg<{ status: string; is_member?: boolean }>(botToken, 'getChatMember', {
    chat_id: COMMUNITY_CHANNEL,
    user_id: userId,
  })
  if (!member) return null
  if (member.status === 'creator' || member.status === 'administrator' || member.status === 'member') return true
  if (member.status === 'restricted') return !!member.is_member
  return false
}

/** Escapes text for parse_mode HTML. */
export const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
