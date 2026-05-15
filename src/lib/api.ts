const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim() ?? 'https://api.dietagent.com'

/** Supabase session token, then legacy dev JWT. */
async function getAccessToken(): Promise<string> {
  if (typeof window !== 'undefined') {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const { data } = await createClient().auth.getSession()
      if (data.session?.access_token) return data.session.access_token
    } catch {
      /* missing Supabase env */
    }
    const legacy = localStorage.getItem('dietagent_token')
    if (legacy) return legacy
  }
  return process.env.NEXT_PUBLIC_DEV_JWT?.trim() ?? ''
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const body = init?.body
  const hasJsonBody = typeof body === 'string' && body.length > 0

  const token = await getAccessToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(hasJsonBody ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as {
      message?: string
      error?: string
    }
    const msg = err.message ?? err.error ?? res.statusText ?? 'API error'
    if (res.status === 402) throw new Error('subscription_required')
    if (res.status === 401) {
      throw new Error(
        `${msg}: sign in with Supabase or set NEXT_PUBLIC_DEV_JWT for local API dev`,
      )
    }
    throw new Error(msg)
  }
  if (res.status === 204) {
    return undefined as T
  }
  const text = await res.text()
  if (!text.trim()) {
    return undefined as T
  }
  return JSON.parse(text) as T
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface CoachingContext {
  activeDietPlan: {
    slug: string
    name: string
    description: string | null
    startedOn: string
  } | null
  objectivesText: string | null
  goals: Array<{
    id: string
    metricSlug: string
    metricName: string
    unit: string
    targetValue: number
    startsOn: string
    endsOn: string | null
  }>
}

export type CoachingSnapshot = CoachingContext

export interface RollingAverage {
  metricSlug: string
  metricName: string
  unit: string
  avg3d: number | null
  latestValue: number | null
  latestAt: string | null
  trend: 'up' | 'down' | 'flat' | 'insufficient_data'
}

export interface MealLog {
  id: string
  mealType: string | null
  description: string
  sodiumMgEst: number | null
  caloriesEst: number | null
  adherenceScore: number | null
  loggedAt: string
  source?: string
  metadata?: Record<string, unknown> | null
}

export interface DashboardData {
  user: {
    id: string
    displayName: string | null
    timezone: string
    unitPreferences?: Record<string, string>
  }
  today: {
    weightKg: number | null
    bpSystolic: number | null
    bpDiastolic: number | null
    steps: number | null
    sleepHrs: number | null
    sodiumMg: number | null
    adherenceScore: number | null
    aiSummary: string | null
  } | null
  rollingAverages: RollingAverage[]
  recentMeals: MealLog[]
  coaching?: CoachingContext
}

export interface DietPlanRow {
  id: string
  slug: string
  name: string
  description: string | null
}

export interface MetricTypeRow {
  slug: string
  name: string
  label: string
  unit: string
  category: string
}

export interface CoachingGoalInput {
  metricSlug: string
  targetValue: number
  startsOn?: string
  endsOn?: string | null
}

export interface PreferencesResponse {
  unitPreferences: Record<string, string>
  availableDisplayUnits: Record<string, readonly string[]>
}

export interface EntitlementRow {
  id: string
  user_id: string
  provider: string
  status: string
  stripe_subscription_id: string | null
  apple_original_transaction_id: string | null
  apple_product_id: string | null
  current_period_end: string | null
}

export interface EntitlementResponse {
  hasAccess: boolean
  entitlements: EntitlementRow[]
}

export interface McpConnection {
  clientId: string
  clientName: string
  connectedAt: string
  lastUsedAt: string | null
  scopes: string[]
}

export interface McpConnectionsResponse {
  connections: McpConnection[]
}

export interface TrendPoint {
  at: string
  value: number
  source: string
}

export interface MeTrendResponse {
  metric: string
  windowDays: number
  points: TrendPoint[]
}

export const api = {
  getEntitlement: () =>
    apiFetch<EntitlementResponse>('/me/entitlement'),

  createCheckoutSession: () =>
    apiFetch<{ url: string }>('/billing/checkout-session', { method: 'POST' }),

  createPortalSession: () =>
    apiFetch<{ url: string }>('/billing/portal-session', { method: 'POST' }),

  /** Path B: canonical dashboard for web (same data as MCP get_dashboard). */
  meDashboard: () => apiFetch<DashboardData>('/me/dashboard'),

  /** Legacy path — use `meDashboard` instead */
  dashboard: () => apiFetch<DashboardData>('/dashboard'),

  getMcpConnections: () =>
    apiFetch<McpConnectionsResponse>('/me/connections'),

  revokeMcpConnection: (clientId: string) =>
    apiFetch<{ ok: boolean; revoked: string }>(
      `/me/connections/${encodeURIComponent(clientId)}/revoke`,
      { method: 'POST' },
    ),

  getMeTrend: (metric: string, windowDays = 30) =>
    apiFetch<MeTrendResponse>(
      `/me/trend?metric=${encodeURIComponent(metric)}&window_days=${windowDays}`,
    ),

  getPreferences: () => apiFetch<PreferencesResponse>('/me/preferences'),

  patchPreferences: (unitPreferences: Record<string, string>) =>
    apiFetch<PreferencesResponse>('/me/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ unitPreferences }),
    }),

  getDietPlans: () => apiFetch<DietPlanRow[]>('/diet-plans'),

  getMetricTypes: () => apiFetch<MetricTypeRow[]>('/metric-types'),

  getCoaching: () => apiFetch<CoachingSnapshot>('/me/coaching'),

  putActiveDiet: (dietPlanSlug: string) =>
    apiFetch<CoachingSnapshot>('/me/coaching/active-diet', {
      method: 'PUT',
      body: JSON.stringify({ dietPlanSlug }),
    }),

  putCoachingGoals: (goals: CoachingGoalInput[]) =>
    apiFetch<CoachingSnapshot>('/me/coaching/goals', {
      method: 'PUT',
      body: JSON.stringify({ goals }),
    }),

  patchCoachingObjectives: (objectivesText: string | null) =>
    apiFetch<CoachingSnapshot>('/me/coaching/objectives', {
      method: 'PATCH',
      body: JSON.stringify({ objectivesText }),
    }),
}
