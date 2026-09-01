import { useState } from 'react'
import { addWeeks, format } from 'date-fns'
import Card from '../components/Card'
import { fmt, mondayOf, today, weekDays, weekdayLabels } from '../lib/dates'
import { dayTypeFor, DAY_TYPE_COLORS } from '../lib/schedule'
import { useLocalStorage } from '../lib/storage'
import { useSchedule } from '../lib/useSchedule'
import { DAY_TYPE_LABEL, type DayType } from '../lib/types'

const CYCLE: DayType[] = ['work', 'recovery', 'kids', 'leave', 'weekend', 'off']
const WEEKS_SHOWN = 6

export default function Week() {
  const { pattern, setPattern, overrides, setOverrides } = useSchedule()
  const [viewStart, setViewStart] = useState(fmt(mondayOf(new Date(today()))))
  const [leaveTotal, setLeaveTotal] = useLocalStorage('shamo.leaveTotal', 20)
  const [showSettings, setShowSettings] = useState(false)

  const leaveUsed = Object.values(overrides).filter((t) => t === 'leave').length

  const cycleDay = (date: string) => {
    const current = dayTypeFor(date, pattern, overrides)
    const idx = CYCLE.indexOf(current)
    const next = CYCLE[(idx + 1) % CYCLE.length]
    const natural = dayTypeFor(date, pattern, {})
    setOverrides((prev) => {
      const copy = { ...prev }
      if (next === natural) delete copy[date]
      else copy[date] = next
      return copy
    })
  }

  const weekStarts = Array.from({ length: WEEKS_SHOWN }, (_, i) =>
    fmt(addWeeks(new Date(viewStart + 'T00:00:00'), i)),
  )

  return (
    <div className="space-y-4">
      <Card title="Leave" subtitle="Days used this restart">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-lg font-semibold">{leaveUsed}</span>
          <span className="text-[var(--text-soft)]">/</span>
          <input
            type="number"
            value={leaveTotal}
            onChange={(ev) => setLeaveTotal(Number(ev.target.value) || 0)}
            className="w-14 rounded border border-[var(--border)] px-1 py-0.5 text-sm"
          />
          <span className="text-[var(--text-soft)]">days</span>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setViewStart(fmt(addWeeks(new Date(viewStart + 'T00:00:00'), -WEEKS_SHOWN)))}
            className="rounded-full border border-[var(--border)] px-3 py-1 text-sm"
          >
            ← earlier
          </button>
          <button
            type="button"
            onClick={() => setShowSettings((s) => !s)}
            className="text-xs text-[var(--text-soft)] underline"
          >
            {showSettings ? 'hide rhythm settings' : 'edit rhythm'}
          </button>
          <button
            type="button"
            onClick={() => setViewStart(fmt(addWeeks(new Date(viewStart + 'T00:00:00'), WEEKS_SHOWN)))}
            className="rounded-full border border-[var(--border)] px-3 py-1 text-sm"
          >
            later →
          </button>
        </div>

        <p className="mt-2 text-center text-xs text-[var(--text-soft)]">
          Tap a day to change its type: work → recovery → kids → leave → weekend → off.
        </p>

        <div className="mt-3 space-y-2">
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-[var(--text-soft)]">
            {weekdayLabels.map((l) => (
              <div key={l}>{l}</div>
            ))}
          </div>
          {weekStarts.map((ws) => (
            <div key={ws} className="grid grid-cols-7 gap-1">
              {weekDays(ws).map((d) => {
                const type = dayTypeFor(d, pattern, overrides)
                const colors = DAY_TYPE_COLORS[type]
                const isToday = d === today()
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => cycleDay(d)}
                    title={DAY_TYPE_LABEL[type]}
                    style={{ background: colors.bg, color: colors.text }}
                    className={`flex h-12 flex-col items-center justify-center rounded-lg text-xs font-medium ${
                      isToday ? 'ring-2 ring-offset-1 ring-[var(--text)]' : ''
                    }`}
                  >
                    <span>{format(new Date(d + 'T00:00:00'), 'd')}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          {CYCLE.map((t) => (
            <span key={t} className="flex items-center gap-1">
              <span
                className="h-3 w-3 rounded-full"
                style={{ background: DAY_TYPE_COLORS[t].text }}
              />
              {DAY_TYPE_LABEL[t]}
            </span>
          ))}
        </div>
      </Card>

      {showSettings && (
        <Card title="Rhythm settings" subtitle="The repeating 2-week work pattern (Mon–Fri)">
          <div className="space-y-3 text-sm">
            <div>
              <p className="mb-1 font-medium">Week A anchor (Monday)</p>
              <input
                type="date"
                value={pattern.anchorMonday}
                onChange={(ev) => setPattern((p) => ({ ...p, anchorMonday: ev.target.value }))}
                className="rounded border border-[var(--border)] px-2 py-1"
              />
            </div>
            {(['weekA', 'weekB'] as const).map((wk) => (
              <div key={wk}>
                <p className="mb-1 font-medium">{wk === 'weekA' ? 'Week A' : 'Week B'}</p>
                <div className="grid grid-cols-5 gap-1">
                  {pattern[wk].map((t, i) => (
                    <select
                      key={i}
                      value={t}
                      onChange={(ev) =>
                        setPattern((p) => ({
                          ...p,
                          [wk]: p[wk].map((old, idx) =>
                            idx === i ? (ev.target.value as DayType) : old,
                          ),
                        }))
                      }
                      className="rounded border border-[var(--border)] px-1 py-1 text-xs"
                    >
                      <option value="work">Work</option>
                      <option value="recovery">Recovery</option>
                      <option value="off">Off</option>
                    </select>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
