import { useState } from 'react'
import { addDays } from 'date-fns'
import Card from '../components/Card'
import DateNav from '../components/DateNav'
import ElephantsPanel from '../components/ElephantsPanel'
import { fmt, niceDate, today } from '../lib/dates'
import { useLocalStorageMap } from '../lib/storage'
import { emptyEntry, type DailyEntry } from '../lib/types'

export default function Elephants() {
  const [date, setDate] = useState(today())
  const { get, set, map } = useLocalStorageMap<DailyEntry>('shamo.entries')
  const entry = get(date, emptyEntry(date))

  const update = (updater: (prev: DailyEntry) => DailyEntry) =>
    set(date, updater, emptyEntry(date))

  const recentDays = Array.from({ length: 7 }, (_, i) =>
    fmt(addDays(new Date(today() + 'T00:00:00'), -i)),
  ).filter((d) => d !== date)

  return (
    <div className="space-y-4">
      <DateNav date={date} onChange={setDate} />

      <Card title="Elephants">
        <ElephantsPanel entry={entry} onChange={update} />
      </Card>

      <Card title="Last 7 days">
        <ul className="space-y-2 text-sm">
          {recentDays.map((d) => {
            const e = map[d]
            if (!e || e.elephants.length === 0) {
              return (
                <li key={d} className="flex justify-between text-[var(--text-soft)]">
                  <span>{niceDate(d)}</span>
                  <span>—</span>
                </li>
              )
            }
            return (
              <li key={d} className="flex justify-between gap-3">
                <span className="shrink-0 text-[var(--text-soft)]">{niceDate(d)}</span>
                <span className="text-right">
                  {e.elephants.map((el) => (
                    <span
                      key={el.id}
                      className={`ml-2 inline-block ${el.done ? 'text-[var(--work)]' : ''}`}
                    >
                      {el.done ? '✓' : '·'} {el.title}
                    </span>
                  ))}
                </span>
              </li>
            )
          })}
        </ul>
      </Card>
    </div>
  )
}
