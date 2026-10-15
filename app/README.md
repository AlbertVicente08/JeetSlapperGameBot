# Jeet Slapper: juego, landing y API

- **Landing**: `index.html` → https://jeet-slapper.pages.dev
- **Juego (Telegram Mini App)**: `play/index.html` + `src/` → https://jeet-slapper.pages.dev/play/
- **API (Cloudflare Pages Functions)**: `functions/api/*` con la lógica compartida en `server/`
- **Base de datos**: Supabase (migraciones en `../supabase/migrations/`)

## Juego

Rondas de 30 s en 12 casillas:

| | |
|---|---|
| 🧻 Jeet | +10 × multiplicador |
| 🪙 Jeet dorado | +50 × multiplicador (rápido y raro) |
| 🐋 Ballena | 3 golpes: +5, +5, +50 |
| 🚀 PUMP | puntos x2 durante 5 s |
| ⏱️ Reloj | +3 s (máximo +9 s) |
| 💎 Diamond hand | −25 y rompe la racha |
| 💣 Rug | −50, rompe la racha y vacía el tablero |
| 💨 Jeet escapado | −5 |

- **Combo**: sube 0,5x cada 5 aciertos seguidos (máximo x3).
- **FINAL PUMP**: los últimos 5 s cuentan x2.

El motor (`src/game/engine.ts`) es **determinista**: avanza en pasos de 20 ms con una semilla, así que el servidor puede repetir cualquier partida a partir de los toques.

## API

| Ruta | Qué hace |
|---|---|
| `POST /api/session` | Valida el initData de Telegram y crea una sesión con semilla (un solo uso) |
| `POST /api/score` | Detector de bots; si la partida entraría en el top 3, la repite entera; guarda el resultado en `games` y el récord en `players` |
| `POST /api/leaderboard` | Top 10 y tu posición; revisa si los jugadores siguen en el canal (Boost Comunidad x1,5) |
| `POST /api/bot` | Webhook del bot (`/start`), protegido con `TELEGRAM_WEBHOOK_SECRET` |

Secretos en Cloudflare: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. En local van en `.dev.vars` (no se sube a git).

## Comandos

Juego en local, sin API:
```bash
npm run dev
```

Juego + API en local (usa `.dev.vars`):
```bash
npm run build && npx wrangler pages dev --port 8788
```

Publicar:
```bash
npm run deploy
```

El estado del proyecto y los pendientes están en [`../ESTADO.md`](../ESTADO.md).
