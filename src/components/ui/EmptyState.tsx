import type { ReactNode } from 'react'

type Props = {
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: Props) {
  return (
    <div className="rounded-2xl border border-sand-200 bg-sand-50/50 p-8 text-center">
      <h3 className="font-display text-xl text-sage-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-md font-body text-sm leading-relaxed text-sage-700">{description}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  )
}
