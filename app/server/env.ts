// Environment of the Pages Functions (Cloudflare secrets in production, .dev.vars locally).
export interface Env {
  TELEGRAM_BOT_TOKEN: string
  TELEGRAM_WEBHOOK_SECRET: string
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  ADMIN_TELEGRAM_ID?: string // receives anti-cheat alerts and weekly winners
  CRON_SECRET?: string // protects /api/cron/*
  GROQ_API_KEY?: string // AI for /roast and /slap
  HELIUS_API_KEY?: string // Solana RPC (holder boost, bonding curve)
  TOKEN_MINT?: string // $JSLAP mint address. Empty = token not launched yet (token features stay dormant)
}

// Minimal Cloudflare Pages Functions type, so we don't depend on @cloudflare/workers-types.
export type PagesFunction<E> = (ctx: { request: Request; env: E }) => Response | Promise<Response>

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  })
}

/** Calls a Supabase SQL function (PostgREST /rpc) with the service key. */
export async function rpc<T>(env: Env, fn: string, args: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(args),
  })
  if (!res.ok) throw new Error(`Supabase ${fn}: ${res.status} ${await res.text()}`)
  // Functions returning void answer 204 with no body
  const text = await res.text()
  return (text ? JSON.parse(text) : null) as T
}

export const tokenLive = (env: Env) => !!env.TOKEN_MINT && !!env.HELIUS_API_KEY

export const heliusRpc = (env: Env) => `https://mainnet.helius-rpc.com/?api-key=${env.HELIUS_API_KEY}`
