import { addDays, differenceInCalendarWeeks, format, startOfWeek } from 'date-fns'

export const fmt = (d: Date) => format(d, 'yyyy-MM-dd')

export const today = () => fmt(new Date())

export function mondayOf(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 })
}

export function weekDays(mondayIso: string): string[] {
  const monday = new Date(mondayIso + 'T00:00:00')
  return Array.from({ length: 7 }, (_, i) => fmt(addDays(monday, i)))
}

/** true if `mondayIso` is an even number of weeks after `anchorMondayIso` (i.e. "week A"). */
export function isWeekA(mondayIso: string, anchorMondayIso: string): boolean {
  const monday = new Date(mondayIso + 'T00:00:00')
  const anchor = new Date(anchorMondayIso + 'T00:00:00')
  const diff = differenceInCalendarWeeks(monday, anchor, { weekStartsOn: 1 })
  return ((diff % 2) + 2) % 2 === 0
}

export const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function niceDate(iso: string): string {
  return format(new Date(iso + 'T00:00:00'), 'EEE d MMM')
}
