-- Harden server-only webhook table and auth trigger permissions.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop policy if exists webhook_events_deny_all on public.webhook_events;
create policy webhook_events_deny_all on public.webhook_events
for all to anon, authenticated
using (false)
with check (false);
