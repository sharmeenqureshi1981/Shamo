import { useState } from 'react'
import { v4 as uuid } from 'uuid'
import type { DailyEntry, Elephant } from '../lib/types'
import BreakTimer from './BreakTimer'

interface Props {
  entry: DailyEntry
  onChange: (updater: (prev: DailyEntry) => DailyEntry) => void
}

const MAX_ELEPHANTS = 2

export default function ElephantsPanel({ entry, onChange }: Props) {
  const [draft, setDraft] = useState('')

  const addElephant = () => {
    const title = draft.trim()
    if (!title || entry.elephants.length >= MAX_ELEPHANTS) return
    const elephant: Elephant = { id: uuid(), title, done: false, breakTaken: false }
    onChange((prev) => ({ ...prev, elephants: [...prev.elephants, elephant] }))
    setDraft('')
  }

  const updateElephant = (id: string, patch: Partial<Elephant>) => {
    onChange((prev) => ({
      ...prev,
      elephants: prev.elephants.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }))
  }

  const removeElephant = (id: string) => {
    onChange((prev) => ({ ...prev, elephants: prev.elephants.filter((e) => e.id !== id) }))
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--text-soft)]">
        Max {MAX_ELEPHANTS} important 50-minute blocks today. Each one ends with a mandatory
        break — no stacking.
      </p>

      {entry.elephants.length === 0 && (
        <p className="rounded-xl border border-dashed border-[var(--border)] px-3 py-4 text-center text-sm text-[var(--text-soft)]">
          No elephants chosen yet.
        </p>
      )}

      <ul className="space-y-3">
        {entry.elephants.map((e) => (
          <li key={e.id} className="rounded-xl border border-[var(--border)] p-3">
            <div className="flex items-start gap-2">
              <button
                type="button"
                aria-label={e.done ? 'Mark not done' : 'Mark done'}
                onClick={() => updateElephant(e.id, { done: !e.done })}
                className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 ${
                  e.done ? 'border-[var(--work)] bg-[var(--work)]' : 'border-[var(--border)]'
                }`}
              />
              <span
                className={`flex-1 text-sm ${e.done ? 'text-[var(--text-soft)] line-through' : ''}`}
              >
                {e.title}
              </span>
              <button
                type="button"
                onClick={() => removeElephant(e.id)}
                aria-label="Remove"
                className="text-[var(--text-soft)] hover:text-[var(--danger)]"
              >
                ×
              </button>
            </div>

            {e.done && !e.breakTaken && (
              <div className="mt-2 pl-7">
                <BreakTimer onComplete={() => updateElephant(e.id, { breakTaken: true })} />
              </div>
            )}
            {e.done && e.breakTaken && (
              <p className="mt-2 pl-7 text-xs text-[var(--work)]">
                50 min done, break taken. Nicely paced.
              </p>
            )}
          </li>
        ))}
      </ul>

      {entry.elephants.length < MAX_ELEPHANTS && (
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(ev) => setDraft(ev.target.value)}
            onKeyDown={(ev) => ev.key === 'Enter' && addElephant()}
            placeholder="Name one important 50-min block…"
            className="flex-1 rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--recovery)]"
          />
          <button
            type="button"
            onClick={addElephant}
            className="rounded-lg bg-[var(--text)] px-3 py-2 text-sm text-white"
          >
            Add
          </button>
        </div>
      )}
    </div>
  )
}
