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
begin
  if not coalesce(p_signature_valid,false) then
    raise exception 'INVALID_WEBHOOK_SIGNATURE';
  end if;
  if length(trim(coalesce(p_provider,''))) < 2
     or length(trim(coalesce(p_event_id,''))) < 1
     or p_payload is null then
    raise exception 'INVALID_WEBHOOK_EVENT';
  end if;

  insert into public.webhook_events(provider,event_id,event_type,signature_valid,payload)
  values(lower(trim(p_provider)),trim(p_event_id),p_event_type,true,p_payload)
  on conflict(provider,event_id) do nothing
  returning id into v_id;

  if v_id is not null then
    v_inserted := true;
  else
    select id into v_id from public.webhook_events
    where provider=lower(trim(p_provider)) and event_id=trim(p_event_id);
  end if;

  return jsonb_build_object('status',case when v_inserted then 'accepted' else 'duplicate' end,'event_id',v_id);
end
$function$;

revoke all on function private.record_webhook_event(text,text,text,boolean,jsonb)
from public,anon,authenticated;
