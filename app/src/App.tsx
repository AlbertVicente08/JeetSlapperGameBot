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
  STEP_MS,
  tick,
  tier,
  TIER_NAMES,
  type Event,
  type GameState,
  type Mole,
  type Tap,
} from './game/engine'
import { setMuted, sfx } from './game/sound'
import { haptic, initTelegram, inTelegram, inviteLink, openLink, playerName } from './telegram'
import { COMMUNITY_BOOST, HOLDER_HOLD_MINUTES, HOLDER_TIERS, LINKS, SQUAD_MAX, SQUAD_STEP } from './community'
import { fmtTokens, JACKPOT_SPLIT, MONTHLY_PRIZES, WEEKLY_PRIZES } from './prizes'
import {
  ApiError,
  fetchCurve,
  fetchLeaderboard,
  startSession,
  startWalletLink,
  submitScore,
  type Curve,
  type Leaderboard,
  type Me,
  type Ranked,
  type Session,
  type SubmitResult,
  type TournamentBoard,
} from './api'
import { drawScoreCard, shareCardFile, shareOnTelegram, shareOnX } from './share'
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
    /* no storage: no problem */
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
const MEDALS = ['🥇', '🥈', '🥉']

const shortAddr = (a: string) => `${a.slice(0, 4)}…${a.slice(-4)}`

function Legend() {
  const items: [string, string][] = [
    ['🧻', 'Jeet +10'],
    ['🪙', 'Golden jeet +50'],
    ['🐋', 'Whale: 3 hits'],
    ['🚀', 'PUMP: x2 for 5 s'],
    ['⏱️', '+3 seconds'],
    ['💎', `Diamond hand −${HOLDER_PENALTY}`],
    ['💣', `Rug pull −${RUG_PENALTY}, clears all`],
    ['💨', `Escaped jeet −${ESCAPE_PENALTY}`],
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

function CurveBar({ curve }: { curve: Curve | null }) {
  if (!curve?.live || curve.progress === undefined) return null
  if (curve.complete) return <p className="curve done">🎓 $JSLAP graduated to PumpSwap</p>
  const pct = Math.round(curve.progress * 1000) / 10
  return (
    <div className="curve">
      <div className="curve-label">
        <span>$JSLAP bonding curve</span>
        <span>
          {pct}% · {curve.solRaised?.toFixed(1)} SOL
        </span>
      </div>
      <div className="curve-bar">
        <div style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function AllTimeTable({ board, rows, empty }: { board: Leaderboard; rows: Ranked[]; empty: string }) {
  if (!rows.length) return <p className="muted">{empty}</p>
  return (
    <div className="ranking">
      <ol>
        {rows.map((r, i) => (
          <li key={i} className={i < 3 ? `top${i + 1}` : ''}>
            <span className="pos">{i + 1}</span>
            <span className="who">
              {r.name}
              {r.medal && <span className="badge" title="Hall of Fame: last week's top 3">👑</span>}
              {r.community && <span className="badge" title="Community Boost">📣</span>}
              {r.squad > 0 && <span className="badge" title={`Squad Boost: ${r.squad} friends`}>🤝</span>}
              {r.holder > 1 && <span className="badge" title={`Holder Boost x${r.holder}`}>👛</span>}
              {r.verified && <span className="badge" title="Game verified by the server">✅</span>}
            </span>
            <span className="pts">{r.score}</span>
          </li>
        ))}
      </ol>
      {board.me && (
        <p className="me">
          You: #{board.me.rank} of {board.players} · {board.me.ranked} pts (record {board.me.best} with boosts)
        </p>
      )}
    </div>
  )
}

function TournamentTable({ t, label, prizes }: { t: TournamentBoard; label: string; prizes: readonly { medal: string; tokens: number }[] }) {
  return (
    <div className="ranking">
      <p className="muted">{label} · best game x boosts</p>
      <p className="prizeline">
        {prizes.map(p => (
          <span key={p.medal}>
            {p.medal} {fmtTokens(p.tokens)}
          </span>
        ))}
      </p>
      {t.top.length ? (
        <ol>
          {t.top.map((r, i) => (
            <li key={i} className={i < 3 ? `top${i + 1}` : ''}>
              <span className="pos">{MEDALS[i] ?? i + 1}</span>
              <span className="who">
                {r.name}
                {r.community && <span className="badge">📣</span>}
                {r.holder > 1 && <span className="badge">👛</span>}
              </span>
              <span className="pts">
                {r.score}
                {r.score !== r.raw && <small className="raw"> ({r.raw})</small>}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="muted">Nobody has played yet. Take the lead!</p>
      )}
      {t.me && (
        <p className="me">
          You: #{t.me.rank} of {t.players} · {t.me.score} pts ({t.me.raw} x boosts)
        </p>
      )}
    </div>
  )
}

function RankedLock({ onConnect, connecting }: { onConnect: () => void; connecting: boolean }) {
  return (
    <div className="info lock">
      <h3>🔒 Ranked mode is locked</h3>
      <p>
        Connect your <b>Phantom</b> wallet to play ranked, enter the weekly and monthly tournaments and receive your{' '}
        {'$JSLAP'} prizes. Linking only needs a signature: it's free and never moves funds.
      </p>
      <button className="btn small" onClick={onConnect} disabled={connecting}>
        {connecting ? 'OPENING PHANTOM…' : '👛 CONNECT PHANTOM'}
      </button>
      <p className="muted">Until then you can play in practice mode (it doesn't count).</p>
    </div>
  )
}

function Prizes() {
  return (
    <div className="info prizes">
      <h3>🏆 Prizes in $JSLAP</h3>
      <p>
        <b>Weekly tournament</b> (Mon–Sun UTC, best game x boosts):
      </p>
      <ul className="plain">
        {WEEKLY_PRIZES.map(p => (
          <li key={p.place}>
            {p.medal} {fmtTokens(p.tokens)}
          </li>
        ))}
      </ul>
      <p>
        <b>Monthly tournament</b> (calendar month UTC):
      </p>
      <ul className="plain">
        {MONTHLY_PRIZES.map(p => (
          <li key={p.place}>
            {p.medal} {fmtTokens(p.tokens)}
          </li>
        ))}
      </ul>
      <p>
        <b>Graduation Jackpot</b>: when $JSLAP graduates on pump.fun, the all-time top 20 share 1.5% of the supply, paid in
        3 parts over 48 h, if they keep holding.
      </p>
      <ul className="plain">
        {JACKPOT_SPLIT.map(j => (
          <li key={j.place}>
            {j.place}: {j.share}
          </li>
        ))}
      </ul>
      <p className="muted">
        Prizes are sent to your linked Phantom wallet after the winning games are verified and reviewed. 18+ only, not
        available where prohibited.{' '}
        <a href={LINKS.rules} onClick={e => (e.preventDefault(), openLink(LINKS.rules))}>
          Full rules
        </a>
      </p>
    </div>
  )
}

function Boosts({ me, onRefresh }: { me: Me | null; onRefresh: () => void }) {
  const community = !!me?.community
  const friends = Math.min(me?.referrals ?? 0, SQUAD_MAX)
  return (
    <div className="info boostcard">
      <h3>⚡ Your boosts</h3>
      <table>
        <tbody>
          <tr>
            <td>📣 Community (in the channel)</td>
            <td className="boost">{community ? `x${COMMUNITY_BOOST}` : '—'}</td>
          </tr>
          <tr>
            <td>🤝 Squad ({friends}/{SQUAD_MAX} friends)</td>
            <td className="boost">{friends ? `+${Math.round(friends * SQUAD_STEP * 100)}%` : '—'}</td>
          </tr>
          <tr>
            <td>👛 Holder</td>
            <td className="boost">{me && me.holderMult > 1 ? `x${me.holderMult}` : '—'}</td>
          </tr>
        </tbody>
      </table>
      <div className="row">
        {!community && (
          <button className="chip" onClick={() => openLink(LINKS.channel)}>
            📣 Join the channel
          </button>
        )}
        <button className="chip" onClick={() => shareOnTelegram()}>
          🤝 Invite friends
        </button>
        {inTelegram() && (
          <button className="chip" onClick={onRefresh}>
            🔄 Refresh
          </button>
        )}
      </div>
      <p className="muted">
        Boosts multiply your scores in the weekly, monthly and all-time rankings. Leave the channel and you lose x
        {COMMUNITY_BOOST}. Each friend who joins with your link and plays a ranked game adds +10% (max +50%).
      </p>
    </div>
  )
}

function HolderInfo({ me, onConnect, connecting }: { me: Me | null; onConnect: () => void; connecting: boolean }) {
  const maturing = me?.holderSince && me.holderTier > 0 && me.holderMult < (me.holderTier === 2 ? 5 : 2.5)
  return (
    <div className="info">
      <h3>👛 Phantom wallet · Holder Boost</h3>
      <p>Hold $JSLAP in your linked Phantom wallet and all your ranked scores are multiplied:</p>
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
        <li>Hold the tokens for at least {HOLDER_HOLD_MINUTES} minutes to activate it.</li>
        <li>If you sell below your tier, the boost drops at once.</li>
        <li>One wallet per Telegram account. Linking only needs a signature: it costs nothing and never moves funds.</li>
      </ul>
      <ul>
        <li>🥊 Holders also get the <b>Golden Gauntlet</b> skin and enter the <b>Holders League</b>.</li>
      </ul>
      {me?.wallet ? (
        <p className="me">
          Linked: {shortAddr(me.wallet)} · {maturing ? `maturing (${HOLDER_HOLD_MINUTES} min)…` : `holder boost x${me.holderMult}`}
        </p>
      ) : null}
      {inTelegram() && (
        <button className="btn ghost small" onClick={onConnect} disabled={connecting}>
          {connecting ? 'OPENING PHANTOM…' : me?.wallet ? 'CHANGE WALLET' : 'CONNECT PHANTOM'}
        </button>
      )}
      <p className="warn">⚠️ Crypto is high risk. Never buy what you cannot afford to lose. This is not financial advice.</p>
    </div>
  )
}

function CommunityLinks() {
  return (
    <div className="community">
      <p>Join the community</p>
      <div className="links">
        <button className="chip" onClick={() => openLink(LINKS.channel)}>
          📣 Channel
        </button>
        <button className="chip" onClick={() => openLink(LINKS.chat)}>
          💬 Chat
        </button>
        <button className="chip" onClick={() => openLink(LINKS.twitter)}>
          𝕏 BertoBCN
        </button>
      </div>
      <p className="footlinks">
        <a href={LINKS.rules} onClick={e => (e.preventDefault(), openLink(LINKS.rules))}>
          Rules
        </a>
        {' · '}
        <a href={LINKS.privacy} onClick={e => (e.preventDefault(), openLink(LINKS.privacy))}>
          Privacy
        </a>
      </p>
    </div>
  )
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu')
  const [tab, setTab] = useState<'weekly' | 'monthly' | 'alltime' | 'holders'>('weekly')
  const [practice, setPractice] = useState(false)
  const [game, setGame] = useState<GameState>(newGame)
  const [best, setBest] = useState(loadBest)
  const [popups, setPopups] = useState<Popup[]>([])
  const [muted, setMutedState] = useState(false)
  const [shake, setShake] = useState(false)
  const [flash, setFlash] = useState<'' | 'rug' | 'pump' | 'gold'>('')
  const [board, setBoard] = useState<Leaderboard | null>(null)
  const [boardStatus, setBoardStatus] = useState<Load>('idle')
  const [submitted, setSubmitted] = useState<SubmitResult | null>(null)
  const [starting, setStarting] = useState(false)
  const [offline, setOffline] = useState(false)
  const [curve, setCurve] = useState<Curve | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [card, setCard] = useState<string | null>(null)
  const gameRef = useRef(game)
  const popupId = useRef(0)
  const sessionRef = useRef<Session | null>(null)
  const tapsRef = useRef<Tap[]>([])

  const me = board?.me ?? null
  const community = me?.community ?? submitted?.community ?? null
  // Ranked mode needs Telegram + a linked Phantom wallet; otherwise the game is practice only
  const canRank = inTelegram() && !!me?.wallet
  const golden = (me?.holderTier ?? 0) > 0 // Golden Gauntlet skin for holders

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
    // Load the leaderboard (boosts, wallet) and the bonding curve when the game opens
    void loadBoard()
    const loadCurve = () => fetchCurve().then(setCurve, () => undefined)
    void loadCurve()
    const t = setInterval(loadCurve, 30_000)
    return () => clearInterval(t)
  }, [loadBoard])

  // When the round ends: submit the score (Telegram only) and refresh the leaderboard
  const finishRound = useCallback(
    async (score: number) => {
      setSubmitted(null)
      const session = sessionRef.current
      sessionRef.current = null
      if (session && score > 0) {
        try {
          setSubmitted(await submitScore(session.sessionId, score, tapsRef.current))
        } catch {
          /* offline: the local record is still saved */
        }
      }
      await loadBoard()
    },
    [loadBoard],
  )

  // Game loop
  useEffect(() => {
    if (screen !== 'playing') return
    // setInterval instead of requestAnimationFrame: some webviews don't fire rAF reliably.
    // The game advances in fixed STEP_MS steps so the server can replay it exactly.
    let last = performance.now()
    let acc = 0
    const timer = setInterval(() => {
      const now = performance.now()
      acc += Math.min(100, now - last)
      last = now
      let next = gameRef.current
      while (acc >= STEP_MS && !next.over) {
        const [s, events] = tick(next)
        handleEvents(events)
        next = s
        acc -= STEP_MS
      }
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

  const start = async () => {
    if (starting) return
    let seed: number | undefined
    sessionRef.current = null
    setOffline(false)
    setCard(null)
    setPractice(!canRank)
    if (canRank) {
      // Ranked game: the server gives the seed and keeps it to verify the game
      setStarting(true)
      try {
        sessionRef.current = await startSession()
        seed = sessionRef.current.seed
      } catch (e) {
        if (e instanceof ApiError && e.code === 'wallet_required') {
          setPractice(true)
          void loadBoard()
        } else {
          setOffline(true) // offline: you can play, but it won't count for the leaderboard
        }
      }
      setStarting(false)
    }
    sfx.start()
    setPopups([])
    tapsRef.current = []
    commit(newGame(seed))
    setScreen('playing')
  }

  const onSlap = (hole: number, trusted: boolean) => {
    const s = gameRef.current
    if (s.over) return
    tapsRef.current.push([s.elapsed, hole, trusted ? 1 : 0])
    const [next, events] = slap(s, hole)
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

  const connectWallet = async () => {
    setConnecting(true)
    try {
      const { url } = await startWalletLink()
      openLink(url)
    } catch {
      /* the button stays available to retry */
    }
    setConnecting(false)
  }

  const makeCard = async () => {
    const url = await drawScoreCard({ name: playerName(), score: game.score, slaps: game.slaps, rank: submitted?.rank })
    if (!(await shareCardFile(url))) setCard(url)
  }

  const secondsLeft = Math.max(0, Math.ceil((game.duration - game.elapsed) / 1000))
  const combo = comboMultiplier(game.streak)
  const pump = pumpActive(game)
  const final = finalPump(game)

  return (
    <main className={`app ${shake ? 'shake' : ''} ${flash ? `flash-${flash}` : ''} ${golden ? 'golden' : ''}`}>
      <button className="mute" onClick={toggleMute} aria-label={muted ? 'Sound on' : 'Mute'}>
        {muted ? '🔇' : '🔊'}
      </button>

      {screen === 'menu' && (
        <section className="panel">
          <img className="logo" src="/slap.jpg" alt="" width="120" height="120" />
          <h1 className="title">
            JEET
            <br />
            SLAPPER
          </h1>
          <p className="tagline">Stop staring at the red candles. Slap the jeets.</p>
          <CurveBar curve={curve} />
          <Legend />
          <button className="btn" onClick={start}>
            {starting ? 'LOADING…' : canRank ? '⚔️ PLAY RANKED' : inTelegram() ? 'PRACTICE' : 'PLAY DEMO'}
          </button>
          <button className="btn ghost" onClick={openRanking}>
            🏆 RANKING & PRIZES
          </button>
          <p className="muted">Your record: {best}</p>
          {inTelegram() ? (
            <p className="muted">
              Hi {playerName()}
              {canRank ? ' · ranked mode ✅' : ''}
              {golden ? ' · 🥊 Golden Gauntlet' : ''}
              {community ? ` · 📣 x${COMMUNITY_BOOST}` : ''}
            </p>
          ) : (
            <p className="demo">Demo mode: games don't count. Open the game in Telegram to compete.</p>
          )}
          {inTelegram() && !me?.wallet && boardStatus !== 'loading' && (
            <RankedLock onConnect={() => void connectWallet()} connecting={connecting} />
          )}
          {inTelegram() && <Boosts me={me} onRefresh={() => void loadBoard()} />}
          <CommunityLinks />
        </section>
      )}

      {screen === 'playing' && (
        <section className="play">
          <header className="hud">
            <div>
              <small>SCORE</small>
              <b>{game.score}</b>
            </div>
            <div>
              <small>COMBO</small>
              <b className={combo > 1 ? 'hot' : ''}>x{combo}</b>
            </div>
            <div>
              <small>TIME</small>
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
              <button
                key={i}
                className="hole"
                onPointerDown={e => onSlap(i, e.isTrusted)}
                aria-label={`Hole ${i + 1}`}
              >
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
          <h2 className="title small">ROUND OVER</h2>
          <p className="big">{game.score}</p>
          <p className="muted">
            {game.slaps} slaps · {game.escaped} jeets escaped
          </p>
          {game.score >= best && game.score > 0 && <p className="record">NEW RECORD!</p>}
          <p className="muted">Your record: {best}</p>
          {submitted?.counted && (
            <p className="me">
              Global rank: #{submitted.rank} · {submitted.ranked} pts
              {submitted.community ? ` (📣 x${COMMUNITY_BOOST})` : ''}
              {submitted.replayed ? ' · ✅ verified' : ''}
            </p>
          )}
          {submitted && !submitted.counted && (
            <p className="rejected">
              {submitted.status === 'suspicious' ? '🔍 Game under review' : "🚫 This game doesn't count for the ranking"}
              {submitted.reason ? `: ${submitted.reason}` : ''}
            </p>
          )}
          {offline && <p className="muted">Offline: this game doesn't count for the ranking.</p>}
          {!inTelegram() && <p className="muted">Open the game in Telegram to enter the ranking.</p>}
          {inTelegram() && practice && (
            <RankedLock onConnect={() => void connectWallet()} connecting={connecting} />
          )}
          <button className="btn" onClick={start}>
            {canRank ? 'PLAY RANKED AGAIN' : 'PLAY AGAIN'}
          </button>
          {game.score > 0 && (
            <div className="share">
              <button className="chip" onClick={() => shareOnX(game.score, game.slaps, submitted?.rank)}>
                𝕏 Share
              </button>
              <button className="chip" onClick={() => shareOnTelegram(game.score, game.slaps, submitted?.rank)}>
                ✈️ Challenge a friend
              </button>
              <button className="chip" onClick={() => void makeCard()}>
                🖼️ Score card
              </button>
            </div>
          )}
          {card && (
            <div className="cardview">
              <img src={card} alt="Your score card" />
              <p className="muted">Long-press the image to save it, then post it on X 📸</p>
              <button className="chip" onClick={() => setCard(null)}>
                Close
              </button>
            </div>
          )}
          <button className="btn ghost" onClick={() => setScreen('menu')}>
            MENU
          </button>
          {inTelegram() && !community && (
            <p className="muted">
              Tip: join the{' '}
              <a href={LINKS.channel} onClick={e => (e.preventDefault(), openLink(LINKS.channel))}>
                channel
              </a>{' '}
              and your record counts x{COMMUNITY_BOOST}.
            </p>
          )}
          <p className="muted">Invite link: {inviteLink().replace('https://', '')}</p>
        </section>
      )}

      {screen === 'ranking' && (
        <section className="panel">
          <h2 className="title small">🏆 RANKING</h2>
          <div className="tabs">
            {(
              [
                ['weekly', 'WEEK'],
                ['monthly', 'MONTH'],
                ['alltime', 'ALL-TIME'],
                ['holders', '👛 HOLDERS'],
              ] as const
            ).map(([key, label]) => (
              <button key={key} className={tab === key ? 'on' : ''} onClick={() => setTab(key)}>
                {label}
              </button>
            ))}
          </div>
          {boardStatus === 'loading' && !board && <p className="muted">Loading ranking…</p>}
          {boardStatus === 'error' && !board && <p className="muted">Couldn't load the ranking.</p>}
          {board && tab === 'weekly' && (
            <TournamentTable t={board.weekly} label={`Week of ${board.weekly.week} · ends Sunday 23:59 UTC`} prizes={WEEKLY_PRIZES} />
          )}
          {board && tab === 'monthly' && (
            <TournamentTable t={board.monthly} label={`Month ${board.monthly.month?.slice(0, 7)} · ends last day 23:59 UTC`} prizes={MONTHLY_PRIZES} />
          )}
          {board && tab === 'alltime' && <AllTimeTable board={board} rows={board.top} empty="No scores yet. Be the first!" />}
          {board && tab === 'holders' && (
            <>
              <p className="muted">Holders League: only players holding $JSLAP in their linked wallet.</p>
              <AllTimeTable board={board} rows={board.holders} empty="No holders in the ranking yet." />
            </>
          )}
          {!inTelegram() && <p className="muted">Open the game in Telegram to enter the ranking.</p>}
          {inTelegram() && !me?.wallet && <RankedLock onConnect={() => void connectWallet()} connecting={connecting} />}
          <button className="btn" onClick={start}>
            {canRank ? '⚔️ PLAY RANKED' : 'PRACTICE'}
          </button>
          <button className="btn ghost" onClick={() => setScreen('menu')}>
            MENU
          </button>
          <Prizes />
          <div className="info">
            <p>
              🛡️ <b>Anti-cheat</b>: every game goes through a bot detector. Games that would win a prize or enter a top 3
              are replayed in full by the server to check they are possible and human (✅ verified). Bot and script games
              don't count.
            </p>
          </div>
          {inTelegram() && <Boosts me={me} onRefresh={() => void loadBoard()} />}
          <HolderInfo me={me} onConnect={() => void connectWallet()} connecting={connecting} />
          <CommunityLinks />
        </section>
      )}
    </main>
  )
}
