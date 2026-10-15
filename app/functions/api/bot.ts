// POST /api/bot — webhook of @JeetSlapperGameBot.
// Telegram sends the X-Telegram-Bot-Api-Secret-Token header with the secret registered in setWebhook.
//
// Commands:
//   /start [ref_123]  welcome + buttons (records the referral)   — private chat
//   /play             same as /start                             — private chat
//   /invite           your personal invite link                  — private chat
//   /roast            AI roast of you, or of the person you reply to   — anywhere
//   /slap             slap the person you reply to                     — anywhere
import { json, rpc, type Env, type PagesFunction } from '../../server/env.ts'
import { escapeHtml, parseReferral, tg } from '../../server/telegram.ts'
import { roast, slapLine } from '../../server/ai.ts'

const SITE = 'https://jeet-slapper.pages.dev'
const GAME_URL = `${SITE}/play/`
const BOT = 'JeetSlapperGameBot'
const LINKS = {
  channel: 'https://t.me/RealBertoBcn',
  chat: 'https://t.me/+aGQnR6gxz_oxNWY0',
  x: 'https://x.com/albertv_dev',
}

const WELCOME = [
  '👋 <b>Welcome to Jeet Slapper</b>',
  '',
  'Slap the jeets 🧻, take down the whales 🐋, grab power-ups 🚀, dodge the rugs 💣 and <b>never touch the diamond hands</b> 💎.',
  '30-second rounds, a global leaderboard and a <b>weekly tournament</b> 🏆.',
  '',
  '📣 <b>Community Boost x1.5</b>: join the BertoBCN channel and your record counts x1.5 on the leaderboard. Leave it and you lose it.',
  '🤝 <b>Squad Boost</b>: +10% for every friend you invite who plays (up to +50%). Use /invite.',
].join('\n')

interface TgFrom {
  id: number
  first_name?: string
  username?: string
}

interface Update {
  message?: {
    chat: { id: number; type: string }
    from?: TgFrom
    text?: string
    reply_to_message?: { from?: TgFrom }
  }
}

const nameOf = (u?: TgFrom) => (u?.username ? `@${u.username}` : (u?.first_name ?? 'anon'))

const inviteLink = (id: number) => `https://t.me/${BOT}?start=ref_${id}`

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.TELEGRAM_WEBHOOK_SECRET || request.headers.get('x-telegram-bot-api-secret-token') !== env.TELEGRAM_WEBHOOK_SECRET) {
    return json({ error: 'forbidden' }, 403)
  }

  const update = (await request.json().catch(() => ({}))) as Update
  const msg = update.message
  if (!msg?.text || !msg.from) return json({ ok: true })

  const [rawCmd, arg] = msg.text.trim().split(/\s+/, 2)
  const [cmd, mention] = rawCmd.toLowerCase().split('@')
  // In groups, ignore commands addressed to other bots
  if (mention && mention !== BOT.toLowerCase()) return json({ ok: true })
  const isPrivate = msg.chat.type === 'private'
  const send = (text: string, extra: Record<string, unknown> = {}) =>
    tg(env.TELEGRAM_BOT_TOKEN, 'sendMessage', { chat_id: msg.chat.id, text, parse_mode: 'HTML', ...extra })

  try {
    if (isPrivate && (cmd === '/start' || cmd === '/play' || cmd === '/help')) {
      const referrer = parseReferral(arg)
      if (referrer) await rpc(env, 'add_referral', { p_referred: msg.from.id, p_referrer: referrer })
      await send(WELCOME, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎮 Play', web_app: { url: GAME_URL } }],
            [
              { text: '📣 Channel', url: LINKS.channel },
              { text: '💬 Chat', url: LINKS.chat },
            ],
            [
              { text: '𝕏 BertoBCN', url: LINKS.x },
              { text: '📜 Rules & prizes', url: `${SITE}/rules/` },
            ],
          ],
        },
      })
    } else if (isPrivate && cmd === '/invite') {
      const link = inviteLink(msg.from.id)
      await send(
        `🤝 <b>Your invite link</b>\n\n${link}\n\nEvery friend who joins with it and plays a game gives you <b>+10% Squad Boost</b> (up to +50%).`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '📤 Share it', url: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent('Slap some jeets with me 👋💥')}` }],
            ],
          },
        },
      )
    } else if (cmd === '/roast') {
      const target = msg.reply_to_message?.from ?? msg.from
      await send(escapeHtml(await roast(env, nameOf(target))))
    } else if (cmd === '/slap') {
      const target = msg.reply_to_message?.from
      await send(
        target
          ? escapeHtml(await slapLine(env, nameOf(msg.from), nameOf(target)))
          : 'Reply to someone\'s message with /slap to slap them 👋',
      )
    }
  } catch (e) {
    console.error('bot', e)
  }

  // Always 200 so Telegram doesn't retry
  return json({ ok: true })
}
