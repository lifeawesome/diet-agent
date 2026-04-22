'use client'

import { format } from 'date-fns'
import type { MealLog } from '@/lib/api'

type MealRowProps = {
  meal: MealLog
  /** When provided, shows a remove control for mistaken or duplicate entries */
  onDelete?: (meal: MealLog) => void | Promise<void>
  deletePending?: boolean
}

const MEAL_COLORS: Record<string, string> = {
  breakfast: '#e8f5e9',
  lunch:     '#fff8e1',
  dinner:    '#e8f0fe',
  snack:     '#fce4ec',
}
const MEAL_TEXT: Record<string, string> = {
  breakfast: '#2e7d32',
  lunch:     '#f57f17',
  dinner:    '#1565c0',
  snack:     '#ad1457',
}

export function MealRow({ meal, onDelete, deletePending }: MealRowProps) {
  const type = meal.mealType ?? 'meal'
  const bg   = MEAL_COLORS[type] ?? '#f4f7f4'
  const tc   = MEAL_TEXT[type]   ?? '#354f35'

  return (
    <div style={{
      display:        'flex',
      alignItems:     'flex-start',
      gap:            '0.75rem',
      padding:        '0.75rem 0',
      borderBottom:   '1px solid var(--border)',
    }}>
      {/* Meal type badge */}
      <span style={{
        flexShrink:   0,
        marginTop:    '2px',
        padding:      '2px 8px',
        borderRadius: '100px',
        background:   bg,
        color:        tc,
        fontSize:     '11px',
        fontWeight:   500,
        letterSpacing:'0.04em',
        textTransform:'capitalize',
      }}>
        {type}
      </span>

      {/* Description */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize:     '14px',
          color:        'var(--text-primary)',
          lineHeight:   1.4,
          overflow:     'hidden',
          textOverflow: 'ellipsis',
          whiteSpace:   'nowrap',
        }}>
          {meal.description}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '3px' }}>
          {meal.sodiumMgEst != null && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {meal.sodiumMgEst.toLocaleString()} mg sodium
            </span>
          )}
          {meal.caloriesEst != null && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {meal.caloriesEst} kcal
            </span>
          )}
        </div>
      </div>

      {/* Time + optional remove */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {format(new Date(meal.loggedAt), 'h:mm a')}
        </span>
        {onDelete && (
          <button
            type="button"
            disabled={deletePending}
            onClick={() => void onDelete(meal)}
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: deletePending ? 'wait' : 'pointer',
              textDecoration: 'underline',
            }}
          >
            {deletePending ? 'Removing…' : 'Remove'}
          </button>
        )}
      </div>
    </div>
  )
}
