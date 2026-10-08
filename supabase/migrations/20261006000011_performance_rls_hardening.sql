-- Performance and RLS hardening applied to the production Supabase project.
-- Keeps ownership semantics unchanged while avoiding per-row auth.uid() evaluation
-- and removing duplicate unique indexes. The FK index supports wallet transaction joins.
drop index if exists public.payment_orders_idempotency_idx;
drop index if exists public.payment_orders_provider_order_idx;
drop index if exists public.wallet_transactions_idempotency_idx;
drop index if exists public.webhook_events_provider_event_uidx;
drop index if exists public.withdrawal_requests_idempotency_idx;

create index if not exists wallet_transactions_wallet_user_id_idx
  on public.wallet_transactions(wallet_user_id);

alter policy profiles_select_own on public.profiles
  using (id = (select auth.uid()));
alter policy profiles_insert_own on public.profiles
  with check (id = (select auth.uid()));
alter policy profiles_update_own on public.profiles
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

alter policy wallets_select_own on public.wallets
  using (user_id = (select auth.uid()));
alter policy wallet_transactions_select_own on public.wallet_transactions
  using (user_id = (select auth.uid()));
alter policy earnings_select_own on public.earnings
  using (user_id = (select auth.uid()));

alter policy payment_orders_select_own on public.payment_orders
  using (user_id = (select auth.uid()));
alter policy payment_orders_insert_own on public.payment_orders
  with check (
    user_id = (select auth.uid())
    and status = 'pending'
    and amount_minor > 0
    and currency = 'INR'
  );

alter policy withdrawal_requests_select_own on public.withdrawal_requests
  using (user_id = (select auth.uid()));
alter policy withdrawal_requests_insert_own on public.withdrawal_requests
  with check (
    user_id = (select auth.uid())
    and status = 'requested'
    and amount_minor > 0
    and currency = 'INR'
  );

alter policy ai_usage_select_own on public.ai_usage
  using (user_id = (select auth.uid()));
