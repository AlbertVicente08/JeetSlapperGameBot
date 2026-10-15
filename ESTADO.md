# Estado del proyecto Jeet Slapper / BertoBCN

**Última revisión**: 2026-10-15. Este archivo es la lista viva de lo hecho y lo pendiente. Los documentos de `blueprint/` son el plan original (de Antigravity, corregido); aquí se apunta lo que es real.

---

## ✅ Hecho y funcionando

| Qué | Dónde |
|---|---|
| Landing page (explicación, boosts, token, avisos de riesgo) | https://jeet-slapper.pages.dev |
| Juego en Telegram: 12 casillas, power-ups, bombas, FINAL PUMP | https://jeet-slapper.pages.dev/play/ |
| Bot @JeetSlapperGameBot: botón "Jugar", `/start` con botones, foto de perfil, descripción | Telegram |
| Ranking global con validación de Telegram (HMAC) | Supabase `players` |
| Boost Comunidad x1,5 (estar en el canal principal @RealBertoBcn) | ✅ activo: el bot es admin del canal |
| Anti-trampas: detector de bots en todas las partidas y repetición en el servidor para el top 3 (✅ verificada) | `app/server/anticheat.ts`, tabla `games` |
| Apartado Wallet Phantom / Holder Boost (solo informativo, "próximamente") | Juego y landing |
| Enlaces a canal, chat y X (@albertv_dev) | Juego, landing y bot |
| Documento de comunidad: embudo X → Telegram → proyectos, plan de 30 días | `blueprint/05_COMUNIDAD_BERTOBCN.md` |
| Imágenes de marca (bot, token, original) | `brand/` |
| Coste mensual: 0 € | Cloudflare Pages + Supabase gratis |

---

## 🔴 Pendiente urgente (te toca a ti)

- [x] **Añadir @JeetSlapperGameBot como administrador del canal** `t.me/RealBertoBcn` (hecho; si algún día lo quitas, el boost deja de funcionar).
- [ ] **Copia de seguridad del código**: ahora solo está en tu PC. Crea un repositorio **privado** en GitHub y súbelo (yo lo preparo si me pasas el nombre).
- [ ] **Guardar el `.env` en un gestor de contraseñas** (Bitwarden, 1Password…). Si pierdes el PC pierdes las claves.
- [ ] **Jugar una partida desde el móvil** para probar en real el anti-trampas: todavía no hay ninguna partida registrada con el sistema nuevo.
- [ ] **Reiniciar el ranking antes de abrirlo al público**: tu 904 es de una versión antigua del juego y no está verificado. Es una línea de SQL; dímelo y lo hago.
- [ ] **Aviso de privacidad**: se guardan tu id, tu usuario y tu nombre de Telegram, y tus partidas. En la UE (RGPD) hay que explicarlo. Hace falta una página corta `/privacidad` enlazada desde el juego y la landing.
- [ ] **Semana 1 del plan de comunidad** (`05`, sección 6): bio y hilo fijado en X, reglas fijadas y bot anti-spam en el chat (por ejemplo `@Rose`), invitar a 10–20 amigos.

## 🟡 Prometido en los documentos y aún sin hacer

### Sin token (se puede hacer ya)
- [ ] **Compartir récord en X**: imagen con tu puntuación y botón para publicarla (`02` §4.3, `05` §4).
- [ ] **Invitar amigos**: enlace `t.me/JeetSlapperGameBot?start=ref_TUID` con recompensa dentro del juego (`02` §3.3). Sin la energía del plan original (ver "Descartado").
- [ ] **Torneo y ranking semanal** publicado en el canal (temporadas) (`05` §4 y §6).
- [ ] **Comandos de IA en el bot**: `/roast` y `/slap` con Groq (la clave ya está en `.env`) (`03` prompt 4, `04` T-6h).
- [ ] **Avisarte por Telegram** cuando una partida del top 3 se rechace o quede en revisión, y una forma fácil de revisarlas (hoy solo se puede con SQL en Supabase).
- [ ] **Configurar la Mini App principal en BotFather** (Bot Settings → Configure Mini App → `https://jeet-slapper.pages.dev/play/`): da un enlace directo al juego y ayuda a que aparezca en el buscador de apps de Telegram.
- [ ] **Pack de stickers y kit de memes** (`04` T-36h).
- [ ] **Tests automáticos en el repo**: las pruebas del anti-trampas y de la API se hicieron con scripts temporales; conviene guardarlas en `app/` para repetirlas tras cada cambio.

### Solo si decides lanzar el token
- [ ] Conectar Phantom con firma (SIWS) y **una wallet por cuenta** (`02` §3.1).
- [ ] Holder Boost real: leer el saldo con Helius, 30 min de maduración y vuelta a x1 si vende (`02` §3.1).
- [ ] Barra de la bonding curve y precio dentro del juego (`02` §4.2).
- [ ] Bote del top 20: multisig de Squads con co-firmantes, 3 pagos y **bases del concurso publicadas** (`02` §3.2, `04` §6).
- [ ] Wallet limpia, precio del SOL del día, banner para pump.fun y DexScreener (`04` §6). El logo ya está: `brand/token-logo-1000.jpg`.
- [ ] Tras lanzar: publicar el CA **solo** en la landing y fijado en el canal.
- [ ] Revisión legal o fiscal si hay premios con valor económico (`05` §8).

## ⚪ Descartado o cambiado a propósito (respecto al plan de Antigravity)

| Plan original | Ahora | Por qué |
|---|---|---|
| Next.js 14 en Vercel | Vite + React en Cloudflare Pages | Vercel gratis no permite uso comercial |
| Upstash Redis, QuickNode, Gemini | No se usan (todavía) | Con Supabase basta; Gemini y QuickNode solo harían falta para la IA y el token |
| Energía: 20 por partida, 100 máx. | **Partidas ilimitadas** | Decisión tuya: jugar sin límite es lo interesante |
| Grupo alpha secreto y raids coordinadas | Beta pública, sin raids | Riesgo de manipulación de mercado (MiCA) y de reputación |
| Recompensa fija de 0,5 SOL al graduar | Comisiones de creador vigentes | pump.fun ya no lo hace así desde PumpSwap |
| Raydium | PumpSwap | Es adonde gradúa pump.fun ahora |
| Holder Boost con 1 h de maduración | 30 minutos | Decisión tuya |
| Roast público con @nombre a quien venda + quitar el 50% de los puntos | **Recomiendo no hacerlo**: basta con perder el boost | Señalar públicamente a personas concretas puede verse como acoso y da mala imagen |
| "Script atómico" de crear y comprar | La web de pump.fun ya crea y compra en la misma transacción | No hace falta programarlo |
| Jefe ballena global y fases según la curva real | Pendiente del token | Necesita datos on-chain |

## ⚠️ Riesgos y límites conocidos
- **Anti-trampas**: un bot que imite a un humano (unos 300 ms y con fallos) pasaría, pero con una puntuación de humano. Antes de dar premios, revisa siempre el top.
- **Supabase gratis se pausa tras 7 días sin actividad**: si nadie juega en una semana, el ranking deja de funcionar hasta que lo reactives con un clic en supabase.com.
- **Límites gratuitos**: Cloudflare 100.000 peticiones al día, Supabase 500 MB. De sobra para empezar.
- **Token**: más del 98% de los tokens de pump.fun no se gradúan. Los 100 € son capital de riesgo.
- **Documentos `01`–`04` y `PROJECT.md`**: son el plan original de Antigravity (en inglés y con tono de marketing). Lo que vale es este archivo y el código.

---

## Comandos útiles

```bash
npm --prefix app run dev
```
Juego en local (sin API): http://localhost:5173/play/

```bash
npm --prefix app run deploy
```
Publicar en https://jeet-slapper.pages.dev

Revisar partidas sospechosas (SQL en Supabase):
```sql
select created_at, telegram_id, score, status, reason, stats
from public.games where status <> 'ok' order by created_at desc limit 50;
```
