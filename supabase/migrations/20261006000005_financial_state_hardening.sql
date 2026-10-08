-- Financial state hardening: positive amounts, valid state machines,
-- and database-level idempotency for payment, withdrawal, webhook, and wallet records.
alter table public.payment_orders
  add constraint payment_orders_amount_positive check (amount_minor > 0),
  add constraint payment_orders_status_valid check (status in ('pending','processing','paid','failed','cancelled','refunded')),
  add constraint payment_orders_currency_valid check (currency = upper(currency) and length(currency)=3);

alter table public.withdrawal_requests
  add constraint withdrawal_amount_positive check (amount_minor > 0),
  add constraint withdrawal_status_valid check (status in ('requested','processing','paid','failed','cancelled')),
  add constraint withdrawal_currency_valid check (currency = upper(currency) and length(currency)=3);

create unique index if not exists payment_orders_user_idempotency_uidx on public.payment_orders(user_id,idempotency_key) where idempotency_key is not null;
create unique index if not exists payment_orders_provider_order_uidx on public.payment_orders(provider,provider_order_id) where provider is not null and provider_order_id is not null;
create unique index if not exists payment_orders_provider_payment_uidx on public.payment_orders(provider,provider_payment_id) where provider is not null and provider_payment_id is not null;
create unique index if not exists withdrawal_requests_user_idempotency_uidx on public.withdrawal_requests(user_id,idempotency_key) where idempotency_key is not null;
create unique index if not exists webhook_events_provider_event_uidx on public.webhook_events(provider,event_id);
create unique index if not exists wallet_transactions_idempotency_uidx on public.wallet_transactions(user_id,idempotency_key) where idempotency_key is not null;
