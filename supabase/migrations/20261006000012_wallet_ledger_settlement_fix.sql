-- Correct the private ledger settlement functions to satisfy the wallet_transactions
-- schema (wallet_user_id is NOT NULL) and scope idempotency to the owner.
-- Existing ledger history is not rewritten.

create or replace function private.wallet_credit(
  p_user_id uuid,
  p_amount_minor bigint,
  p_currency text,
  p_provider text,
  p_provider_reference text,
  p_idempotency_key text,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  existing public.wallet_transactions;
  w public.wallets;
begin
  if p_user_id is null
     or p_amount_minor <= 0
     or coalesce(p_currency, '') <> 'INR'
     or length(coalesce(p_idempotency_key, '')) < 8
     or length(coalesce(p_idempotency_key, '')) > 128 then
    raise exception 'INVALID_TRANSACTION';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_user_id::text));

  select * into existing
  from public.wallet_transactions
  where user_id = p_user_id and idempotency_key = p_idempotency_key
  limit 1;
  if found then
    return jsonb_build_object('status', 'duplicate', 'transaction_id', existing.id);
  end if;

  insert into public.wallets(user_id, balance_minor, currency)
  values (p_user_id, 0, p_currency)
  on conflict (user_id) do nothing;

  update public.wallets
  set balance_minor = balance_minor + p_amount_minor, updated_at = now()
  where user_id = p_user_id and currency = p_currency
  returning * into w;
  if not found then raise exception 'WALLET_CURRENCY_MISMATCH'; end if;

  insert into public.wallet_transactions(
    user_id, wallet_user_id, type, amount_minor, currency, status,
    provider, provider_reference, idempotency_key, metadata
  ) values (
    p_user_id, p_user_id, 'deposit', p_amount_minor, p_currency, 'completed',
    p_provider, p_provider_reference, p_idempotency_key, coalesce(p_metadata, '{}'::jsonb)
  ) returning * into existing;

  return jsonb_build_object(
    'status', 'credited',
    'transaction_id', existing.id,
    'balance_minor', w.balance_minor
  );
end
$function$;

create or replace function private.wallet_debit(
  p_user_id uuid,
  p_amount_minor bigint,
  p_currency text,
  p_provider text,
  p_provider_reference text,
  p_idempotency_key text,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  existing public.wallet_transactions;
  w public.wallets;
begin
  if p_user_id is null
     or p_amount_minor <= 0
     or coalesce(p_currency, '') <> 'INR'
     or length(coalesce(p_idempotency_key, '')) < 8
     or length(coalesce(p_idempotency_key, '')) > 128 then
    raise exception 'INVALID_TRANSACTION';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_user_id::text));

  select * into existing
  from public.wallet_transactions
  where user_id = p_user_id and idempotency_key = p_idempotency_key
  limit 1;
  if found then
    return jsonb_build_object('status', 'duplicate', 'transaction_id', existing.id);
  end if;

  select * into w from public.wallets where user_id = p_user_id for update;
  if not found then raise exception 'WALLET_NOT_FOUND'; end if;
  if w.currency <> p_currency then raise exception 'CURRENCY_MISMATCH'; end if;
  if w.balance_minor - w.reserved_minor < p_amount_minor then
    raise exception 'INSUFFICIENT_AVAILABLE_FUNDS';
  end if;

  update public.wallets
  set balance_minor = balance_minor - p_amount_minor, updated_at = now()
  where user_id = p_user_id
  returning * into w;

  insert into public.wallet_transactions(
    user_id, wallet_user_id, type, amount_minor, currency, status,
    provider, provider_reference, idempotency_key, metadata
  ) values (
    p_user_id, p_user_id, 'withdrawal', p_amount_minor, p_currency, 'completed',
    p_provider, p_provider_reference, p_idempotency_key, coalesce(p_metadata, '{}'::jsonb)
  ) returning * into existing;

  return jsonb_build_object(
    'status', 'debited',
    'transaction_id', existing.id,
    'balance_minor', w.balance_minor
  );
end
$function$;

revoke all on function private.wallet_credit(uuid,bigint,text,text,text,text,jsonb)
  from public, anon, authenticated;
revoke all on function private.wallet_debit(uuid,bigint,text,text,text,text,jsonb)
  from public, anon, authenticated;
