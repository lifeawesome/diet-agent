import type { MealLog } from '@/lib/api'
import { format } from 'date-fns'

function sourceLabel(m: MealLog): string {
  const meta = m.metadata as { mcp_client?: string } | undefined
  if (meta?.mcp_client === 'claude' || meta?.mcp_client === 'anthropic') return 'Claude'
  if (meta?.mcp_client === 'openai' || meta?.mcp_client === 'chatgpt') return 'ChatGPT'
  switch (m.source) {
    case 'apple_health':
      return 'Apple Health'
    case 'manual':
      return 'Manual'
    case 'ai_extracted':
      return 'AI assistant'
    case 'device':
      return 'Device'
    default:
      return 'Manual'
  }
}

const badgeStyles: Record<string, string> = {
  Claude:       'bg-violet-100 text-violet-900',
  ChatGPT:      'bg-emerald-100 text-emerald-900',
  Manual:       'bg-sand-200 text-sage-900',
  'Apple Health':'bg-sky-100 text-sky-900',
  'AI assistant':'bg-amber-100 text-amber-900',
  Device:       'bg-slate-200 text-slate-900',
}

type Props = { meals: MealLog[] }

export function ActivityFeed({ meals }: Props) {
  if (meals.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-sand-300 bg-sand-50/50 p-6 text-center text-sm text-sage-600">
        No meals logged yet.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-sand-100 rounded-2xl border border-sand-200 bg-white">
      {meals.map(m => {
        const src = sourceLabel(m)
        const badge = badgeStyles[src] ?? 'bg-sand-100 text-sage-800'
        return (
          <li key={m.id} className="flex flex-wrap items-start gap-3 px-4 py-3 sm:px-5">
            <span className={`mt-0.5 rounded-full px-2 py-0.5 font-body text-xs font-medium ${badge}`}>
              {src}
            </span>
            <div className="min-w-0 flex-1">
              <p className="break-words font-body text-sm text-sage-900">{m.description}</p>
              <p className="mt-1 font-mono text-xs text-sage-500">
                {m.mealType ?? 'meal'} · {format(new Date(m.loggedAt), 'MMM d, h:mm a')}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
