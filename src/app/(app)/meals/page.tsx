'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { api, type MealLog } from '@/lib/api'

export default function MealsPage() {
  const [meals,   setMeals]   = useState<MealLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    api.getMeals(50)
      .then(setMeals)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function removeMeal(meal: MealLog) {
    if (!window.confirm('Remove this meal from your log?')) return
    setDeletingId(meal.id)
    try {
      await api.deleteMeal(meal.id)
      setMeals(prev => prev.filter(m => m.id !== meal.id))
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Could not remove meal')
    } finally {
      setDeletingId(null)
    }
  }

  // Group meals by date
  const byDate: Record<string, MealLog[]> = {}
  for (const meal of meals) {
    const key = format(new Date(meal.loggedAt), 'yyyy-MM-dd')
    if (!byDate[key]) byDate[key] = []
    byDate[key].push(meal)
  }

  const MEAL_COLORS: Record<string, { bg: string; text: string }> = {
    breakfast: { bg: '#e8f5e9', text: '#2e7d32' },
    lunch:     { bg: '#fff8e1', text: '#f57f17' },
    dinner:    { bg: '#e8f0fe', text: '#1565c0' },
    snack:     { bg: '#fce4ec', text: '#ad1457' },
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Meals</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Your recent food log</p>
        </div>
        <a href="/log" className="btn-primary" style={{ textDecoration: 'none' }}>
          + Log meal
        </a>
      </div>

      {loading && (
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</div>
      )}

      {error && (
        <div style={{ color: 'var(--down)', fontSize: 14 }}>{error}</div>
      )}

      {!loading && meals.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ fontSize: 32, marginBottom: '0.75rem' }}>◍</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
            No meals logged yet
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: '1.25rem' }}>
            Start tracking what you eat to see plan adherence scores and sodium estimates
          </div>
          <a href="/log" className="btn-primary" style={{ textDecoration: 'none' }}>Log your first meal</a>
        </div>
      )}

      {Object.entries(byDate).map(([date, dayMeals]) => (
        <div key={date} style={{ marginBottom: '2rem' }}>
          <div className="label" style={{ marginBottom: '0.75rem' }}>
            {format(new Date(date + 'T12:00:00'), 'EEEE, MMMM d')}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {dayMeals.map(meal => {
              const type   = meal.mealType ?? 'meal'
              const colors = MEAL_COLORS[type] ?? { bg: '#f4f7f4', text: '#354f35' }

              return (
                <div key={meal.id} className="card" style={{ padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <span style={{
                      padding:      '3px 10px',
                      borderRadius: '100px',
                      background:   colors.bg,
                      color:        colors.text,
                      fontSize:     11,
                      fontWeight:   500,
                      textTransform:'capitalize',
                      flexShrink:   0,
                      marginTop:    2,
                    }}>
                      {type}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                        {meal.description}
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', marginTop: 6 }}>
                        {meal.sodiumMgEst != null && (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {meal.sodiumMgEst.toLocaleString()} mg sodium
                          </span>
                        )}
                        {meal.caloriesEst != null && (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {meal.caloriesEst} kcal
                          </span>
                        )}
                        {meal.adherenceScore != null && (
                          <span style={{
                            fontSize: 12,
                            color: meal.adherenceScore >= 70 ? '#2e7d32' : meal.adherenceScore >= 40 ? '#f57f17' : '#c62828',
                          }}>
                            {Math.round(meal.adherenceScore)}% plan
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {format(new Date(meal.loggedAt), 'h:mm a')}
                      </span>
                      <button
                        type="button"
                        disabled={deletingId === meal.id}
                        onClick={() => void removeMeal(meal)}
                        style={{
                          fontSize: 11,
                          color: 'var(--text-muted)',
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: deletingId === meal.id ? 'wait' : 'pointer',
                          textDecoration: 'underline',
                        }}
                      >
                        {deletingId === meal.id ? 'Removing…' : 'Remove'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
