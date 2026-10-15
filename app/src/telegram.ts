// Envoltorio mínimo del SDK de Telegram Mini Apps (cargado en index.html).
// Fuera de Telegram todo es no-op, así el juego funciona en un navegador normal.

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
  // El script define WebApp aunque no estemos dentro de Telegram; initData vacío = navegador normal
  return app && app.initData ? app : undefined
}

export const inTelegram = () => !!wa()

/** initData firmado por Telegram; el servidor lo valida para saber quién juega. */
export const initData = () => wa()?.initData ?? ''

export function initTelegram() {
  const app = wa()
  if (!app) return
  app.ready()
  app.expand()
}

/** Abre un enlace: los t.me dentro de Telegram, el resto en el navegador. */
export function openLink(url: string) {
  const app = wa()
  if (app?.openTelegramLink && url.startsWith('https://t.me/')) return app.openTelegramLink(url)
  if (app?.openLink) return app.openLink(url)
  window.open(url, '_blank', 'noopener')
}

export function playerName(): string {
  const u = wa()?.initDataUnsafe?.user
  return u?.username ? `@${u.username}` : u?.first_name ?? 'Anon Degen'
}

export const haptic = {
  hit: () => wa()?.HapticFeedback?.impactOccurred('medium'),
  heavy: () => wa()?.HapticFeedback?.impactOccurred('heavy'),
  error: () => wa()?.HapticFeedback?.notificationOccurred('error'),
  success: () => wa()?.HapticFeedback?.notificationOccurred('success'),
}
