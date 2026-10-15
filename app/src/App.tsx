import { useCallback, useEffect, useRef, useState } from 'react'
import {
  comboMultiplier,
  finalPump,
  HOLDER_PENALTY,
  ESCAPE_PENALTY,
  newGame,
  pumpActive,
  RUG_PENALTY,
  slap,
  tick,
  tier,
  TIER_NAMES,
  type Event,
  type GameState,
  type Mole,
} from './game/engine'
import { setMuted, sfx } from './game/sound'
import { haptic, initTelegram, inTelegram, openLink, playerName } from './telegram'
import { COMMUNITY_BOOST, HOLDER_HOLD_MINUTES, HOLDER_TIERS, LINKS } from './community'
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

const FACE: Record<Mole['kind'], string> = {
  jeet: '🧻',
  holder: '💎',
  whale: '🐋',
  golden: '🪙',
  rug: '💣',
  pump: '🚀',
  clock: '⏱️',
}
const LABEL: Record<Mole['kind'], string> = {
  jeet: 'SELL',
  holder: 'HODL',
  whale: 'DUMP',
  golden: 'GOLD',
  rug: 'RUG',
  pump: 'PUMP',
  clock: '+3s',
}

function Legend() {
  const items: [string, string][] = [
    ['🧻', 'Jeet +10'],
    ['🪙', 'Jeet dorado +50'],
    ['🐋', 'Ballena: 3 golpes'],
    ['🚀', 'PUMP: x2 durante 5 s'],
    ['⏱️', '+3 segundos'],
    ['💎', `Diamond hand −${HOLDER_PENALTY}`],
    ['💣', `Rug pull −${RUG_PENALTY} y limpia todo`],
    ['💨', `Jeet escapado −${ESCAPE_PENALTY}`],
  ]
  return (
    <ul className="legend">
      {items.map(([icon, text]) => (
        <li key={text}>
          <span>{icon}</span>
          {text}
        </li>
      ))}
    </ul>
  )
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
            <span className="who">
              {r.name}
              {r.community && <span className="badge" title="Boost comunidad">📣</span>}
            </span>
            <span className="pts">{r.score}</span>
          </li>
        ))}
      </ol>
      {board.me && (
        <p className="me">
          Tu posición: #{board.me.rank} de {board.players} · {board.me.ranked} pts
          {board.me.community ? ` (récord ${board.me.best} x${COMMUNITY_BOOST})` : ''}
        </p>
      )}
    </div>
  )
}

function CommunityBoost({ active, onCheck }: { active: boolean | null; onCheck: () => void }) {
  return (
    <div className={`info boostcard ${active ? 'on' : ''}`}>
      <h3>📣 Boost Comunidad · x{COMMUNITY_BOOST}</h3>
      {active ? (
        <p>
          <b>¡Activo!</b> Estás en el canal, así que tu récord cuenta x{COMMUNITY_BOOST} en el ranking. Si te sales del
          canal, lo pierdes.
        </p>
      ) : (
        <>
          <p>
            Únete al canal de BertoBCN y tu récord contará <b>x{COMMUNITY_BOOST}</b> en el ranking. Si te sales del canal,
            pierdes el boost.
          </p>
          <div className="row">
            <button className="chip" onClick={() => openLink(LINKS.channel)}>
              📣 Unirme al canal
            </button>
            {inTelegram() && (
              <button className="chip" onClick={onCheck}>
                🔄 Ya me he unido
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function HolderInfo() {
  return (
    <div className="info">
      <h3>👛 Wallet Phantom · Holder Boost</h3>
      <p>
        Cuando se lance <b>$JSLAP</b> podrás conectar tu wallet de Phantom. Si tienes tokens, tus puntos en el ranking
        se multiplican:
      </p>
      <table>
        <tbody>
          {HOLDER_TIERS.map(t => (
            <tr key={t.min}>
              <td>{t.label}</td>
              <td className="boost">{t.boost}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul>
        <li>Tienes que mantener los tokens al menos {HOLDER_HOLD_MINUTES} minutos para activar el boost.</li>
        <li>Si vendes, el boost vuelve a x1 al momento.</li>
        <li>Se suma al Boost Comunidad.</li>
        <li>Una wallet por cuenta de Telegram.</li>
        <li>
          Si el token se gradúa en pump.fun, el Top 20 se reparte un bote del 1,5% del supply, en 3 pagos (33% / 33% /
          34%) durante 48 h.
        </li>
      </ul>
      <button className="btn ghost" disabled>
        CONECTAR PHANTOM · PRÓXIMAMENTE
      </button>
      <p className="warn">
        ⚠️ El token aún no existe. Esto es lo previsto y puede cambiar. Las criptomonedas son de alto riesgo: no inviertas
        lo que no puedas perder.
      </p>
    </div>
  )
}

function CommunityLinks() {
  return (
    <div className="community">
      <p>Únete a la comunidad</p>
      <div className="links">
        <button className="chip" onClick={() => openLink(LINKS.channel)}>
          📣 Canal
        </button>
        <button className="chip" onClick={() => openLink(LINKS.chat)}>
          💬 Chat
        </button>
        <button className="chip" onClick={() => openLink(LINKS.twitter)}>
          𝕏 BertoBCN
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu')
  const [game, setGame] = useState<GameState>(newGame)
  const [best, setBest] = useState(loadBest)
  const [popups, setPopups] = useState<Popup[]>([])
  const [muted, setMutedState] = useState(false)
  const [shake, setShake] = useState(false)
  const [flash, setFlash] = useState<'' | 'rug' | 'pump' | 'gold'>('')
  const [board, setBoard] = useState<Leaderboard | null>(null)
  const [boardStatus, setBoardStatus] = useState<Load>('idle')
  const [submitted, setSubmitted] = useState<SubmitResult | null>(null)
  const gameRef = useRef(game)
  const popupId = useRef(0)

  const community = board?.me?.community ?? submitted?.community ?? null

  const addPopup = useCallback((hole: number, text: string, bad: boolean) => {
    const id = ++popupId.current
    setPopups(p => [...p, { id, hole, text, bad }])
    setTimeout(() => setPopups(p => p.filter(x => x.id !== id)), 650)
  }, [])

  const flashScreen = useCallback((kind: 'rug' | 'pump' | 'gold', shakeToo = false) => {
    setFlash(kind)
    setTimeout(() => setFlash(''), 300)
    if (shakeToo) {
      setShake(true)
      setTimeout(() => setShake(false), 250)
    }
  }, [])

  const handleEvents = useCallback(
    (events: Event[]) => {
      for (const e of events) {
        if (e.type === 'hit') {
          switch (e.kind) {
            case 'holder':
              sfx.wrong()
              haptic.error()
              setShake(true)
              setTimeout(() => setShake(false), 250)
              break
            case 'rug':
              sfx.rug()
              haptic.error()
              flashScreen('rug', true)
              break
            case 'golden':
              sfx.golden()
              haptic.success()
              flashScreen('gold')
              break
            case 'pump':
              sfx.pump()
              haptic.success()
              flashScreen('pump')
              addPopup(e.hole, 'x2!', false)
              continue
            case 'clock':
              sfx.clock()
              haptic.hit()
              addPopup(e.hole, '+3s', false)
              continue
            case 'whale':
              if (e.killed) {
                sfx.whaleKill()
                haptic.success()
              } else {
                sfx.whaleHit()
                haptic.hit()
              }
              break
            default:
              sfx.slap()
              haptic.hit()
          }
          addPopup(e.hole, e.points > 0 ? `+${e.points}` : `${e.points}`, e.points < 0)
        } else if (e.type === 'escape') {
          sfx.escape()
          addPopup(e.hole, `${e.points}`, true)
        }
      }
    },
    [addPopup, flashScreen],
  )

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

  useEffect(() => {
    initTelegram()
    // Dentro de Telegram cargamos el ranking al abrir para saber si el Boost Comunidad está activo
    if (inTelegram()) void loadBoard()
  }, [loadBoard])

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

  const openRanking = () => {
    setScreen('ranking')
    void loadBoard()
  }

  const secondsLeft = Math.max(0, Math.ceil((game.duration - game.elapsed) / 1000))
  const combo = comboMultiplier(game.streak)
  const pump = pumpActive(game)
  const final = finalPump(game)

  return (
    <main className={`app ${shake ? 'shake' : ''} ${flash ? `flash-${flash}` : ''}`}>
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
          <Legend />
          <button className="btn" onClick={start}>
            {inTelegram() ? 'JUGAR' : 'JUGAR DEMO'}
          </button>
          <button className="btn ghost" onClick={openRanking}>
            🏆 MODO RANKING
          </button>
          <p className="muted">Récord: {best}</p>
          {inTelegram() ? (
            <p className="muted">
              Hola, {playerName()} · tus partidas cuentan para el ranking
              {community ? ` · 📣 boost x${COMMUNITY_BOOST} activo` : ''}
            </p>
          ) : (
            <p className="demo">Modo demo: tus partidas no cuentan. Abre el juego en Telegram para competir.</p>
          )}
          {inTelegram() && !community && <CommunityBoost active={community} onCheck={() => void loadBoard()} />}
          <CommunityLinks />
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
          <div className="tier">
            {final ? (
              <span className="final">🔥 FINAL PUMP x2 🔥</span>
            ) : pump ? (
              <span className="pumping">🚀 PUMP x2 🚀</span>
            ) : (
              TIER_NAMES[tier(game.elapsed)]
            )}
          </div>
          <div className="timebar">
            <div style={{ width: `${(Math.max(0, game.duration - game.elapsed) / game.duration) * 100}%` }} />
          </div>
          <div className={`grid ${pump || final ? 'hotgrid' : ''}`}>
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
          {submitted && (
            <p className="me">
              Ranking global: #{submitted.rank} · {submitted.ranked} pts
              {submitted.community ? ` (📣 x${COMMUNITY_BOOST})` : ''}
            </p>
          )}
          {!inTelegram() && <p className="muted">Abre el juego en Telegram para entrar en el ranking.</p>}
          <button className="btn" onClick={start}>
            OTRA VEZ
          </button>
          <button className="btn ghost" onClick={() => setScreen('menu')}>
            MENÚ
          </button>
          {inTelegram() && !community && <CommunityBoost active={community} onCheck={() => void loadBoard()} />}
          <RankingTable board={board} status={boardStatus} />
          <CommunityLinks />
        </section>
      )}

      {screen === 'ranking' && (
        <section className="panel">
          <h2 className="title small">🏆 MODO RANKING</h2>
          <div className="info">
            <p>
              Compites contra todos los jugadores. Cuenta tu <b>mejor puntuación</b> multiplicada por tus boosts. Solo
              cuentan las partidas jugadas desde Telegram con tu cuenta.
            </p>
          </div>
          <RankingTable board={board} status={boardStatus} />
          {!inTelegram() && <p className="muted">Abre el juego en Telegram para entrar en el ranking.</p>}
          <button className="btn" onClick={start}>
            JUGAR
          </button>
          <button className="btn ghost" onClick={() => setScreen('menu')}>
            MENÚ
          </button>
          <CommunityBoost active={community} onCheck={() => void loadBoard()} />
          <HolderInfo />
          <CommunityLinks />
        </section>
      )}
    </main>
  )
}
