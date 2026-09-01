import { mondayOf, today } from './dates'
import { useLocalStorage } from './storage'
import { DEFAULT_PATTERN, type DayOverrides, type WeekPattern } from './types'

export function useSchedule() {
  const [pattern, setPattern] = useLocalStorage<WeekPattern>('shamo.pattern', {
    ...DEFAULT_PATTERN,
    anchorMonday: mondayOf(new Date(today())).toISOString().slice(0, 10),
  })
  const [overrides, setOverrides] = useLocalStorage<DayOverrides>('shamo.overrides', {})

  return { pattern, setPattern, overrides, setOverrides }
}
