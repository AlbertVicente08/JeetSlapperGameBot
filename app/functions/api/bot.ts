// POST /api/bot  — webhook de @JeetSlapperGameBot.
// Telegram envía la cabecera X-Telegram-Bot-Api-Secret-Token con el secreto registrado en setWebhook.
import { json, type Env, type PagesFunction } from '../../server/env'

const GAME_URL = 'https://jeet-slapper.pages.dev/play/'
const LINKS = {
  channel: 'https://t.me/RealBertoBcn',
  chat: 'https://t.me/+aGQnR6gxz_oxNWY0',
  twitter: 'https://x.com/albertv_dev',
}

const WELCOME = [
  '👋 <b>Bienvenido a Jeet Slapper</b>',
  '',
  'Abofetea a los jeets 🧻, tumba a las ballenas 🐋 y <b>no toques a los diamond hands</b> 💎.',
  'Rondas de 30 segundos, power-ups 🚀, bombas 💣 y ranking global.',
  '',
  '📣 <b>Boost Comunidad x1,5</b>: si estás en el canal de BertoBCN, tu récord cuenta x1,5 en el ranking. Si te sales, lo pierdes.',
].join('\n')

interface Update {
  message?: { chat: { id: number; type: string }; text?: string }
}

async function send(env: Env, method: string, payload: unknown) {
  const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) console.error(method, res.status, await res.text())
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.TELEGRAM_WEBHOOK_SECRET || request.headers.get('x-telegram-bot-api-secret-token') !== env.TELEGRAM_WEBHOOK_SECRET) {
    return json({ error: 'forbidden' }, 403)
  }

  const update = (await request.json().catch(() => ({}))) as Update
  const msg = update.message
  const cmd = msg?.text?.split(/[\s@]/)[0]

  // Solo respondemos en chats privados para no hacer spam en grupos
  if (msg && msg.chat.type === 'private' && (cmd === '/start' || cmd === '/help' || cmd === '/jugar')) {
    await send(env, 'sendMessage', {
      chat_id: msg.chat.id,
      text: WELCOME,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎮 Jugar', web_app: { url: GAME_URL } }],
          [
            { text: '📣 Canal', url: LINKS.channel },
            { text: '💬 Chat', url: LINKS.chat },
          ],
          [{ text: '𝕏 BertoBCN', url: LINKS.twitter }],
        ],
      },
    })
  }

  // Siempre 200 para que Telegram no reintente
  return json({ ok: true })
}
