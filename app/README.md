# Jeet Slapper — juego (MVP)

Mini juego tipo "whack-a-mole" pensado como Telegram Mini App. Rondas de 30 s:

- 🧻 **Jeet** (SELL): abofetéalo, +10 × combo.
- 🐋 **Ballena** (DUMP, desde los 10 s): 3 golpes, +5 / +5 / +50 × combo.
- 💎 **Diamond hand** (HODL): no le pegues, −25 y pierdes la racha.
- Combo: +0,5x cada 5 aciertos seguidos (máx. 3x). Dejar escapar un jeet rompe la racha.

Ahora mismo está en **modo demo**: sin token, sin wallet, sin backend. El récord se guarda en el navegador.

## Arrancar en local

```bash
npm install
npm run dev
```

Abre http://localhost:5173 (mejor en vista móvil).

## Estructura

- `src/game/engine.ts`: lógica pura del juego (spawns, puntos, combo, niveles).
- `src/game/sound.ts`: sonidos retro con WebAudio (no usa ficheros de audio).
- `src/telegram.ts`: integración con el SDK de Telegram Mini Apps (vibración y nombre del jugador). Fuera de Telegram no hace nada.
- `src/App.tsx`: pantallas de menú, partida y resultados.

## Próximos pasos (Fase 2)

1. Desplegar en Cloudflare Pages y enlazarlo con `@BotFather` como Web App.
2. Leaderboard compartido (Cloudflare Pages Functions + Supabase), con validación HMAC del `initData` de Telegram.
3. Probarlo con gente real **antes** de pensar en el token.
