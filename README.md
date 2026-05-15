# DietAgent Dashboard (Next.js)

Web dashboard for DietAgent accounts: MCP connector setup (`/connect`), dashboard metrics, OAuth consent, billing, settings.

## Environment

Copy `.env.local.example` to `.env.local` and fill in Supabase publishable credentials and optional `NEXT_PUBLIC_API_URL` when pointing at a local API.

See `.env.example` for documented variables including **feature flags** below.

### Feature flags (`NEXT_PUBLIC_*`)

- `NEXT_PUBLIC_CLAUDE_STATUS` — expected `active` for launch (`active` \| `coming_soon` \| `hidden`).
- `NEXT_PUBLIC_CHATGPT_STATUS` — use `coming_soon` before ChatGPT MCP is validated for your wave; use `hidden` if the tab must not appear; set to `active` when ChatGPT instructions are verified and screenshots are in `/public/images/connect/chatgpt/`.

For ChatGPT Waves 2 and 3, **flipping `NEXT_PUBLIC_CHATGPT_STATUS` to `active` in Vercel and redeploying** should expose the full ChatGPT path on `/connect` (see `ChatGPTInstructions.tsx`). If anything else requires a code merge, treat that as a bug.

Operational steps: [`docs/launch-checklist.md`](docs/launch-checklist.md).

## Scripts

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Related services

Fastify API: `api.dietagent.com` — first-party routes include `/me/waitlist` (waitlist signup from the dashboard; see API migrations).
