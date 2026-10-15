// Enlaces y boosts de la comunidad de BertoBCN.
export const LINKS = {
  channel: 'https://t.me/RealBertoBcn',
  chat: 'https://t.me/+aGQnR6gxz_oxNWY0',
  twitter: 'https://x.com/albertv_dev',
}

/** Multiplicador del ranking por estar en el canal (se aplica en el servidor). */
export const COMMUNITY_BOOST = 1.5

/** Minutos que hay que mantener los tokens para activar el Holder Boost. */
export const HOLDER_HOLD_MINUTES = 30

// Beneficios previstos para holders cuando exista el token (ver blueprint/02_PROJECT_SPECIFICATION.md).
export const HOLDER_TIERS = [
  { min: 0, label: 'Sin wallet', boost: 'x1' },
  { min: 100_000, label: '≥ 100.000 $JSLAP', boost: 'x2,5' },
  { min: 500_000, label: '≥ 500.000 $JSLAP', boost: 'x5' },
]
