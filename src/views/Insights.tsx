import { addDays, format } from 'date-fns'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Card from '../components/Card'
import { fmt, today } from '../lib/dates'
import { dayTypeFor } from '../lib/schedule'
import { useLocalStorageMap } from '../lib/storage'
import { useSchedule } from '../lib/useSchedule'
import type { DailyEntry } from '../lib/types'

const TREND_DAYS = 14
const BALANCE_DAYS = 7

export default function Insights() {
  const { map } = useLocalStorageMap<DailyEntry>('shamo.entries')
  const { pattern, overrides } = useSchedule()

  const trendDates = Array.from({ length: TREND_DAYS }, (_, i) =>
    fmt(addDays(new Date(today() + 'T00:00:00'), i - (TREND_DAYS - 1))),
  )
  const trendData = trendDates.map((d) => {
    const e = map[d]
    return {
      date: format(new Date(d + 'T00:00:00'), 'd/M'),
      Morning: e?.morningEnergy ?? null,
      Afternoon: e?.afternoonEnergy ?? null,
      Overwhelm: e?.overwhelm ?? null,
      Sleep: e?.sleepQuality ?? null,
    }
  })
  const hasTrendData = trendDates.some((d) => map[d])

  const balanceDates = Array.from({ length: BALANCE_DAYS }, (_, i) =>
    fmt(addDays(new Date(today() + 'T00:00:00'), i - (BALANCE_DAYS - 1))),
  )
  const n = balanceDates.length
  let work = 0
  let movement = 0
  let recovery = 0
  let children = 0
  let home = 0
  let self = 0
  for (const d of balanceDates) {
    const e = map[d]
    const type = dayTypeFor(d, pattern, overrides)
    if (type === 'work') work += 1
    if (type === 'kids') children += 1
    if (e?.checklist.walk) movement += 1
    if (e?.checklist.recoveryBlock) recovery += 1
    if (e?.checklist.householdTask) home += 1
    if (e?.checklist.bedtimeRoutine) self += 1
  }
  const workDaysScheduled = balanceDates.filter(
    (d) => dayTypeFor(d, pattern, overrides) === 'work',
  ).length
  const kidsDaysScheduled = balanceDates.filter(
    (d) => dayTypeFor(d, pattern, overrides) === 'kids',
  ).length

  const pct = (v: number, denom: number) => (denom === 0 ? 0 : Math.round((v / denom) * 100))

  const balanceData = [
    { area: 'Work', value: pct(work, workDaysScheduled || n) },
    { area: 'Movement', value: pct(movement, n) },
    { area: 'Recovery', value: pct(recovery, n) },
    { area: 'Children', value: pct(children, kidsDaysScheduled || n) },
    { area: 'Home', value: pct(home, n) },
    { area: 'Self', value: pct(self, n) },
  ]

  return (
    <div className="space-y-4">
      <Card title="Energy, overwhelm & sleep" subtitle="Last 14 days">
        {hasTrendData ? (
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[1, 5]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="Morning" stroke="var(--work)" connectNulls />
                <Line type="monotone" dataKey="Afternoon" stroke="var(--recovery)" connectNulls />
                <Line type="monotone" dataKey="Overwhelm" stroke="var(--danger)" connectNulls />
                <Line type="monotone" dataKey="Sleep" stroke="var(--kids)" connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-[var(--text-soft)]">
            Log a few days on the Today tab to see trends here.
          </p>
        )}
      </Card>

      <Card
        title="Weekly balance"
        subtitle="Did I balance work, movement, recovery, children, home and myself? (last 7 days)"
      >
        <div className="h-64 w-full">
          <ResponsiveContainer>
            <RadarChart data={balanceData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="area" tick={{ fontSize: 12 }} />
              <Radar
                dataKey="value"
                stroke="var(--recovery)"
                fill="var(--recovery)"
                fillOpacity={0.35}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}
