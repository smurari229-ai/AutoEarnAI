create or replace function public.ensure_user_wallet()
returns public.wallets
language plpgsql
security invoker
set search_path = public
as $$
declare result public.wallets;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  insert into public.profiles(id) values (auth.uid()) on conflict (id) do nothing;
  insert into public.wallets(user_id) values (auth.uid()) on conflict (user_id) do nothing;
  select * into result from public.wallets where user_id = auth.uid();
  return result;
end;
$$;

revoke all on function public.ensure_user_wallet() from public, anon;
grant execute on function public.ensure_user_wallet() to authenticated;

create or replace function public.increment_ai_usage()
returns public.ai_usage
language plpgsql
security invoker
set search_path = public
as $$
declare result public.ai_usage;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  insert into public.ai_usage(user_id, usage_date, request_count)
  values (auth.uid(), current_date, 1)
  on conflict (user_id, usage_date)
  do update set request_count = public.ai_usage.request_count + 1, updated_at = now()
  returning * into result;
  return result;
end;
$$;

revoke all on function public.increment_ai_usage() from public, anon;
grant execute on function public.increment_ai_usage() to authenticated;
