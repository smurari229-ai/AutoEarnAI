drop policy if exists payment_orders_insert_own on public.payment_orders;
create policy payment_orders_insert_own on public.payment_orders
for insert to authenticated
with check (user_id = auth.uid() and status = 'pending' and amount_minor > 0 and currency = 'INR');

drop policy if exists withdrawal_requests_insert_own on public.withdrawal_requests;
create policy withdrawal_requests_insert_own on public.withdrawal_requests
for insert to authenticated
with check (
  user_id = auth.uid()
  and status = 'requested'
  and amount_minor > 0
  and currency = 'INR'
);

drop policy if exists webhook_events_all_deny on public.webhook_events;
create policy webhook_events_all_deny on public.webhook_events
for all to anon, authenticated using (false) with check (false);
