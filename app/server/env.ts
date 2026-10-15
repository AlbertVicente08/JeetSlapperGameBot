// Variables de entorno de las Pages Functions (secretos en Cloudflare / .dev.vars en local).
export interface Env {
  TELEGRAM_BOT_TOKEN: string
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
}

// Tipo mínimo de Cloudflare Pages Functions, para no depender de @cloudflare/workers-types.
export type PagesFunction<E> = (ctx: { request: Request; env: E }) => Response | Promise<Response>

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}

/** Llama a una función SQL de Supabase (PostgREST /rpc) con la clave de servicio. */
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
  return res.json() as Promise<T>
}
