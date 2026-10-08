-- Allow Razorpay to retry an event when a previous attempt failed mid-processing.
-- An event is a duplicate only after the handler explicitly marks it processed.

create or replace function private.record_webhook_event(
  p_provider text,
  p_event_id text,
  p_event_type text,
  p_signature_valid boolean,
  p_payload jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_id uuid;
  v_inserted boolean := false;
  v_processed boolean := false;
begin
  if not coalesce(p_signature_valid, false) then
    raise exception 'INVALID_WEBHOOK_SIGNATURE';
  end if;
  if length(trim(coalesce(p_provider, ''))) < 2
     or length(trim(coalesce(p_event_id, ''))) < 1
     or p_payload is null then
    raise exception 'INVALID_WEBHOOK_EVENT';
  end if;

  insert into public.webhook_events(provider, event_id, event_type, signature_valid, payload)
  values(lower(trim(p_provider)), trim(p_event_id), p_event_type, true, p_payload)
  on conflict(provider, event_id) do nothing
  returning id into v_id;

  if v_id is not null then
    v_inserted := true;
  else
    select id, processed into v_id, v_processed
    from public.webhook_events
    where provider = lower(trim(p_provider))
      and event_id = trim(p_event_id)
    for update;
    if not found then
      raise exception 'WEBHOOK_EVENT_LOOKUP_FAILED';
    end if;
  end if;

  return jsonb_build_object(
    'status', case
      when v_inserted then 'accepted'
      when v_processed then 'duplicate'
      else 'retry'
    end,
    'event_id', v_id
  );
end
$function$;

create or replace function private.mark_webhook_event_processed(
  p_provider text,
  p_event_id text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_id uuid;
begin
  update public.webhook_events
  set processed = true,
      processed_at = now(),
      error_message = null
  where provider = lower(trim(coalesce(p_provider, '')))
    and event_id = trim(coalesce(p_event_id, ''))
    and signature_valid = true
  returning id into v_id;

  if v_id is null then
    raise exception 'WEBHOOK_EVENT_NOT_FOUND';
  end if;

  return jsonb_build_object('status', 'processed', 'event_id', v_id);
end
$function$;

revoke all on function private.record_webhook_event(text,text,text,boolean,jsonb)
  from public, anon, authenticated;
revoke all on function private.mark_webhook_event_processed(text,text)
  from public, anon, authenticated;

create or replace function public.mark_webhook_event_processed(
  p_provider text,
  p_event_id text
) returns jsonb
language sql
security definer
set search_path = public, private
as $function$
  select private.mark_webhook_event_processed(p_provider, p_event_id);
$function$;

revoke all on function public.mark_webhook_event_processed(text,text)
  from public, anon, authenticated;
grant execute on function public.mark_webhook_event_processed(text,text)
  to service_role;
