import { useEffect, useRef, useState } from 'react'

interface Props {
  onComplete: () => void
}

const DURATIONS = [10, 15, 20]

export default function BreakTimer({ onComplete }: Props) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (secondsLeft === null) return
    if (secondsLeft <= 0) {
      if (intervalRef.current) window.clearInterval(intervalRef.current)
      onComplete()
      return
    }
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((s) => (s === null ? null : s - 1))
    }, 1000)
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft === null])

  if (secondsLeft !== null) {
    const m = Math.floor(secondsLeft / 60)
    const s = secondsLeft % 60
    return (
      <div className="flex items-center gap-3 rounded-xl bg-[var(--recovery-bg)] px-3 py-2">
        <span className="font-mono text-lg text-[var(--recovery)]">
          {m}:{s.toString().padStart(2, '0')}
        </span>
        <span className="text-sm text-[var(--text-soft)]">Break in progress — step away</span>
        <button
          type="button"
          onClick={() => setSecondsLeft(null)}
          className="ml-auto text-xs text-[var(--text-soft)] underline"
        >
          cancel
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-[var(--text-soft)]">Take a break:</span>
      {DURATIONS.map((min) => (
        <button
          key={min}
          type="button"
          onClick={() => setSecondsLeft(min * 60)}
          className="rounded-full border border-[var(--recovery)] px-3 py-1 text-sm text-[var(--recovery)] hover:bg-[var(--recovery-bg)]"
        >
          {min} min
        </button>
      ))}
      <button
        type="button"
        onClick={onComplete}
        className="text-sm text-[var(--text-soft)] underline"
      >
        already took it
      </button>
    </div>
  )
}
