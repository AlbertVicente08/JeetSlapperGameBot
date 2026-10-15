import { useCallback, useEffect, useRef, useState } from 'react'
import {
  comboMultiplier,
  newGame,
  slap,
  tick,
  tier,
  ROUND_MS,
  TIER_NAMES,
  type Event,
  type GameState,
  type Mole,
} from './game/engine'
import { setMuted, sfx } from './game/sound'
import { haptic, initTelegram, inTelegram, playerName } from './telegram'
import { fetchLeaderboard, submitScore, type Leaderboard, type SubmitResult } from './api'
import './App.css'

type Screen = 'menu' | 'playing' | 'results' | 'ranking'
type Load = 'idle' | 'loading' | 'error'

interface Popup {
  id: number
  hole: number
  text: string
  bad: boolean
}

const BEST_KEY = 'jslap.best'

function loadBest(): number {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0
  } catch {
    return 0
  }
}

function saveBest(n: number) {
  try {
    localStorage.setItem(BEST_KEY, String(n))
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
}

function RankingTable({ board, status }: { board: Leaderboard | null; status: Load }) {
  if (status === 'loading' && !board) return <p className="muted">Cargando ranking…</p>
  if (status === 'error' && !board) return <p className="muted">No se pudo cargar el ranking.</p>
  if (!board) return null
  if (!board.top.length) return <p className="muted">Aún no hay puntuaciones. ¡Sé el primero!</p>
  return (
    <div className="ranking">
      <ol>
        {board.top.map((r, i) => (
          <li key={i} className={i < 3 ? `top${i + 1}` : ''}>
            <span className="pos">{i + 1}</span>
            <span className="who">{r.name}</span>
            <span className="pts">{r.score}</span>
          </li>
        ))}
      </ol>
      {board.me && (
        <p className="me">
          Tu posición: #{board.me.rank} de {board.players} · récord {board.me.best}
        </p>
      )}
    </div>
  )
}

const FACE: Record<Mole['kind'], string> = { jeet: '🧻', holder: '💎', whale: '🐋' }
const LABEL: Record<Mole['kind'], string> = { jeet: 'SELL', holder: 'HODL', whale: 'DUMP' }

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu')
  const [game, setGame] = useState<GameState>(newGame)
  const [best, setBest] = useState(loadBest)
  const [popups, setPopups] = useState<Popup[]>([])
  const [muted, setMutedState] = useState(false)
  const [shake, setShake] = useState(false)
  const [board, setBoard] = useState<Leaderboard | null>(null)
  const [boardStatus, setBoardStatus] = useState<Load>('idle')
  const [submitted, setSubmitted] = useState<SubmitResult | null>(null)
  const gameRef = useRef(game)
  const popupId = useRef(0)

  useEffect(() => initTelegram(), [])

  const handleEvents = useCallback((events: Event[]) => {
    for (const e of events) {
      if (e.type === 'hit') {
        if (e.kind === 'holder') {
          sfx.wrong()
          haptic.error()
          setShake(true)
          setTimeout(() => setShake(false), 250)
        } else if (e.kind === 'whale') {
          if (e.killed) {
            sfx.whaleKill()
            haptic.success()
          } else {
            sfx.whaleHit()
            haptic.hit()
          }
        } else {
          sfx.slap()
          haptic.hit()
        }
        const id = ++popupId.current
        const text = e.points > 0 ? `+${e.points}` : `${e.points}`
        setPopups(p => [...p, { id, hole: e.hole, text, bad: e.points < 0 }])
        setTimeout(() => setPopups(p => p.filter(x => x.id !== id)), 650)
      } else if (e.type === 'escape') {
        sfx.escape()
      }
    }
  }, [])

  const commit = useCallback((s: GameState) => {
    gameRef.current = s
    setGame(s)
  }, [])

  const loadBoard = useCallback(async () => {
    setBoardStatus('loading')
    try {
      setBoard(await fetchLeaderboard())
      setBoardStatus('idle')
    } catch {
      setBoardStatus('error')
    }
  }, [])

  // Al acabar: guarda la puntuación (solo dentro de Telegram) y refresca el ranking
  const finishRound = useCallback(
    async (score: number) => {
      setSubmitted(null)
      if (inTelegram() && score > 0) {
        try {
          setSubmitted(await submitScore(score))
        } catch {
          /* sin conexión: el récord local sigue guardado */
        }
      }
      await loadBoard()
    },
    [loadBoard],
  )

  // Bucle de juego
  useEffect(() => {
    if (screen !== 'playing') return
    // setInterval en vez de requestAnimationFrame: algunos webviews no disparan rAF de forma fiable
    let last = performance.now()
    const timer = setInterval(() => {
      const now = performance.now()
      const dt = Math.min(100, now - last)
      last = now
      const [next, events] = tick(gameRef.current, dt)
      handleEvents(events)
      commit(next)
      if (next.over) {
        clearInterval(timer)
        sfx.end()
        setScreen('results')
        if (next.score > loadBest()) {
          saveBest(next.score)
          setBest(next.score)
        }
        void finishRound(next.score)
      }
    }, 33)
    return () => clearInterval(timer)
  }, [screen, commit, handleEvents, finishRound])

  const start = () => {
    sfx.start()
    setPopups([])
    commit(newGame())
    setScreen('playing')
  }

  const onSlap = (hole: number) => {
    const [next, events] = slap(gameRef.current, hole)
    handleEvents(events)
    commit(next)
  }

  const toggleMute = () => {
    setMuted(!muted)
    setMutedState(!muted)
  }

  const secondsLeft = Math.ceil((ROUND_MS - game.elapsed) / 1000)
  const combo = comboMultiplier(game.streak)

  return (
    <main className={`app ${shake ? 'shake' : ''}`}>
      <button className="mute" onClick={toggleMute} aria-label={muted ? 'Activar sonido' : 'Silenciar'}>
        {muted ? '🔇' : '🔊'}
      </button>

      {screen === 'menu' && (
        <section className="panel">
          <h1 className="title">
            JEET
            <br />
            SLAPPER
          </h1>
          <p className="tagline">Deja de mirar las velas rojas. Abofetea a los jeets.</p>
          <ul className="legend">
            <li>
              <span>🧻</span> Jeet: abofetéalo (+10)
            </li>
            <li>
              <span>🐋</span> Ballena: 3 golpes (+65)
            </li>
            <li>
              <span>💎</span> Diamond hand: ¡no le pegues! (−25)
            </li>
          </ul>
          <button className="btn" onClick={start}>
            JUGAR
          </button>
          <button
            className="btn ghost"
            onClick={() => {
              setScreen('ranking')
              void loadBoard()
            }}
          >
            🏆 RANKING
          </button>
          <p className="muted">Récord: {best}</p>
          <p className="demo">Modo demo: sin token, sin wallet. Solo diversión.</p>
          {inTelegram() && <p className="muted">Hola, {playerName()}</p>}
        </section>
      )}

      {screen === 'playing' && (
        <section className="play">
          <header className="hud">
            <div>
              <small>PUNTOS</small>
              <b>{game.score}</b>
            </div>
            <div>
              <small>COMBO</small>
              <b className={combo > 1 ? 'hot' : ''}>x{combo}</b>
            </div>
            <div>
              <small>TIEMPO</small>
              <b className={secondsLeft <= 5 ? 'danger' : ''}>{secondsLeft}s</b>
            </div>
          </header>
          <div className="tier">{TIER_NAMES[tier(game.elapsed)]}</div>
          <div className="timebar">
            <div style={{ width: `${100 - (game.elapsed / ROUND_MS) * 100}%` }} />
          </div>
          <div className="grid">
            {game.holes.map((m, i) => (
              <button key={i} className="hole" onPointerDown={() => onSlap(i)} aria-label={`Agujero ${i + 1}`}>
                {m && (
                  <span key={m.id} className={`mole ${m.kind}`}>
                    <span className="face">{FACE[m.kind]}</span>
                    <span className="tag">{LABEL[m.kind]}</span>
                    {m.kind === 'whale' && <span className="hp">{'■'.repeat(m.hp)}</span>}
                  </span>
                )}
                {popups
                  .filter(p => p.hole === i)
                  .map(p => (
                    <span key={p.id} className={`popup ${p.bad ? 'bad' : ''}`}>
                      {p.text}
                    </span>
                  ))}
              </button>
            ))}
          </div>
        </section>
      )}

      {screen === 'results' && (
        <section className="panel">
          <h2 className="title small">FIN DE RONDA</h2>
          <p className="big">{game.score}</p>
          <p className="muted">
            {game.slaps} bofetadas · {game.escaped} jeets escapados
          </p>
          {game.score >= best && game.score > 0 && <p className="record">¡NUEVO RÉCORD!</p>}
          <p className="muted">Récord: {best}</p>
          {submitted && <p className="me">Ranking global: #{submitted.rank}</p>}
          {!inTelegram() && <p className="muted">Abre el juego en Telegram para entrar en el ranking.</p>}
          <button className="btn" onClick={start}>
            OTRA VEZ
          </button>
          <button className="btn ghost" onClick={() => setScreen('menu')}>
            MENÚ
          </button>
          <RankingTable board={board} status={boardStatus} />
        </section>
      )}

      {screen === 'ranking' && (
        <section className="panel">
          <h2 className="title small">🏆 RANKING</h2>
          <RankingTable board={board} status={boardStatus} />
          {!inTelegram() && <p className="muted">Abre el juego en Telegram para entrar en el ranking.</p>}
          <button className="btn" onClick={start}>
            JUGAR
          </button>
          <button className="btn ghost" onClick={() => setScreen('menu')}>
            MENÚ
          </button>
        </section>
      )}
    </main>
  )
}
