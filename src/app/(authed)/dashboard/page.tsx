'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { api, type DashboardData, type McpConnection } from '@/lib/api'
import { formatUnitForUi, toDisplayValue } from '@/lib/units-display'
import { DashboardMetricCard } from '@/components/dashboard/DashboardMetricCard'
import { GoalProgressRow } from '@/components/dashboard/GoalProgressRow'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { TrendChart } from '@/components/dashboard/TrendChart'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { getDashboardConnectCtaLabel, getDashboardEmptyStateDescription } from '@/lib/clients'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

async function loadDashboard(): Promise<DashboardData> {
  try {
    return await api.meDashboard()
  } catch {
    return api.dashboard()
  }
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [connections, setConnections] = useState<McpConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trendMetric, setTrendMetric] = useState('weight_kg')

  const refresh = useCallback(() => {
    setLoading(true)
    setError(null)
    return Promise.all([
      loadDashboard(),
      api.getMcpConnections().catch(() => ({ connections: [] as McpConnection[] })),
    ])
      .then(([dash, conn]) => {
        setData(dash)
        setConnections(conn.connections)
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  if (loading) {
    return (
      <div className="min-h-[48vh] animate-pulse rounded-3xl bg-sand-100/80 p-8 font-body text-sage-600">
        Loading your dashboard…
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 font-body text-red-900">
        <p className="font-medium">Could not load dashboard</p>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    )
  }

  if (!data) return null

  const prefs = data.user.unitPreferences ?? {}
  const rolling = (slug: string) => data.rollingAverages.find(r => r.metricSlug === slug)

  const weight = rolling('weight_kg')
  const sys = rolling('bp_systolic')
  const dia = rolling('bp_diastolic')
  const sleep = rolling('sleep_hrs')
  const adherence = rolling('adherence')

  const displayWeight =
    weight?.avg3d != null
      ? toDisplayValue('weight_kg', weight.avg3d, weight.unit || 'kg', prefs)
      : null
  const displaySys =
    sys?.avg3d != null ? `${Math.round(sys.avg3d)}` : null
  const displayDia =
    dia?.avg3d != null ? `${Math.round(dia.avg3d)}` : null
  const displaySleep =
    sleep?.avg3d != null
      ? toDisplayValue('sleep_hrs', sleep.avg3d, sleep.unit || 'h', prefs)
      : null
  const displayAdh =
    adherence?.avg3d != null ? `${Math.round(adherence.avg3d)}%` : null

  const hasAnyData =
    data.recentMeals.length > 0 ||
    data.rollingAverages.some(r => r.avg3d != null)

  const connLabel =
    connections.length === 1
      ? connections[0].clientName
      : connections.length > 1
        ? `${connections.length} assistants`
        : null

  return (
    <div className="mx-auto max-w-5xl space-y-10 pb-16 font-body text-sage-900">
      {/* Header */}
      <header className="flex flex-col gap-4 border-b border-sand-200 pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-1 text-sm text-sage-600">
            {format(new Date(), 'EEEE, MMMM d')}
          </p>
          <h1 className="font-display text-3xl text-sage-950 sm:text-4xl">
            Good {greeting()},{' '}
            <span className="text-[#2F5944]">{data.user.displayName ?? 'there'}</span>
          </h1>
          {data.coaching?.activeDietPlan && (
            <p className="mt-3 text-sm text-sage-700">
              Plan:{' '}
              <span className="font-medium">{data.coaching.activeDietPlan.name}</span>{' '}
              ·{' '}
              <Link href="/settings" className="text-[#2F5944] underline underline-offset-2">
                Change in settings
              </Link>
            </p>
          )}
        </div>
        <div className="flex flex-shrink-0 flex-col items-start gap-2 sm:items-end">
          {connections.length === 0 ? (
            <Link href="/connect">
              <Button type="button" variant="primary" className="px-5 py-2.5">
                {getDashboardConnectCtaLabel()}
              </Button>
            </Link>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-sage-200 bg-sage-50 px-3 py-1.5 text-sm text-sage-800">
                ✓ Connected{connLabel ? `: ${connLabel}` : ''}
              </span>
              <Link
                href="/connections"
                className="text-sm text-[#2F5944] underline underline-offset-2"
              >
                Manage
              </Link>
            </div>
          )}
        </div>
      </header>

      {!hasAnyData && (
        <EmptyState
          title="Your dashboard is waiting"
          description={getDashboardEmptyStateDescription()}
          action={
            <Link href="/connect">
              <Button variant="primary">How to connect</Button>
            </Link>
          }
        />
      )}

      {/* Metric grid */}
      <section>
        <h2 className="sr-only">Key metrics — 3-day averages</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardMetricCard
            title="Weight"
            subtitle="3-day average"
            displayValue={
              displayWeight?.value != null ? String(displayWeight.value) : '—'
            }
            unit={displayWeight ? formatUnitForUi(displayWeight.unit) : ''}
            trend={weight?.trend ?? 'insufficient_data'}
            metricSlug="weight_kg"
          />
          <DashboardMetricCard
            title="Blood pressure"
            subtitle="3-day average"
            displayValue={
              displaySys && displayDia
                ? `${displaySys}/${displayDia}`
                : '—'
            }
            unit="mmHg"
            trend={
              sys?.trend === 'insufficient_data'
                ? dia?.trend ?? 'insufficient_data'
                : sys?.trend ?? 'insufficient_data'
            }
            metricSlug="bp_systolic"
          />
          <DashboardMetricCard
            title="Sleep"
            subtitle="3-day average"
            displayValue={
              displaySleep?.value != null ? String(displaySleep.value) : '—'
            }
            unit={displaySleep ? formatUnitForUi(displaySleep.unit) : ''}
            trend={sleep?.trend ?? 'insufficient_data'}
            metricSlug="sleep_hrs"
          />
          <DashboardMetricCard
            title="DASH adherence"
            subtitle="3-day average"
            displayValue={displayAdh ?? '—'}
            unit=""
            trend={adherence?.trend ?? 'insufficient_data'}
            metricSlug="adherence"
          />
        </div>
      </section>

      {/* Goals */}
      {data.coaching && data.coaching.goals.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-xl text-sage-950">Goal progress</h2>
          <div className="space-y-3 rounded-2xl border border-sand-200 bg-white p-4 sm:p-6">
            {data.coaching.goals.map(g => (
              <GoalProgressRow
                key={g.id}
                goal={g}
                rolling={rolling(g.metricSlug)}
                prefs={prefs}
              />
            ))}
          </div>
        </section>
      )}

      {/* Activity */}
      <section>
        <h2 className="mb-4 font-display text-xl text-sage-950">Recent activity</h2>
        <ActivityFeed meals={data.recentMeals.slice(0, 10)} />
      </section>

      {/* Trends */}
      <section>
        <h2 className="mb-4 font-display text-xl text-sage-950">Trends</h2>
        <div className="rounded-2xl border border-sand-200 bg-white p-4 sm:p-6">
          <label className="mb-4 block text-sm text-sage-700">
            Metric
            <select
              className="mt-1 w-full max-w-xs rounded-xl border border-sand-300 bg-white px-3 py-2 font-body text-sage-900 sm:w-auto"
              value={trendMetric}
              onChange={e => setTrendMetric(e.target.value)}
            >
              <option value="weight_kg">Weight</option>
              <option value="bp_systolic">Blood pressure (systolic)</option>
              <option value="bp_diastolic">Blood pressure (diastolic)</option>
              <option value="sleep_hrs">Sleep</option>
              <option value="adherence">DASH adherence</option>
              <option value="steps">Steps</option>
              <option value="sodium_mg">Sodium</option>
            </select>
          </label>
          <TrendChart metricSlug={trendMetric} />
        </div>
      </section>
    </div>
  )
}
