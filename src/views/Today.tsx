import { useState } from 'react'
import Card from '../components/Card'
import DateNav from '../components/DateNav'
import ElephantsPanel from '../components/ElephantsPanel'
import RatingPicker from '../components/RatingPicker'
import { today } from '../lib/dates'
import { dayTypeFor } from '../lib/schedule'
import { useLocalStorageMap } from '../lib/storage'
import { useSchedule } from '../lib/useSchedule'
import { DAY_TYPE_LABEL, emptyEntry, type DailyEntry } from '../lib/types'

const DAY_HINTS: Record<string, string> = {
  work: 'Just show up. No household elephant today.',
  recovery: 'Genuinely low-demand. No admin marathons, no big projects.',
  kids: "You're off work, but this isn't automatically recovery — protect some of it anyway.",
  leave: 'Used deliberately. Let yourself actually rest.',
  weekend: 'Family / flexible.',
  off: 'Free day.',
}

const CHECKLIST_ITEMS: { key: keyof DailyEntry['checklist']; label: string }[] = [
  { key: 'ifWindow', label: 'Ate within eating window' },
  { key: 'walk', label: 'Daily walk' },
  { key: 'water', label: 'Water' },
  { key: 'mealPlanned', label: 'Meal planned' },
  { key: 'householdTask', label: 'One household task (max)' },
  { key: 'recoveryBlock', label: 'Recovery block protected' },
  { key: 'bedtimeRoutine', label: 'Bedtime routine' },
]

export default function Today() {
  const [date, setDate] = useState(today())
  const { pattern, overrides } = useSchedule()
  const { get, set } = useLocalStorageMap<DailyEntry>('shamo.entries')
  const entry = get(date, emptyEntry(date))

  const update = (updater: (prev: DailyEntry) => DailyEntry) =>
    set(date, updater, emptyEntry(date))

  const dayType = dayTypeFor(date, pattern, overrides)
  const lowEnergy = (entry.morningEnergy ?? 0) > 0 && (entry.morningEnergy ?? 0) <= 2

  return (
    <div className="space-y-4">
      <DateNav date={date} onChange={setDate} label={DAY_TYPE_LABEL[dayType]} />

      <p className="text-center text-sm text-[var(--text-soft)]">{DAY_HINTS[dayType]}</p>

      {lowEnergy && (
        <Card className="border-[var(--leave)] bg-[var(--leave-bg)]">
          <p className="text-sm font-medium text-[var(--text)]">
            Today's minimum: a short walk + dinner + one small task. Everything else can move —
            nothing here is a failure.
          </p>
        </Card>
      )}

      <Card title="Energy & reflection">
        <div className="space-y-4">
          <div>
            <p className="mb-1 text-sm font-medium">Morning energy</p>
            <RatingPicker
              value={entry.morningEnergy}
              onChange={(v) => update((p) => ({ ...p, morningEnergy: v }))}
              lowLabel="empty"
              highLabel="full"
            />
          </div>
          <div>
            <p className="mb-1 text-sm font-medium">Afternoon energy</p>
            <RatingPicker
              value={entry.afternoonEnergy}
              onChange={(v) => update((p) => ({ ...p, afternoonEnergy: v }))}
              lowLabel="empty"
              highLabel="full"
            />
          </div>
          <div>
            <p className="mb-1 text-sm font-medium">Overwhelm</p>
            <RatingPicker
              value={entry.overwhelm}
              onChange={(v) => update((p) => ({ ...p, overwhelm: v }))}
              lowLabel="calm"
              highLabel="overwhelmed"
            />
          </div>
          <div>
            <p className="mb-1 text-sm font-medium">Sleep quality (last night)</p>
            <RatingPicker
              value={entry.sleepQuality}
              onChange={(v) => update((p) => ({ ...p, sleepQuality: v }))}
              lowLabel="poor"
              highLabel="great"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">What worked well today?</label>
            <textarea
              value={entry.wentWell ?? ''}
              onChange={(ev) => update((p) => ({ ...p, wentWell: ev.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--recovery)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">What drained me?</label>
            <textarea
              value={entry.drainedMe ?? ''}
              onChange={(ev) => update((p) => ({ ...p, drainedMe: ev.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--recovery)]"
            />
          </div>
        </div>
      </Card>

      <Card title="Today's plan">
        <ul className="space-y-2">
          {CHECKLIST_ITEMS.map(({ key, label }) => (
            <li key={key}>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={entry.checklist[key]}
                  onChange={(ev) =>
                    update((p) => ({
                      ...p,
                      checklist: { ...p.checklist, [key]: ev.target.checked },
                    }))
                  }
                  className="h-4 w-4 rounded border-[var(--border)] accent-[var(--work)]"
                />
                {label}
              </label>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Elephants">
        <ElephantsPanel entry={entry} onChange={update} />
      </Card>
    </div>
  )
}
