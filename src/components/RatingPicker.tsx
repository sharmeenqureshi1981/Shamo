interface Props {
  value: number | undefined
  onChange: (v: 1 | 2 | 3 | 4 | 5) => void
  lowLabel: string
  highLabel: string
}

export default function RatingPicker({ value, onChange, lowLabel, highLabel }: Props) {
  return (
    <div>
      <div className="flex gap-2">
        {([1, 2, 3, 4, 5] as const).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`h-10 w-10 rounded-full border text-sm font-medium transition ${
              value === n
                ? 'border-transparent bg-[var(--recovery)] text-white'
                : 'border-[var(--border)] bg-white text-[var(--text-soft)] hover:border-[var(--recovery)]'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-[var(--text-soft)]">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  )
}
