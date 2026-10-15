// Minimal wrapper of the Telegram Mini Apps SDK (loaded in play/index.html).
// Outside Telegram everything is a no-op, so the game also works in a normal browser.

interface TgWebApp {
  initData: string
  initDataUnsafe?: { user?: { id: number; first_name?: string; username?: string } }
  colorScheme?: 'light' | 'dark'
  ready(): void
  expand(): void
  openTelegramLink?(url: string): void
  openLink?(url: string): void
  HapticFeedback?: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void
    notificationOccurred(type: 'error' | 'success' | 'warning'): void
  }
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TgWebApp }
  }
}

const wa = (): TgWebApp | undefined => {
  const app = window.Telegram?.WebApp
  // The script defines WebApp even outside Telegram; empty initData = normal browser
  return app && app.initData ? app : undefined
}

export const BOT = 'JeetSlapperGameBot'

export const inTelegram = () => !!wa()

/** initData signed by Telegram; the server validates it to know who is playing. */
export const initData = () => wa()?.initData ?? ''

export const userId = () => wa()?.initDataUnsafe?.user?.id ?? null

/** Personal invite link (the bot records the referral on /start). */
export const inviteLink = () => {
  const id = userId()
  return id ? `https://t.me/${BOT}?start=ref_${id}` : `https://t.me/${BOT}`
}

export function initTelegram() {
  const app = wa()
  if (!app) return
  app.ready()
  app.expand()
}

/** Opens a link: t.me links inside Telegram, the rest in the browser. */
export function openLink(url: string) {
  const app = wa()
  if (app?.openTelegramLink && url.startsWith('https://t.me/')) return app.openTelegramLink(url)
  if (app?.openLink) return app.openLink(url)
  window.open(url, '_blank', 'noopener')
}

export function playerName(): string {
  const u = wa()?.initDataUnsafe?.user
  return u?.username ? `@${u.username}` : (u?.first_name ?? 'Anon Degen')
}

export const haptic = {
  hit: () => wa()?.HapticFeedback?.impactOccurred('medium'),
  heavy: () => wa()?.HapticFeedback?.impactOccurred('heavy'),
  error: () => wa()?.HapticFeedback?.notificationOccurred('error'),
  success: () => wa()?.HapticFeedback?.notificationOccurred('success'),
}
