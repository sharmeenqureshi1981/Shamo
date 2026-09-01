import { useState } from 'react'
import { addDays } from 'date-fns'
import { v4 as uuid } from 'uuid'
import Card from '../components/Card'
import { fmt, mondayOf, niceDate, today, weekDays, weekdayLabels } from '../lib/dates'
import { useLocalStorageMap } from '../lib/storage'
import { emptyWeekFoodHome, type GroceryDecision, type WeekFoodHome } from '../lib/types'

function currentMonday() {
  return fmt(mondayOf(new Date(today())))
}

export default function FoodHome() {
  const [weekStart, setWeekStart] = useState(currentMonday())
  const { get, set } = useLocalStorageMap<WeekFoodHome>('shamo.foodhome')
  const days = weekDays(weekStart)
  const week = get(weekStart, emptyWeekFoodHome(weekStart, days))

  const update = (updater: (prev: WeekFoodHome) => WeekFoodHome) =>
    set(weekStart, updater, emptyWeekFoodHome(weekStart, days))

  const shiftWeek = (delta: number) =>
    setWeekStart(fmt(addDays(new Date(weekStart + 'T00:00:00'), delta * 7)))

  const [draft, setDraft] = useState('')
  const addItem = () => {
    const text = draft.trim()
    if (!text) return
    update((p) => ({
      ...p,
      groceryList: [...p.groceryList, { id: uuid(), text, decision: null, done: false }],
    }))
    setDraft('')
  }

  const setDecision = (id: string, decision: GroceryDecision) =>
    update((p) => ({
      ...p,
      groceryList: p.groceryList.map((g) => (g.id === id ? { ...g, decision } : g)),
    }))

  const toggleDone = (id: string) =>
    update((p) => ({
      ...p,
      groceryList: p.groceryList.map((g) => (g.id === id ? { ...g, done: !g.done } : g)),
    }))

  const removeItem = (id: string) =>
    update((p) => ({ ...p, groceryList: p.groceryList.filter((g) => g.id !== id) }))

  const nextOrderItems = week.groceryList.filter((g) => g.decision === 'next-order')
  const openItems = week.groceryList.filter((g) => g.decision !== 'next-order')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => shiftWeek(-1)}
          className="rounded-full border border-[var(--border)] px-3 py-1 text-sm"
        >
          ←
        </button>
        <div className="text-center text-sm text-[var(--text-soft)]">
          Week of {niceDate(weekStart)}
        </div>
        <button
          type="button"
          onClick={() => shiftWeek(1)}
          className="rounded-full border border-[var(--border)] px-3 py-1 text-sm"
        >
          →
        </button>
      </div>

      <Card
        title="Do I really need this today?"
        subtitle="Catch the impulse trip to the shop before it happens."
      >
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(ev) => setDraft(ev.target.value)}
            onKeyDown={(ev) => ev.key === 'Enter' && addItem()}
            placeholder="What do you need?"
            className="flex-1 rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--recovery)]"
          />
          <button
            type="button"
            onClick={addItem}
            className="rounded-lg bg-[var(--text)] px-3 py-2 text-sm text-white"
          >
            Add
          </button>
        </div>
      </Card>

      <Card title="Grocery list" subtitle="Thu evening: finalise. Fri: place the order.">
        {openItems.length === 0 && (
          <p className="text-sm text-[var(--text-soft)]">Nothing on the list yet.</p>
        )}
        <ul className="space-y-2">
          {openItems.map((g) => (
            <li key={g.id} className="rounded-lg border border-[var(--border)] p-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleDone(g.id)}
                  aria-label={g.done ? 'Mark not done' : 'Mark done'}
                  className={`h-4 w-4 shrink-0 rounded border-2 ${
                    g.done ? 'border-[var(--work)] bg-[var(--work)]' : 'border-[var(--border)]'
                  }`}
                />
                <span className={`flex-1 text-sm ${g.done ? 'text-[var(--text-soft)] line-through' : ''}`}>
                  {g.text}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(g.id)}
                  aria-label="Remove"
                  className="text-[var(--text-soft)] hover:text-[var(--danger)]"
                >
                  ×
                </button>
              </div>
              {!g.decision && (
                <div className="mt-2 flex gap-2 pl-6 text-xs">
                  <button
                    type="button"
                    onClick={() => setDecision(g.id, 'today')}
                    className="rounded-full border border-[var(--danger)] px-2 py-1 text-[var(--danger)]"
                  >
                    yes, today
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision(g.id, 'wait')}
                    className="rounded-full border border-[var(--leave)] px-2 py-1 text-[var(--leave)]"
                  >
                    can wait
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision(g.id, 'next-order')}
                    className="rounded-full border border-[var(--work)] px-2 py-1 text-[var(--work)]"
                  >
                    add to next order
                  </button>
                </div>
              )}
              {g.decision && (
                <div className="mt-1 pl-6 text-xs text-[var(--text-soft)]">
                  {g.decision === 'today' && 'Getting it today.'}
                  {g.decision === 'wait' && 'Can wait.'}
                  <button
                    type="button"
                    onClick={() => setDecision(g.id, null)}
                    className="ml-2 underline"
                  >
                    change
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>

        {nextOrderItems.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium text-[var(--work)]">Saved for next order</p>
            <ul className="mt-1 space-y-1">
              {nextOrderItems.map((g) => (
                <li key={g.id} className="flex items-center justify-between text-sm">
                  <span>{g.text}</span>
                  <button
                    type="button"
                    onClick={() => removeItem(g.id)}
                    className="text-[var(--text-soft)] hover:text-[var(--danger)]"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <Card title="Meal plan">
        <ul className="space-y-2">
          {week.mealPlan.map((m, i) => (
            <li key={m.day} className="flex items-center gap-3">
              <span className="w-10 shrink-0 text-xs text-[var(--text-soft)]">
                {weekdayLabels[i]}
              </span>
              <input
                value={m.meal}
                onChange={(ev) =>
                  update((p) => ({
                    ...p,
                    mealPlan: p.mealPlan.map((row, idx) =>
                      idx === i ? { ...row, meal: ev.target.value } : row,
                    ),
                  }))
                }
                placeholder="—"
                className="flex-1 rounded-lg border border-[var(--border)] px-2 py-1 text-sm outline-none focus:border-[var(--recovery)]"
              />
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Home">
        <ul className="space-y-2 text-sm">
          <li>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={week.laundryDone}
                onChange={(ev) => update((p) => ({ ...p, laundryDone: ev.target.checked }))}
                className="h-4 w-4 accent-[var(--work)]"
              />
              Laundry done
            </label>
          </li>
          <li>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={week.cleanerScheduled}
                onChange={(ev) => update((p) => ({ ...p, cleanerScheduled: ev.target.checked }))}
                className="h-4 w-4 accent-[var(--work)]"
              />
              Cleaner scheduled (every 2 weeks)
            </label>
          </li>
          <li>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={week.orderPlaced}
                onChange={(ev) => update((p) => ({ ...p, orderPlaced: ev.target.checked }))}
                className="h-4 w-4 accent-[var(--work)]"
              />
              Online grocery order placed
            </label>
          </li>
        </ul>
      </Card>
    </div>
  )
}
