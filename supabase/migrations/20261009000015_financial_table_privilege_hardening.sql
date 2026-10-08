-- Defense in depth: RLS policies remain enabled, and untrusted clients cannot mutate financial ledgers.
-- Trusted server/Edge Functions use service_role and retain full table access.
revoke all privileges on table
  public.wallets,
  public.wallet_transactions,
  public.earnings,
  public.payment_orders,
  public.withdrawal_requests,
  public.webhook_events
from public, anon, authenticated;

grant select on table
  public.wallets,
  public.wallet_transactions,
  public.earnings,
  public.payment_orders,
  public.withdrawal_requests
to authenticated;

-- Withdrawal requests are the only financial write initiated by an authenticated client.
-- The RLS WITH CHECK policy still restricts rows to the caller and status='requested'.
grant insert on table public.withdrawal_requests to authenticated;

grant all privileges on table
  public.wallets,
  public.wallet_transactions,
  public.earnings,
  public.payment_orders,
  public.withdrawal_requests,
  public.webhook_events
to service_role;
