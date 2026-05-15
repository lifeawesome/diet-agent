type Props = {
  name: string
  className?: string
}

/** Neutral third-party label — no client logos (untrusted). */
export function ClientNameBadge({ name, className = '' }: Props) {
  return (
    <span
      className={`inline-flex h-14 min-w-[7rem] max-w-[10rem] items-center justify-center rounded-2xl border border-sand-200 bg-white px-3 text-center font-body text-sm font-medium text-sage-900 shadow-sm ${className}`}
    >
      {name}
    </span>
  )
}
