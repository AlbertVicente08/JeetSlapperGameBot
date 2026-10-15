// Tournament dates (UTC). Weeks run Monday 00:00 → Sunday 23:59; months are calendar months.

/** Monday (UTC) of the previous week, as YYYY-MM-DD. */
export function lastWeekStart(now = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const sinceMonday = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - sinceMonday - 7)
  return d.toISOString().slice(0, 10)
}

/** First day (UTC) of the previous month, as YYYY-MM-DD. */
export function lastMonthStart(now = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString().slice(0, 10)
}
