export type DayType = 'work' | 'recovery' | 'kids' | 'leave' | 'weekend' | 'off'

export const DAY_TYPE_LABEL: Record<DayType, string> = {
  work: 'Work',
  recovery: 'Recovery',
  kids: 'Kids / school holiday',
  leave: 'Annual leave',
  weekend: 'Weekend',
  off: 'Off',
}

export interface Elephant {
  id: string
  title: string
  done: boolean
  breakTaken: boolean
}

export interface DailyChecklist {
  ifWindow: boolean
  walk: boolean
  water: boolean
  mealPlanned: boolean
  householdTask: boolean
  recoveryBlock: boolean
  bedtimeRoutine: boolean
}

export const EMPTY_CHECKLIST: DailyChecklist = {
  ifWindow: false,
  walk: false,
  water: false,
  mealPlanned: false,
  householdTask: false,
  recoveryBlock: false,
  bedtimeRoutine: false,
}

export type Rating = 1 | 2 | 3 | 4 | 5

export interface DailyEntry {
  date: string // yyyy-MM-dd
  morningEnergy?: Rating
  afternoonEnergy?: Rating
  overwhelm?: Rating
  sleepQuality?: Rating
  wentWell?: string
  drainedMe?: string
  checklist: DailyChecklist
  elephants: Elephant[]
}

export function emptyEntry(date: string): DailyEntry {
  return { date, checklist: { ...EMPTY_CHECKLIST }, elephants: [] }
}

export type GroceryDecision = 'today' | 'wait' | 'next-order' | null

export interface GroceryItem {
  id: string
  text: string
  decision: GroceryDecision
  done: boolean
}

export interface MealPlanDay {
  day: string // yyyy-MM-dd
  meal: string
}

export interface WeekFoodHome {
  weekStart: string // yyyy-MM-dd, Monday
  mealPlan: MealPlanDay[]
  groceryList: GroceryItem[]
  laundryDone: boolean
  cleanerScheduled: boolean
  orderPlaced: boolean
}

export function emptyWeekFoodHome(weekStart: string, days: string[]): WeekFoodHome {
  return {
    weekStart,
    mealPlan: days.map((d) => ({ day: d, meal: '' })),
    groceryList: [],
    laundryDone: false,
    cleanerScheduled: false,
    orderPlaced: false,
  }
}

export interface WeekPattern {
  // Monday..Friday
  weekA: DayType[]
  weekB: DayType[]
  anchorMonday: string // yyyy-MM-dd, the Monday that starts weekA
}

export const DEFAULT_PATTERN: Omit<WeekPattern, 'anchorMonday'> = {
  weekA: ['work', 'recovery', 'work', 'recovery', 'work'],
  weekB: ['work', 'recovery', 'work', 'recovery', 'off'],
}

export type DayOverrides = Record<string, DayType>
