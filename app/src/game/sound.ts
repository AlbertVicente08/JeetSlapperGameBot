// Retro sounds generated with WebAudio: no audio files.

let ctx: AudioContext | null = null
let muted = false

export function setMuted(m: boolean) {
  muted = m
}

function audio(): AudioContext | null {
  if (muted) return null
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function beep(freq: number, ms: number, type: OscillatorType = 'square', slideTo?: number, vol = 0.08) {
  const a = audio()
  if (!a) return
  const t = a.currentTime
  const osc = a.createOscillator()
  const gain = a.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + ms / 1000)
  gain.gain.setValueAtTime(vol, t)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000)
  osc.connect(gain).connect(a.destination)
  osc.start(t)
  osc.stop(t + ms / 1000)
}

export const sfx = {
  slap: () => beep(220, 90, 'square', 80, 0.12),
  whaleHit: () => beep(140, 70, 'sawtooth', 90, 0.1),
  whaleKill: () => {
    beep(330, 120, 'square', 660)
    setTimeout(() => beep(660, 160, 'square', 990), 90)
  },
  wrong: () => beep(160, 260, 'sawtooth', 60, 0.1),
  golden: () => {
    beep(880, 70, 'square', 1320)
    setTimeout(() => beep(1320, 70, 'square', 1760), 60)
    setTimeout(() => beep(1760, 120, 'triangle', 2200), 120)
  },
  rug: () => {
    beep(300, 500, 'sawtooth', 40, 0.14)
    setTimeout(() => beep(90, 400, 'square', 30, 0.12), 80)
  },
  pump: () => {
    beep(330, 250, 'square', 1320, 0.09)
    setTimeout(() => beep(660, 200, 'square', 1760, 0.07), 180)
  },
  clock: () => {
    beep(1000, 60, 'triangle')
    setTimeout(() => beep(1400, 90, 'triangle'), 80)
  },
  escape: () => beep(500, 120, 'triangle', 250, 0.05),
  start: () => {
    beep(440, 90)
    setTimeout(() => beep(660, 90), 100)
    setTimeout(() => beep(880, 140), 200)
  },
  end: () => {
    beep(660, 140)
    setTimeout(() => beep(440, 140), 150)
    setTimeout(() => beep(220, 300), 300)
  },
}
