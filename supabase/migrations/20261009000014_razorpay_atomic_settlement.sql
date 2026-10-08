-- Serialize Razorpay payment state transitions and wallet settlement in one DB transaction.
-- This prevents a verified captured payment from being credited while its order stays pending,
-- and prevents a late payment.failed event from downgrading a paid order.

create or replace function private.settle_razorpay_payment(
  p_provider_order_id text,
  p_payment_id text,
  p_amount_minor bigint,
  p_currency text,
  p_event_id text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_order public.payment_orders%rowtype;
  v_credit jsonb;
begin
  if length(trim(coalesce(p_provider_order_id, ''))) = 0
     or length(trim(coalesce(p_payment_id, ''))) = 0
     or length(trim(coalesce(p_event_id, ''))) = 0
     or coalesce(p_amount_minor, 0) <= 0
     or upper(coalesce(p_currency, '')) <> 'INR' then
    raise exception 'INVALID_PAYMENT_SETTLEMENT';
  end if;

  select * into v_order
  from public.payment_orders
  where provider = 'razorpay'
    and provider_order_id = trim(p_provider_order_id)
  for update;

  if not found then
    raise exception 'UNKNOWN_PROVIDER_ORDER';
  end if;

  if v_order.amount_minor <> p_amount_minor
     or upper(v_order.currency) <> upper(p_currency) then
    raise exception 'PAYMENT_AMOUNT_OR_CURRENCY_MISMATCH';
  end if;

  if v_order.status = 'paid' then
    if v_order.provider_payment_id is not null
       and v_order.provider_payment_id <> trim(p_payment_id) then
      raise exception 'PAYMENT_ID_CONFLICT';
    end if;
    return jsonb_build_object(
      'status', 'already_paid',
      'payment_order_id', v_order.id,
      'provider_payment_id', coalesce(v_order.provider_payment_id, trim(p_payment_id))
    );
  end if;

  -- A captured event is authoritative even if a failed event arrived first.
  -- Cancelled/refunded orders are terminal and must not receive another credit.
  if v_order.status not in ('pending', 'processing', 'failed') then
    return jsonb_build_object('status', 'terminal', 'payment_order_id', v_order.id, 'order_status', v_order.status);
  end if;

  v_credit := private.wallet_credit(
    v_order.user_id,
    p_amount_minor,
    upper(p_currency),
    'razorpay',
    trim(p_payment_id),
    'razorpay:payment:' || trim(p_payment_id),
    jsonb_build_object(
      'payment_order_id', v_order.id,
      'provider_order_id', trim(p_provider_order_id),
      'event_id', trim(p_event_id)
    )
  );

  update public.payment_orders
  set status = 'paid',
      provider_payment_id = trim(p_payment_id),
      paid_at = coalesce(paid_at, now()),
      metadata = coalesce(metadata, '{}'::jsonb) ||
        jsonb_build_object('settled_by', 'razorpay-webhook', 'event_id', trim(p_event_id)),
      updated_at = now()
  where id = v_order.id;

  return jsonb_build_object(
    'status', 'settled',
    'payment_order_id', v_order.id,
    'transaction', v_credit
  );
end
$function$;

create or replace function private.mark_razorpay_payment_failed(
  p_provider_order_id text,
  p_payment_id text,
  p_amount_minor bigint,
  p_currency text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_order public.payment_orders%rowtype;
begin
  if length(trim(coalesce(p_provider_order_id, ''))) = 0
     or length(trim(coalesce(p_payment_id, ''))) = 0
     or coalesce(p_amount_minor, 0) <= 0
     or upper(coalesce(p_currency, '')) <> 'INR' then
    raise exception 'INVALID_PAYMENT_FAILURE_EVENT';
  end if;

  select * into v_order
  from public.payment_orders
  where provider = 'razorpay'
    and provider_order_id = trim(p_provider_order_id)
  for update;

  if not found then
    raise exception 'UNKNOWN_PROVIDER_ORDER';
  end if;

  if v_order.amount_minor <> p_amount_minor
     or upper(v_order.currency) <> upper(p_currency) then
    raise exception 'PAYMENT_AMOUNT_OR_CURRENCY_MISMATCH';
  end if;

  if v_order.status = 'paid' then
    return jsonb_build_object('status', 'already_paid', 'payment_order_id', v_order.id);
  end if;

  if v_order.status in ('pending', 'processing') then
    update public.payment_orders
    set status = 'failed',
        provider_payment_id = trim(p_payment_id),
        metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('failure_source', 'razorpay-webhook'),
        updated_at = now()
    where id = v_order.id;

    return jsonb_build_object('status', 'failed', 'payment_order_id', v_order.id);
  end if;

  return jsonb_build_object('status', v_order.status, 'payment_order_id', v_order.id);
end
$function$;

revoke all on function private.settle_razorpay_payment(text,text,bigint,text,text)
  from public, anon, authenticated;
revoke all on function private.mark_razorpay_payment_failed(text,text,bigint,text)
  from public, anon, authenticated;

create or replace function public.settle_razorpay_payment(
  p_provider_order_id text,
  p_payment_id text,
  p_amount_minor bigint,
  p_currency text,
  p_event_id text
) returns jsonb
language sql
security definer
set search_path = public, private
as $function$
  select private.settle_razorpay_payment(
    p_provider_order_id, p_payment_id, p_amount_minor, p_currency, p_event_id
  );
$function$;

create or replace function public.mark_razorpay_payment_failed(
  p_provider_order_id text,
  p_payment_id text,
  p_amount_minor bigint,
  p_currency text
) returns jsonb
language sql
security definer
set search_path = public, private
as $function$
  select private.mark_razorpay_payment_failed(
    p_provider_order_id, p_payment_id, p_amount_minor, p_currency
  );
$function$;

revoke all on function public.settle_razorpay_payment(text,text,bigint,text,text)
  from public, anon, authenticated;
revoke all on function public.mark_razorpay_payment_failed(text,text,bigint,text)
  from public, anon, authenticated;
grant execute on function public.settle_razorpay_payment(text,text,bigint,text,text)
  to service_role;
grant execute on function public.mark_razorpay_payment_failed(text,text,bigint,text)
  to service_role;
