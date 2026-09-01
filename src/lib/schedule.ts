import { isWeekA, mondayOf } from './dates'
import type { DayOverrides, DayType, WeekPattern } from './types'

export function dayTypeFor(
  dateIso: string,
  pattern: WeekPattern,
  overrides: DayOverrides,
): DayType {
  if (overrides[dateIso]) return overrides[dateIso]

  const date = new Date(dateIso + 'T00:00:00')
  const weekday = date.getDay() // 0 = Sunday
  if (weekday === 0 || weekday === 6) return 'weekend'

  const monday = mondayOf(date)
  const mondayIso = monday.toISOString().slice(0, 10)
  const inWeekA = isWeekA(mondayIso, pattern.anchorMonday)
  const cols = inWeekA ? pattern.weekA : pattern.weekB
  return cols[weekday - 1]
}

export const DAY_TYPE_COLORS: Record<DayType, { text: string; bg: string }> = {
  work: { text: 'var(--work)', bg: 'var(--work-bg)' },
  recovery: { text: 'var(--recovery)', bg: 'var(--recovery-bg)' },
  kids: { text: 'var(--kids)', bg: 'var(--kids-bg)' },
  leave: { text: 'var(--leave)', bg: 'var(--leave-bg)' },
  weekend: { text: 'var(--off)', bg: 'var(--off-bg)' },
  off: { text: 'var(--off)', bg: 'var(--off-bg)' },
}
