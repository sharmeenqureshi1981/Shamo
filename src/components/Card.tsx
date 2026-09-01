import type { PropsWithChildren, ReactNode } from 'react'

interface Props {
  title?: ReactNode
  subtitle?: ReactNode
  className?: string
}

export default function Card({ title, subtitle, className = '', children }: PropsWithChildren<Props>) {
  return (
    <section
      className={`rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm ${className}`}
    >
      {title && <h2 className="text-base font-semibold text-[var(--text)]">{title}</h2>}
      {subtitle && <p className="mt-0.5 text-sm text-[var(--text-soft)]">{subtitle}</p>}
      <div className={title || subtitle ? 'mt-3' : ''}>{children}</div>
    </section>
  )
}
