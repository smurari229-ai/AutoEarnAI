# EarnPilot

EarnPilot is an AI-assisted earnings operations dashboard that reads authorized provider data and generates creator-content assistance.

## No guaranteed income

**No guaranteed income.** EarnPilot does not promise or guarantee earnings, views, conversions, payouts, returns, or financial performance. Provider revenue can be estimated, delayed, reversed, or adjusted by the provider.

## Setup

1. Copy backend/.env.example to backend/.env.
2. Fill every required server secret.
3. Create PostgreSQL and Redis.
4. Run npm install in backend and frontend.
5. Run npx prisma generate and create/apply a Prisma migration.
6. Start backend with npm run dev and frontend with npm run dev.

## Google

Enable YouTube Data API v3, YouTube Analytics API, and AdSense Management API. Create a Web OAuth client and register both callback URLs. EarnPilot requests read-only YouTube/AdSense scopes and stores OAuth tokens encrypted with AES-256-GCM.

## Integrations

YouTube Analytics reads provider-reported estimated revenue. AdSense reads ESTIMATED_EARNINGS. Stripe reads the configured Stripe account balance and charges. Razorpay reads the configured Razorpay payment account. Gemini generates content assistance.

## Security

Passwords use bcrypt. Access/refresh tokens are JWTs. TOTP secrets and Google OAuth tokens are encrypted at rest. Server secrets are never VITE variables. Helmet, CORS, rate limiting, Zod validation, and provider-side APIs are used.

## Important

The wallet endpoints are payment operations for the configured operator accounts; they do not fabricate user earnings or provider balances. Real financial custody, payout, reconciliation, tax, KYC/AML, and provider compliance must be completed and verified before enabling any regulated money movement for end users.