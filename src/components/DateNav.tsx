import { addDays, format } from 'date-fns'
import { niceDate, today } from '../lib/dates'

interface Props {
  date: string
  onChange: (date: string) => void
  label?: string
}

export default function DateNav({ date, onChange, label }: Props) {
  const shift = (delta: number) =>
    onChange(format(addDays(new Date(date + 'T00:00:00'), delta), 'yyyy-MM-dd'))

  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={() => shift(-1)}
        className="rounded-full border border-[var(--border)] px-3 py-1 text-sm"
      >
        ←
      </button>
      <div className="text-center">
        <div className="text-lg font-semibold">{niceDate(date)}</div>
        {label && <div className="text-xs text-[var(--text-soft)]">{label}</div>}
        {date !== today() && (
          <button
            type="button"
            onClick={() => onChange(today())}
            className="mt-0.5 text-xs text-[var(--recovery)] underline"
          >
            jump to today
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => shift(1)}
        className="rounded-full border border-[var(--border)] px-3 py-1 text-sm"
      >
        →
      </button>
    </div>
  )
}
