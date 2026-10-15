// AI for the bot's /roast and /slap commands (Groq, free tier). Falls back to canned lines.
import type { Env } from './env.ts'

const MODEL = 'openai/gpt-oss-20b'

const SYSTEM = `You are Jeet Slapper, the bot of a crypto arcade game where players slap "jeets" (paper-handed sellers).
Write ONE short, funny, PG-13 crypto-degen line (max 2 sentences, under 220 characters), in English.
Roast trading habits and crypto behaviour only. Never mention appearance, race, ethnicity, gender, sexuality,
religion, disability, health or family. No slurs, no threats, no financial advice, no price predictions. Light emojis allowed.`

const FALLBACK_ROASTS = [
  'Your stop-loss has more conviction than you do. 📉',
  'You sell the bottom so consistently the market should pay you a salary. 🧻',
  'Diamond hands? Yours are more like wet tissue paper. 💎❌',
  'You bought the top so many times it has your name on it. 🏔️',
]
const FALLBACK_SLAPS = [
  '👋💥 SLAP! That one was for selling at -2%.',
  '🥊 A golden gauntlet to the face. HODL next time.',
  '👋 Slapped so hard their seed phrase reset.',
]

const pick = (xs: string[]) => xs[Math.floor(Math.random() * xs.length)]

async function ask(env: Env, prompt: string): Promise<string | null> {
  if (!env.GROQ_API_KEY) return null
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { authorization: `Bearer ${env.GROQ_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        reasoning_effort: 'low',
        temperature: 1,
        max_completion_tokens: 300,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: prompt },
        ],
      }),
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) throw new Error(`Groq ${res.status}`)
    const data = (await res.json()) as { choices: { message: { content: string } }[] }
    const text = data.choices[0]?.message.content?.trim()
    return text ? text.slice(0, 400) : null
  } catch (e) {
    console.error('ai', e)
    return null
  }
}

/** Names are untrusted user input: keep them short and plain. */
const clean = (name: string) => name.replace(/[^\p{L}\p{N}_ .@-]/gu, '').slice(0, 32) || 'anon'

export async function roast(env: Env, target: string, context?: string): Promise<string> {
  const who = clean(target)
  return (await ask(env, `Roast ${who}.${context ? ` Context: ${context}` : ''}`)) ?? `${who}, ${pick(FALLBACK_ROASTS)}`
}

export async function slapLine(env: Env, from: string, target: string): Promise<string> {
  const a = clean(from)
  const b = clean(target)
  return (
    (await ask(env, `${a} slaps ${b} with the Golden Gauntlet. Describe the slap in one dramatic, funny line.`)) ??
    `${a} → ${b}: ${pick(FALLBACK_SLAPS)}`
  )
}
