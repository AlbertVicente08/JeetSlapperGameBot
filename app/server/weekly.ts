// Weekly tournament dates (weeks run Monday 00:00 → Sunday 23:59 UTC).

/** Monday (UTC) of the previous week, as YYYY-MM-DD. */
export function lastWeekStart(now = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const sinceMonday = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - sinceMonday - 7)
  return d.toISOString().slice(0, 10)
}
