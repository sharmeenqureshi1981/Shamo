import { useState } from 'react'
import Today from './views/Today'
import Elephants from './views/Elephants'
import FoodHome from './views/FoodHome'
import Week from './views/Week'
import Insights from './views/Insights'

const TABS = [
  { key: 'today', label: 'Today', icon: '☀️', view: Today },
  { key: 'elephants', label: 'Elephants', icon: '🐘', view: Elephants },
  { key: 'food', label: 'Food & Home', icon: '🥕', view: FoodHome },
  { key: 'week', label: 'Week', icon: '📅', view: Week },
  { key: 'insights', label: 'Insights', icon: '📈', view: Insights },
] as const

type TabKey = (typeof TABS)[number]['key']

function App() {
  const [tab, setTab] = useState<TabKey>('today')
  const ActiveView = TABS.find((t) => t.key === tab)!.view

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col">
      <header className="px-4 pb-2 pt-5 text-center">
        <h1 className="text-lg font-semibold tracking-tight">Shamo</h1>
        <p className="text-xs text-[var(--text-soft)]">energy · routine · balance</p>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-24">
        <ActiveView />
      </main>

      <nav className="fixed inset-x-0 bottom-0 mx-auto max-w-md border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur">
        <div className="grid grid-cols-5">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${
                tab === t.key ? 'text-[var(--recovery)]' : 'text-[var(--text-soft)]'
              }`}
            >
              <span className="text-base leading-none">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

export default App
