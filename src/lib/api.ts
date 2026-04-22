const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

/** Prefer Supabase session token, then legacy localStorage / dev JWT. */
async function getAccessToken(): Promise<string> {
  if (typeof window !== 'undefined') {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const { data } = await createClient().auth.getSession()
      if (data.session?.access_token) return data.session.access_token
    } catch {
      // Missing Supabase env during local experiments
    }
    const legacy = localStorage.getItem('dietagent_token')
    if (legacy) return legacy
  }
  return process.env.NEXT_PUBLIC_DEV_JWT?.trim() ?? ''
}

function isFormData(body: BodyInit | null | undefined): boolean {
  return typeof FormData !== 'undefined' && body instanceof FormData
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const body = init?.body
  const hasJsonBody =
    typeof body === 'string' && body.length > 0

  const token = await getAccessToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(hasJsonBody && !isFormData(body) ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as {
      message?: string
      error?: string
    }
    const msg =
      err.message ?? err.error ?? res.statusText ?? 'API error'
    if (res.status === 402) {
      throw new Error('subscription_required')
    }
    if (res.status === 401) {
      throw new Error(
        `${msg}: sign in with Supabase or set NEXT_PUBLIC_DEV_JWT for local API dev`
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

/** Multipart upload — browser sets Content-Type with boundary. */
async function apiFetchForm<T>(path: string, formData: FormData): Promise<T> {
  const token = await getAccessToken()
  const res = await fetch(`${API_URL}${path}`, {
    method:  'POST',
    body:    formData,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as {
      message?: string
      error?: string
    }
    const msg =
      err.message ?? err.error ?? res.statusText ?? 'API error'
    if (res.status === 402) {
      throw new Error('subscription_required')
    }
    if (res.status === 401) {
      throw new Error(
        `${msg}: sign in with Supabase or set NEXT_PUBLIC_DEV_JWT for local API dev`
      )
    }
    throw new Error(msg)
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
  metricSlug:   string
  metricName:   string
  unit:         string
  avg3d:        number | null
  latestValue:  number | null
  latestAt:     string | null
  trend:        'up' | 'down' | 'flat' | 'insufficient_data'
}

export interface MealLog {
  id:             string
  mealType:       string | null
  description:    string
  sodiumMgEst:    number | null
  caloriesEst:    number | null
  adherenceScore: number | null
  loggedAt:       string
}

export interface DashboardData {
  user: {
    id: string
    displayName: string | null
    timezone: string
    unitPreferences?: Record<string, string>
  }
  today: {
    weightKg:       number | null
    bpSystolic:     number | null
    bpDiastolic:    number | null
    steps:          number | null
    sleepHrs:       number | null
    sodiumMg:       number | null
    adherenceScore: number | null
    aiSummary:      string | null
  } | null
  rollingAverages: RollingAverage[]
  recentMeals:     MealLog[]
  /** Present when API returns coaching context (current backend). */
  coaching?: CoachingContext
}

export interface MetricSample {
  id:          string
  value:       number
  observedAt:  string
  source:      string
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
  metricSlug:  string
  targetValue: number
  startsOn?:   string
  endsOn?:     string | null
}

export interface ProgressPhotoRow {
  id: string
  storagePath: string
  mimeType: string
  byteSize: number | null
  capturedAt: string
  pose: string
  poseConfidence: number | null
  poseSource: string
  classifierModel: string | null
  createdAt: string
  signedUrl?: string
}

// ── API calls ──────────────────────────────────────────────────────────────

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

export const api = {
  getEntitlement: () => apiFetch<EntitlementResponse>('/me/entitlement'),

  createCheckoutSession: () =>
    apiFetch<{ url: string }>('/billing/checkout-session', { method: 'POST' }),

  createPortalSession: () =>
    apiFetch<{ url: string }>('/billing/portal-session', { method: 'POST' }),

  dashboard: () =>
    apiFetch<DashboardData>('/dashboard'),

  getPreferences: () => apiFetch<PreferencesResponse>('/me/preferences'),

  patchPreferences: (unitPreferences: Record<string, string>) =>
    apiFetch<PreferencesResponse>('/me/preferences', {
      method:  'PATCH',
      body:    JSON.stringify({ unitPreferences }),
    }),

  getDietPlans: () => apiFetch<DietPlanRow[]>('/diet-plans'),

  getMetricTypes: () => apiFetch<MetricTypeRow[]>('/metric-types'),

  getCoaching: () => apiFetch<CoachingSnapshot>('/me/coaching'),

  putActiveDiet: (dietPlanSlug: string) =>
    apiFetch<CoachingSnapshot>('/me/coaching/active-diet', {
      method: 'PUT',
      body:   JSON.stringify({ dietPlanSlug }),
    }),

  putCoachingGoals: (goals: CoachingGoalInput[]) =>
    apiFetch<CoachingSnapshot>('/me/coaching/goals', {
      method: 'PUT',
      body:   JSON.stringify({ goals }),
    }),

  patchCoachingObjectives: (objectivesText: string | null) =>
    apiFetch<CoachingSnapshot>('/me/coaching/objectives', {
      method: 'PATCH',
      body:   JSON.stringify({ objectivesText }),
    }),

  /** Upload one image; field name must match API multipart handler (default file). */
  uploadProgressPhoto: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return apiFetchForm<ProgressPhotoRow & { signedUrl: string }>(
      '/me/progress-photos',
      fd
    )
  },

  getProgressPhotos: (params?: {
    pose?: string
    from?: string
    to?: string
    limit?: number
  }) => {
    const q = new URLSearchParams()
    if (params?.pose) q.set('pose', params.pose)
    if (params?.from) q.set('from', params.from)
    if (params?.to) q.set('to', params.to)
    if (params?.limit != null) q.set('limit', String(params.limit))
    const qs = q.toString()
    return apiFetch<ProgressPhotoRow[]>(
      `/me/progress-photos${qs ? `?${qs}` : ''}`
    )
  },

  patchProgressPhotoPose: (id: string, pose: 'front' | 'side') =>
    apiFetch<{ ok: boolean; id: string; pose: string }>(
      `/me/progress-photos/${id}`,
      {
        method: 'PATCH',
        body:   JSON.stringify({ pose }),
      }
    ),

  deleteProgressPhoto: (id: string) =>
    apiFetch<void>(`/me/progress-photos/${id}`, { method: 'DELETE' }),

  logMetric: (
    metricSlug: string,
    value: number,
    observedAt?: string,
    inputUnit?: string
  ) =>
    apiFetch('/metrics', {
      method: 'POST',
      body: JSON.stringify({
        metricSlug,
        value,
        ...(observedAt ? { observedAt } : {}),
        ...(inputUnit ? { inputUnit } : {}),
      }),
    }),

  getMetric: (slug: string, days = 14) =>
    apiFetch<MetricSample[]>(`/metrics/${slug}?days=${days}`),

  getTrend: (slug: string) =>
    apiFetch<{ trend: string }>(`/metrics/${slug}/trend`),

  getRollingAverages: (window = 3) =>
    apiFetch<RollingAverage[]>(`/rolling-averages?window=${window}`),

  logMeal: (description: string, mealType?: string) =>
    apiFetch('/meals', {
      method: 'POST',
      body:   JSON.stringify({ description, mealType }),
    }),

  getMeals: (limit = 20) =>
    apiFetch<MealLog[]>(`/meals?limit=${limit}`),

  /** Removes a meal owned by the current user (e.g. duplicate or mistaken AI log). */
  deleteMeal: (mealId: string) =>
    apiFetch<void>(`/meals/${encodeURIComponent(mealId)}`, { method: 'DELETE' }),

  getChatSessions: () =>
    apiFetch<{ id: string; title: string | null; updatedAt: string }[]>('/chat/sessions'),

  createChatSession: () =>
    apiFetch<{ id: string }>('/chat/sessions', { method: 'POST' }),

  getChatMessages: (sessionId: string) =>
    apiFetch<{ id: string; role: string; content: string; createdAt: string }[]>(
      `/chat/sessions/${sessionId}/messages`
    ),

  sendMessage: (sessionId: string, content: string) =>
    apiFetch(`/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      body:   JSON.stringify({ role: 'user', content }),
    }),

  /**
   * At least one of message (non-empty) or photoIds required per API.
   */
  postAiReply: (
    sessionId: string,
    opts: { message?: string; photoIds?: string[] }
  ) => {
    const body: { message?: string; photoIds?: string[] } = {}
    const m = opts.message?.trim()
    if (m) body.message = m
    if (opts.photoIds?.length) body.photoIds = opts.photoIds
    return apiFetch<{ id: string; role: string; content: string; createdAt: string }>(
      `/chat/sessions/${sessionId}/ai-reply`,
      {
        method: 'POST',
        body:   JSON.stringify(body),
      }
    )
  },

  deleteChatSession: (sessionId: string) =>
    apiFetch<void>(`/chat/sessions/${sessionId}`, { method: 'DELETE' }),

  deleteAllChatSessions: () =>
    apiFetch<{ deleted: number }>('/chat/sessions', { method: 'DELETE' }),
}
