// /wallet/?code=... — opened inside Phantom's in-app browser (or a desktop browser with Phantom).
// Connects, signs the link message and sends the signature to the server.

interface PhantomProvider {
  isPhantom?: boolean
  connect(): Promise<{ publicKey: { toString(): string } }>
  signMessage(message: Uint8Array, display?: 'utf8'): Promise<{ signature: Uint8Array }>
}

declare global {
  interface Window {
    phantom?: { solana?: PhantomProvider }
  }
}

// Must match server/solana.ts walletLinkMessage
const walletLinkMessage = (code: string, address: string) =>
  `Jeet Slapper: link this wallet to my Telegram account.\n\nWallet: ${address}\nCode: ${code}\n\nThis does not cost anything and does not give access to your funds.`

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T
const status = $<HTMLParagraphElement>('status')
const connectBtn = $<HTMLButtonElement>('connect')
const openPhantom = $<HTMLAnchorElement>('openPhantom')
const back = $<HTMLAnchorElement>('back')

const code = new URLSearchParams(location.search).get('code') ?? ''

const toBase64 = (b: Uint8Array) => btoa(String.fromCharCode(...b))

function show(msg: string, ok = false) {
  status.textContent = msg
  status.className = ok ? 'ok' : ''
}

async function link(provider: PhantomProvider) {
  connectBtn.disabled = true
  try {
    show('Connecting…')
    const { publicKey } = await provider.connect()
    const address = publicKey.toString()
    show('Sign the message in Phantom…')
    const { signature } = await provider.signMessage(new TextEncoder().encode(walletLinkMessage(code, address)), 'utf8')
    const res = await fetch('/api/wallet/link', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code, address, signature: toBase64(signature) }),
    })
    const data = (await res.json()) as { ok?: boolean; error?: string }
    if (!res.ok || !data.ok) throw new Error(data.error ?? 'Could not link the wallet')
    show(`✅ Wallet ${address.slice(0, 4)}…${address.slice(-4)} linked! Go back to Telegram and refresh your boosts.`, true)
    connectBtn.hidden = true
    back.hidden = false
  } catch (e) {
    show(`❌ ${e instanceof Error ? e.message : 'Something went wrong'}. Try again.`)
    connectBtn.disabled = false
  }
}

function init() {
  if (!/^[0-9a-f]{24}$/.test(code)) {
    show('❌ Invalid or missing link. Start again from the game in Telegram (Ranking → Connect Phantom).')
    back.hidden = false
    return
  }
  const provider = window.phantom?.solana
  if (provider?.isPhantom) {
    show('Phantom detected.')
    connectBtn.hidden = false
    connectBtn.onclick = () => void link(provider)
  } else {
    show("Phantom wasn't found in this browser. Open this page inside the Phantom app (or install the Phantom extension).")
    openPhantom.href = `https://phantom.app/ul/browse/${encodeURIComponent(location.href)}?ref=${encodeURIComponent(location.origin)}`
    openPhantom.hidden = false
  }
}

// Phantom injects its provider shortly after load
if (document.readyState === 'complete') setTimeout(init, 300)
else window.addEventListener('load', () => setTimeout(init, 300))
