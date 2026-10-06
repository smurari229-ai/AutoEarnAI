create or replace function private.reserve_withdrawal(
  p_withdrawal_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_request public.withdrawal_requests%rowtype;
  v_available bigint;
begin
  select * into v_request from public.withdrawal_requests where id=p_withdrawal_id for update;
  if not found then raise exception 'WITHDRAWAL_NOT_FOUND'; end if;
  if v_request.status <> 'requested' then raise exception 'WITHDRAWAL_NOT_REQUESTED'; end if;

  perform pg_advisory_xact_lock(hashtext(v_request.user_id::text));

  select (balance_minor-reserved_minor) into v_available
  from public.wallets where user_id=v_request.user_id for update;
  if not found then raise exception 'WALLET_NOT_FOUND'; end if;
  if v_available < v_request.amount_minor then raise exception 'INSUFFICIENT_AVAILABLE_BALANCE'; end if;

  update public.wallets
  set reserved_minor=reserved_minor+v_request.amount_minor, updated_at=now()
  where user_id=v_request.user_id;

  update public.withdrawal_requests
  set status='under_review', updated_at=now()
  where id=v_request.id and status='requested';

  return jsonb_build_object('status','reserved','withdrawal_id',v_request.id,'amount_minor',v_request.amount_minor);
end
$function$;

create or replace function private.release_withdrawal_reservation(
  p_withdrawal_id uuid,
  p_failure_reason text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_request public.withdrawal_requests%rowtype;
begin
  select * into v_request from public.withdrawal_requests where id=p_withdrawal_id for update;
  if not found then raise exception 'WITHDRAWAL_NOT_FOUND'; end if;
  if v_request.status not in ('under_review','processing') then raise exception 'WITHDRAWAL_NOT_RELEASEABLE'; end if;

  perform pg_advisory_xact_lock(hashtext(v_request.user_id::text));

  update public.wallets
  set reserved_minor=reserved_minor-v_request.amount_minor, updated_at=now()
  where user_id=v_request.user_id and reserved_minor>=v_request.amount_minor;
  if not found then raise exception 'RESERVATION_NOT_FOUND'; end if;

  update public.withdrawal_requests
  set status='failed', failure_reason=left(p_failure_reason,1000), updated_at=now()
  where id=v_request.id;

  return jsonb_build_object('status','released','withdrawal_id',v_request.id);
end
$function$;

revoke all on function private.reserve_withdrawal(uuid) from public,anon,authenticated;
revoke all on function private.release_withdrawal_reservation(uuid,text) from public,anon,authenticated;
