# DietAgent — Phase 3: Next.js Web Dashboard
## Step-by-Step Cursor Implementation Guide

---

## What you're building

Five screens that make DietAgent's data visual and interactive:

| Task | Screen | File |
|------|--------|------|
| T06 | Scaffold + design system | globals.css, layout.tsx, Sidebar.tsx, api.ts |
| T07 | Dashboard | app/dashboard/page.tsx |
| T08 | Log entry | app/log/page.tsx |
| T09 | Trends (Recharts charts) | app/trends/page.tsx |
| T10 | Chat interface | app/chat/page.tsx |

All files are already written in this package. Your job in Cursor is to:
1. Get the app running
2. Connect it to the Phase 1 API
3. Fix any issues the agent finds
4. Verify each screen works against real data

---

## Before you start

You need the Phase 1 API running:

```bash
# In your dietagent-api directory
DATABASE_URL=postgres://localhost/dietagent npm run dev
# API should be live at http://localhost:8080
# GET http://localhost:8080/health should return { "status": "ok" }
```

---

## Step 1 — Install and run

```bash
cd dietagent-phase3
npm install
cp .env.example .env.local
# .env.local already has: NEXT_PUBLIC_API_URL=http://localhost:8080
npm run dev
# App starts at http://localhost:3000
```

Open http://localhost:3000 — it redirects to /dashboard. You'll see a loading
state while it tries to reach the API. If the API is running you'll see the
dashboard (empty but structured). If not, you'll see the error card.

---

## Step 2 — Open in Cursor and do the initial agent pass

Open the project in Cursor:

```bash
cursor .
```

Create `.cursorrules` at the project root:

```
# DietAgent Web — Cursor Agent Rules

## Stack
- Next.js 15, React 19, TypeScript strict mode
- Tailwind CSS utility classes + CSS custom properties in globals.css
- Recharts for charts (always dynamically imported with ssr: false)
- No external component library — all UI is hand-rolled

## Design system
- Fonts: DM Serif Display (headings), DM Sans (body), DM Mono (data)
- Accent color: #557a55 (sage green)
- Background: #faf8f4 (warm cream)
- Use CSS variables: --bg, --bg-card, --bg-subtle, --border, --accent, --text-primary,
  --text-secondary, --text-muted
- CSS classes: .card, .card-subtle, .btn-primary, .btn-ghost, .input, .label,
  .nav-item, .metric-pill, .trend-up, .trend-down, .trend-flat

## Rules
- Never use 'any' type
- All API calls go through src/lib/api.ts
- Recharts components: always use next/dynamic with { ssr: false }
- Format numbers: weight 1dp, BP/HR/steps integer, sodium with toLocaleString(),
  adherence as %, null values display as '—' never 'null'
- Run: npx tsc --noEmit before declaring any task complete

## API base URL
process.env.NEXT_PUBLIC_API_URL (set in .env.local)
```

Now open Composer (`Cmd+I`), Agent mode, and run:

```
Review the entire project structure. Check:
1. All imports resolve correctly (no missing modules)
2. All TypeScript types are sound — run npx tsc --noEmit
3. The api.ts client matches the backend routes in the Phase 1 API

Report any issues found and fix them.
```

---

## Step 3 — Seed test data and verify the dashboard

Before testing the UI you need data in the database. Run these SQL commands
against your local Postgres:

```sql
-- Test user (if not already created from Phase 2)
INSERT INTO users (id, email, auth_provider, auth_user_id, display_name)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'test@dietagent.dev',
  'supabase',
  'test-auth-id-001',
  'Alex'
) ON CONFLICT DO NOTHING;

-- A week of weight readings
INSERT INTO metric_samples (user_id, metric_type_id, value, source, observed_at)
SELECT
  '11111111-1111-1111-1111-111111111111',
  (SELECT id FROM metric_types WHERE slug = 'weight_kg'),
  183.0 + (random() * 2 - 1),
  'manual',
  NOW() - (i || ' days')::interval
FROM generate_series(0, 6) AS i;

-- A week of BP readings
INSERT INTO metric_samples (user_id, metric_type_id, value, source, observed_at)
SELECT
  '11111111-1111-1111-1111-111111111111',
  (SELECT id FROM metric_types WHERE slug = 'bp_systolic'),
  125 + (random() * 10 - 5),
  'manual',
  NOW() - (i || ' days')::interval
FROM generate_series(0, 6) AS i;

-- Steps
INSERT INTO metric_samples (user_id, metric_type_id, value, source, observed_at)
SELECT
  '11111111-1111-1111-1111-111111111111',
  (SELECT id FROM metric_types WHERE slug = 'steps'),
  7000 + (random() * 3000),
  'manual',
  NOW() - (i || ' days')::interval
FROM generate_series(0, 6) AS i;

-- A few meals
INSERT INTO meal_logs (user_id, description, meal_type, sodium_mg_est, calories_est, source, logged_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Oatmeal with blueberries and walnuts, black coffee', 'breakfast', 120, 380, 'manual', NOW() - INTERVAL '2 hours'),
  ('11111111-1111-1111-1111-111111111111', 'Grilled chicken salad with lemon dressing and avocado', 'lunch', 480, 520, 'manual', NOW() - INTERVAL '5 hours'),
  ('11111111-1111-1111-1111-111111111111', 'Baked salmon with roasted vegetables and quinoa', 'dinner', 890, 680, 'manual', NOW() - INTERVAL '22 hours');
```

Now visit http://localhost:3000/dashboard. You should see metric cards with
real values. If they show "—", the rolling aggregates haven't been computed
yet — the API computes them after the first logSample call. Fix by running:

```bash
# Trigger rolling aggregate computation by logging one metric via the API
curl -X POST http://localhost:8080/metrics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{"metricSlug":"weight_kg","value":183.0}'
```

Or temporarily bypass JWT for local dev by removing the auth hook from the
API server for testing only.

---

## Step 4 — Verify each screen with Cursor Agent

Open Composer (Agent mode) and run this screen-by-screen verification:

```
Test each screen of the DietAgent web app and fix any issues:

SCREEN 1 — Dashboard (http://localhost:3000/dashboard)
Verify:
- Hero metric cards show: Weight, Systolic BP, Diastolic BP, DASH adherence
- Secondary cards show: Steps, Sleep, Sodium, Heart rate, Calories
- Each card has: label (uppercase small), large number, unit, trend arrow, "3-day avg" sublabel
- Null values show "—" not "null" or "undefined"
- Recent meals section shows meal type badge + description + time
- No console errors

SCREEN 2 — Log (http://localhost:3000/log)
Verify:
- Two tabs: Metrics and Meals, switchable without page reload
- Metrics tab: metric dropdown has all 16 options, value input, optional datetime
- Enter a value and submit — confirm success message appears inline
- Meals tab: meal type select + description textarea
- Submit a meal description — confirm success message appears
- No console errors

SCREEN 3 — Meals (http://localhost:3000/meals)
Verify:
- Shows meals grouped by date
- Each meal has a colored type badge (breakfast=green, lunch=yellow, dinner=blue, snack=pink)
- Sodium and calorie estimates shown if present
- Empty state shows a "Log your first meal" CTA
- No console errors

SCREEN 4 — Trends (http://localhost:3000/trends)
Verify:
- Window selector (7d / 14d / 30d) is visible and switches data on click
- At least one chart renders with a line (needs 2+ samples in the window)
- Charts with < 2 samples show "Not enough data" message gracefully
- Tooltip shows date + value + unit on hover
- No SSR hydration errors in console
- No console errors

SCREEN 5 — Chat (http://localhost:3000/chat)
Verify:
- Left panel shows "New chat" button
- Empty state shows suggested prompts
- Clicking a prompt creates a session and sends the message
- User messages appear in right-aligned sage-green bubbles
- "Thinking…" placeholder appears while waiting for response
- If /ai-reply endpoint returns 404, a graceful fallback message appears
- No console errors

Report findings for each screen. Fix any bugs directly in the relevant files.
Run npx tsc --noEmit when done and confirm zero errors.
```

---

## Step 5 — Fix the auth token for API calls

Right now `api.ts` reads the JWT from `localStorage.getItem('dietagent_token')`.
For local development, set a test token:

```javascript
// Run this in the browser console at http://localhost:3000
localStorage.setItem('dietagent_token', 'YOUR_SUPABASE_OR_TEST_JWT_HERE')
```

For a proper integration with Supabase Auth, ask Cursor Agent to:

```
Update src/lib/api.ts to use the Supabase Auth session token.
Install @supabase/supabase-js and create src/lib/supabase.ts with:
  - createClient using NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
  - getToken() function that returns supabase.auth.getSession() access_token
Update the apiFetch function to await getToken() instead of reading localStorage.
```

---

## Step 6 — Wire up the Chat AI endpoint (T11 preview)

The chat page already makes a request to `/chat/sessions/:id/ai-reply`. That
route doesn't exist until T11 (Phase 4) is built. The chat page gracefully
falls back if the endpoint returns 404.

To unblock chat testing now, ask Cursor Agent to add a temporary stub route
to the API:

```
In dietagent-api/src/routes/index.ts, add a temporary stub for the AI reply:

POST /chat/sessions/:sessionId/ai-reply
Body: { message: string }

The stub should:
1. Save the user message to chat_messages
2. Call the Anthropic API with a simple system prompt:
   "You are DietAgent, a friendly health coach. Answer briefly."
3. Save and return the assistant reply

Use ANTHROPIC_API_KEY from process.env.
This will be replaced by the full implementation in T11.
```

---

## Step 7 — Type check and commit

```bash
npx tsc --noEmit
# Must return zero errors

git add .
git commit -m "feat(T06-T10): Next.js web dashboard — all 5 screens"
git push origin agent/phase3-web-dashboard
```

---

## Acceptance checklist

- [ ] `npm run dev` starts without errors
- [ ] `npx tsc --noEmit` returns zero errors  
- [ ] Dashboard shows hero + secondary metric cards with real data
- [ ] Metric cards display: label, 3d avg, unit, trend arrow, latest value pill
- [ ] Log page Metrics tab submits and shows inline success
- [ ] Log page Meals tab submits and shows inline success
- [ ] Meals page groups meals by date with type badges
- [ ] Trends page renders Recharts line charts for all 9 metrics
- [ ] Trends 7d/14d/30d window toggle refetches data
- [ ] No Recharts SSR hydration errors in browser console
- [ ] Chat page shows session list, empty state prompts, message bubbles
- [ ] Chat gracefully handles missing AI reply endpoint
- [ ] Sidebar active state updates correctly per route
- [ ] Null values display as "—" everywhere, never "null"
- [ ] Numbers formatted correctly (weight 1dp, steps with commas, etc.)

---

## Common issues

**Dashboard shows all "—" values**
→ Rolling aggregates haven't been computed. Trigger by logging one metric
  through the API, or run refreshRollingAggregates() manually in psql.

**Recharts hydration error in console**
→ A Recharts component was imported directly instead of via `next/dynamic`.
  All Recharts imports must use: `dynamic(() => import('recharts').then(m => m.ComponentName), { ssr: false })`

**API calls return 401**
→ The JWT token in localStorage is missing or expired. Set it via the
  browser console: `localStorage.setItem('dietagent_token', 'your-token')`

**Trends charts don't show**
→ Need at least 2 data points per metric in the selected window. Seed more
  data using the SQL from Step 3, or expand the window to 30d.

**Chat sends message but gets no reply**
→ Expected until T11 (Phase 4) is built. The fallback message is intentional.

---

## What's next

Phase 4 (T11) adds the AI chat backend — the Claude-powered coaching endpoint
that reads the user's live dashboard data and responds with real health insights.

Phase 5 (T12–T14) is the iOS app with HealthKit integration.
