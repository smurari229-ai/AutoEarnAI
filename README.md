# AutoEarnAI — Honest AI Content & Strategy Demo

> ⚠️ **THIS IS A SIMULATION. NO REAL MONEY IS BEING EARNED OR MOVED. ALL BALANCES AND PROFITS ARE FAKE.**

## Current mode: DEMO / SIMULATION ONLY

AutoEarnAI is currently an **honest UI and AI-content simulation**, not a real-money earning platform.

- No real earnings are generated.
- No real profits are generated.
- No real deposits are accepted.
- No real withdrawals are paid.
- No real AdSense or affiliate commissions are collected.
- No real Upwork/freelance payouts are received.
- No real stock/crypto trades are executed.
- Any balance, profit, earning, target, trade result, revenue, or similar financial-looking value shown by the UI is **SIMULATED** and must not be treated as real financial evidence.
- AI output is content, analysis, or strategy guidance only. It is not proof of revenue, a completed client job, a trade, or a payout.

The red simulation warning is intentionally permanent and non-dismissible so a new visitor cannot reasonably mistake this interface for a live money system.

## What is currently real

The repository contains engineering foundations for:

- React + TypeScript + Vite + Tailwind CSS UI.
- Supabase Auth integration with signed JWTs held in memory only; the browser does not persist auth tokens in localStorage. A page reload requires signing in again until an httpOnly-cookie session is implemented.
- Supabase/Postgres persistence and Row Level Security.
- Server-side authentication checks on protected API routes.
- Server-authoritative AI usage limits.
- Financial ledger primitives and idempotency protections.
- Gemini-assisted content generation when configured.
- Provider-gated payment and withdrawal request boundaries.

These foundations do **not** mean real-money settlement is enabled.

## What is simulated or disabled

| Feature | Current state |
|---|---|
| Earnings/profits | **SIMULATED / NOT REAL** |
| Wallet money movement | **DISABLED** |
| Deposits | **DISABLED — no verified payment provider** |
| Withdrawals | **REQUEST-ONLY / NO PAYOUT** |
| Stock/crypto trading | **SIMULATION / EDUCATION ONLY** |
| YouTube/AdSense income | **CONTENT IDEAS ONLY** |
| Affiliate commissions | **CONTENT/STRATEGY ONLY** |
| Upwork/freelance income | **PROPOSAL/CONTENT ONLY** |
| Ad revenue | **CONTENT/STRATEGY ONLY** |

## What would be required to make a feature real

### Real authentication

A production release needs a verified email/SMS provider configuration, secure session handling, abuse/rate controls, monitoring, and security testing. OTPs must never be returned to clients or logged.

### Real wallet and deposits

A production release needs a real payment provider such as Razorpay, Cashfree, or Stripe, with:

1. Server-side order creation.
2. Provider-side payment confirmation.
3. Cryptographic webhook/signature verification.
4. Idempotent event processing.
5. Atomic settlement into the private Postgres ledger.
6. Reconciliation and operational monitoring.

### Real withdrawals

A production release needs a verified payout provider and a trusted server-side workflow:

1. Reserve funds atomically.
2. Create the provider payout.
3. Verify provider status.
4. Mark the request paid only after verified evidence.
5. Release the reservation safely on failure.
6. Reconcile retries and duplicate events.

### Real stock/crypto trading

If trading is ever enabled, it requires an approved broker/exchange API, authenticated server-side execution, real user consent and risk controls, real capital, reconciliation, audit logs, and explicit disclosure of investment risk. Simulated win rates or P&L must never be presented as live results.

### Real YouTube / affiliate / freelance monetization

Each revenue source would require the corresponding external platform API/account authorization and verified transaction evidence. Generated content alone cannot be described as earned revenue.

## Architecture

- **Frontend:** React + TypeScript + Vite + Tailwind CSS.
- **API:** Express/Node.js.
- **Auth/data:** Supabase Auth + PostgreSQL + RLS.
- **AI:** Gemini, server-side only.
- **Financial authority:** database ledger, never browser state.
- **Demo disclosure:** permanent red banner rendered at the application shell.

## Environment

Browser-safe:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Server-side:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `GEMINI_API_KEY` (optional)

Never expose service-role keys, payment secrets, broker secrets, or Gemini secrets through `VITE_` variables.

## Local development

1. Install dependencies with Bun.
2. Configure the environment variables.
3. Run `bun run dev`.
4. Run `bun run typecheck`.
5. Run `bun run build`.

## Release rule

**Do not market or launch this repository as a real-money earning platform while the required external providers and settlement workflows are not configured and independently verified.**

The safe current product identity is:

> **AutoEarnAI — Honest AI Content & Strategy Demo**

## Disclaimer

AI-generated content can be incorrect. Monetization platforms, financial markets, payment providers, and freelance platforms have their own rules and risks. AutoEarnAI does not claim that generated content equals revenue, that a client job exists, that a trade executed, or that a payout occurred.

## Acceptance criteria for Phase 1

A new visitor opening the site must immediately see the permanent red simulation warning and must be able to understand from the product metadata and README that:

**NO REAL MONEY IS BEING EARNED OR MOVED. ALL BALANCES AND PROFITS ARE FAKE.**
