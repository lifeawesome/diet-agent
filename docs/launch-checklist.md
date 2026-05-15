# DietAgent Client Activation Checklist

This document is the operational playbook for activating ChatGPT support
(Wave 2 and Wave 3). It exists because the engineering work was front-loaded
during the Claude-only launch.

## Wave 2 — ChatGPT Business / Enterprise / Edu

Prerequisite: backend `search` and `fetch` tools are deployed and verified
working in MCP Inspector.

Steps:

1. Capture screenshots of the ChatGPT Settings → Apps & Connectors → Add new
   connector flow (Developer Mode enabled). Save to /public/images/connect/chatgpt/.
2. Verify `components/connect/ChatGPTInstructions.tsx` content matches the
   current ChatGPT UI. Update step-by-step copy if Apple^h^h^h OpenAI has
   changed the panel since this was written.
3. Flip NEXT_PUBLIC_CHATGPT_STATUS from `coming_soon` to `active` in Vercel
   environment variables.
4. Redeploy (Vercel auto-redeploys on env var change).
5. Email all waitlist entries with `client_interest IN ('business', 'enterprise')`
   to announce availability.
6. Monitor `/connections` and the audit log to confirm ChatGPT connections
   succeed end-to-end.

## Wave 3 — ChatGPT Plus via Apps SDK

Prerequisite: DietAgent has been packaged with OpenAI's Apps SDK, submitted
to the ChatGPT app directory, and approved.

Steps:

1. Confirm the directory listing is live and the app reaches Plus users.
2. Update `components/connect/ChatGPTInstructions.tsx` to reflect the
   directory-based connection flow (likely simpler than Developer Mode —
   one-click from the app store rather than pasting a URL).
3. Email all remaining waitlist entries with `client_interest = 'plus'`.
4. Update marketing copy: hero, dashboard CTA, anywhere that mentions clients.
5. Consider whether `NEXT_PUBLIC_CHATGPT_STATUS` needs a third state (e.g.
   `app_store`) to differentiate the connection flow. If so, extend the flag
   type rather than adding new components.

## Wave-agnostic rollback

If a wave's ChatGPT experience is broken, flip
`NEXT_PUBLIC_CHATGPT_STATUS` back to `coming_soon` immediately. Existing
ChatGPT connections (already-authorized clients) continue to work via MCP;
only the Connect page UI changes. There is no data loss risk in toggling.
