# AutoEarnAI

AutoEarnAI is an AI-assisted content and strategy workspace. It is **not currently a real-money autonomous earning platform**.

## Current safety status

> **SIMULATION / DEMO MODE: THIS IS A SIMULATION. NO REAL MONEY IS BEING EARNED OR MOVED.**

The application deliberately blocks unconfigured deposits and payouts. AI-generated content is not financial proof.

### What is real

- Supabase Auth session handling.
- Supabase/Postgres wallet, transaction and earnings persistence.
- Row-level security for user isolation.
- Server-side authentication checks on protected API routes.
- Server-authoritative daily AI usage limits.
- Authenticated payment-order and withdrawal-request boundaries.
- AI content generation through Gemini when configured.

### What is not enabled

- Real payment-provider deposits.
- Real payout-provider withdrawals.
- Signed provider webhook settlement.
- Broker-connected stock trading.
- Automatic YouTube/AdSense monetization.
- Automatic affiliate commission collection.
- Automatic Upwork/freelance payouts.
- Automatic ad-revenue collection.

No wallet balance is created from AI output, simulated trades, generated content, clicks, views, CPM, budgets, or claimed client activity.

## Architecture

- Frontend: React + TypeScript + Vite + Tailwind CSS.
- API: Express/Node.js.
- Auth/data: Supabase Auth + PostgreSQL + RLS.
- AI: Gemini API, server-side only.
- Financial authority: Postgres ledger; browser state is display state only.

## Environment

Client-safe variables:

- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_KEY

Server variables:

- SUPABASE_URL
- SUPABASE_PUBLISHABLE_KEY
- GEMINI_API_KEY (optional; never expose it to the browser)

Never put a Supabase service-role/secret key or payment-provider secret in a VITE_ variable.

## Local development

1. Install dependencies with Bun.
2. Configure the environment variables.
3. Run `bun run dev`.
4. Run `bun run typecheck`.
5. Run `bun run build`.

## Real-money production gate

Real-money mode must remain disabled until all of the following are independently verified:

1. A supported payment provider is configured.
2. Provider-side payment orders are created server-side.
3. Provider signatures are cryptographically verified.
4. Verified payment events are persisted idempotently.
5. Only verified successful payments can credit the private wallet ledger.
6. Withdrawals use trusted reservation, payout and reconciliation workflows.
7. Automated tests cover authentication, RLS, idempotency, ledger invariants, webhooks and withdrawal state transitions.
8. Provider sandbox and production smoke tests pass.
9. Monitoring and operational recovery are in place.

Until then, any financial-looking demo values must be clearly marked as simulation and must not alter the real wallet ledger.

## Disclaimer

AI output can be incorrect. Trading and monetization involve risk and external platform rules. AutoEarnAI does not claim that generated content is revenue, a completed client job, a trade execution, or a payout.
