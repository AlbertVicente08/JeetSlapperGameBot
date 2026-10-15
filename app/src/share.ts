// Score card (image) and share links for X and Telegram.
import { inviteLink, openLink } from './telegram'

export interface CardData {
  name: string
  score: number
  slaps: number
  rank?: number | null
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** Draws a 1080x1080 score card and returns it as a PNG data URL. */
export async function drawScoreCard(d: CardData): Promise<string> {
  const size = 1080
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const ctx = c.getContext('2d')!
  await document.fonts.load('40px "Press Start 2P"').catch(() => undefined)
  const pixel = '"Press Start 2P", monospace'

  // Background: the SLAP artwork, darkened at the bottom for the text
  ctx.fillStyle = '#0b0716'
  ctx.fillRect(0, 0, size, size)
  try {
    const art = await loadImage('/slap.jpg')
    ctx.drawImage(art, 140, 20, 800, 800)
  } catch {
    /* without the image the card still works */
  }
  const grad = ctx.createLinearGradient(0, 520, 0, size)
  grad.addColorStop(0, 'rgba(11,7,22,0)')
  grad.addColorStop(0.45, 'rgba(11,7,22,0.95)')
  grad.addColorStop(1, '#0b0716')
  ctx.fillStyle = grad
  ctx.fillRect(0, 520, size, size - 520)

  ctx.textAlign = 'center'
  const text = (s: string, y: number, px: number, color: string, shadow = '#000') => {
    ctx.font = `${px}px ${pixel}`
    ctx.fillStyle = shadow
    ctx.fillText(s, size / 2 + 5, y + 5)
    ctx.fillStyle = color
    ctx.fillText(s, size / 2, y)
  }
  text(`${d.slaps} JEETS SLAPPED`, 760, 34, '#22e6ff')
  text(String(d.score), 870, 96, '#ffd23f')
  text(d.rank ? `${d.name} · #${d.rank} GLOBAL` : d.name, 940, 28, '#f4f1ff')
  text('CAN YOU BEAT ME?  t.me/JeetSlapperGameBot', 1030, 22, '#ff2e88')

  return c.toDataURL('image/png')
}

/** Shares the card with the system share sheet if available. Returns false if not supported. */
export async function shareCardFile(dataUrl: string): Promise<boolean> {
  try {
    const blob = await (await fetch(dataUrl)).blob()
    const file = new File([blob], 'jeet-slapper-score.png', { type: 'image/png' })
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text: shareText(0, 0, null, false) })
      return true
    }
  } catch {
    /* cancelled or not supported */
  }
  return false
}

export function shareText(score: number, slaps: number, rank: number | null | undefined, withNumbers = true) {
  const head = withNumbers
    ? `I just slapped ${slaps} jeets and scored ${score} in Jeet Slapper 👋💥${rank ? ` (#${rank} global)` : ''}`
    : 'Slap the jeets with me in Jeet Slapper 👋💥'
  return `${head}\nCan you beat me? 👇`
}

export function shareOnX(score: number, slaps: number, rank?: number | null) {
  const url = `https://x.com/intent/post?text=${encodeURIComponent(shareText(score, slaps, rank))}&url=${encodeURIComponent(inviteLink())}&via=albertv_dev`
  openLink(url)
}

export function shareOnTelegram(score?: number, slaps?: number, rank?: number | null) {
  const text = score !== undefined ? shareText(score, slaps ?? 0, rank) : 'Slap the jeets with me in Jeet Slapper 👋💥'
  openLink(`https://t.me/share/url?url=${encodeURIComponent(inviteLink())}&text=${encodeURIComponent(text)}`)
}
