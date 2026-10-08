import React from 'react';

export function HowItWorks() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">How AutoEarnAI Works</h1>
        <p className="mt-2 text-sm text-slate-400">Transparent capability and limitation map. No simulated financial outcome is presented as real.</p>
      </div>

      <div className="rounded-2xl border border-rose-700 bg-rose-950/60 p-5">
        <h2 className="text-lg font-bold text-rose-100">SIMULATION / DEMO MODE</h2>
        <p className="mt-2 text-sm text-rose-200">THIS IS A SIMULATION. NO REAL MONEY IS BEING EARNED OR MOVED.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[
          ['AI content generation', 'REAL WHEN CONFIGURED', 'Gemini generation requires the server-side GEMINI_API_KEY. Without that key, the app uses a deterministic demo fallback and marks the result as simulation. Generated text is never proof of revenue, a client, a trade or a payout.'],
          ['Authentication', 'REAL CAPABILITY', 'Supabase Auth owns the session. Legacy demo OTP endpoints and master OTPs are disabled.'],
          ['Wallet database', 'REAL CAPABILITY', 'Supabase/Postgres stores user wallets and ledger records with row-level security. Browser state is not the financial authority.'],
          ['Deposits', 'BLOCKED', 'No payment provider is configured. Deposit requests cannot credit the wallet.'],
          ['Withdrawals', 'BLOCKED / REQUEST-ONLY', 'Users can create an authenticated withdrawal request, but trusted reservation and provider payout are not enabled.'],
          ['Trading', 'SIMULATION / EDUCATION ONLY', 'No broker is connected. Auto-cycle must never claim that a trade, price, P&L or investment result occurred.'],
          ['YouTube / Social / Freelance / News', 'CONTENT ONLY', 'No automatic AdSense, affiliate commission, Upwork payout, client contract or ad revenue is claimed without a verified external provider.'],
          ['Production money movement', 'NOT READY', 'A verified payment/payout provider, signed webhooks, trusted settlement execution, monitoring and end-to-end tests are still required.'],
        ].map(([title, status, text]) => (
          <article key={title} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{status}</div>
            <h2 className="mt-1 text-base font-bold text-white">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
          </article>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="text-lg font-bold text-white">What changes before real-money production?</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-400">
          <li>Configure a supported payment provider and create provider-side payment orders.</li>
          <li>Verify signed provider webhooks and settle only verified successful payments.</li>
          <li>Run withdrawals through trusted server-side reservation, payout and reconciliation workflows.</li>
          <li>Add automated tests for RLS, idempotency, webhook replay, ledger invariants and withdrawal state transitions.</li>
          <li>Complete provider sandbox and production smoke tests before enabling any real-money switch.</li>
        </ul>
      </div>
    </section>
  );
}
