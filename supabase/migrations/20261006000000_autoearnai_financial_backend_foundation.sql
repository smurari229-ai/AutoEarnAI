-- AutoEarnAI financial backend foundation
-- Applied to Supabase project vveyqhscjtkkmcwbzdpc on 2026-10-06.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  currency text not null default 'INR' check (currency = 'INR'),
  balance_minor bigint not null default 0 check (balance_minor >= 0),
  reserved_minor bigint not null default 0 check (reserved_minor >= 0 and reserved_minor <= balance_minor),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  wallet_user_id uuid not null references public.wallets(user_id) on delete restrict,
  amount_minor bigint not null check (amount_minor <> 0),
  currency text not null default 'INR' check (currency = 'INR'),
  type text not null check (type in ('deposit','withdrawal','earning','refund','adjustment','reversal')),
  status text not null check (status in ('pending','processing','completed','failed','reversed','cancelled')),
  provider text,
  provider_reference text,
  idempotency_key text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists wallet_transactions_idempotency_idx
  on public.wallet_transactions(user_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists wallet_transactions_user_created_idx
  on public.wallet_transactions(user_id, created_at desc);

create table if not exists public.earnings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  channel text not null,
  status text not null check (status in ('simulation','pending','verified','credited','failed')),
  amount_minor bigint not null default 0 check (amount_minor >= 0),
  currency text not null default 'INR' check (currency = 'INR'),
  provider text,
  provider_reference text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  verified_at timestamptz
);

create index if not exists earnings_user_created_idx
  on public.earnings(user_id, created_at desc);

create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null default 'INR' check (currency = 'INR'),
  status text not null default 'pending' check (status in ('pending','processing','paid','failed','cancelled','refunded')),
  provider text,
  provider_order_id text,
  provider_payment_id text,
  idempotency_key text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz
);

create unique index if not exists payment_orders_provider_order_idx
  on public.payment_orders(provider, provider_order_id)
  where provider_order_id is not null;

create unique index if not exists payment_orders_idempotency_idx
  on public.payment_orders(user_id, idempotency_key)
  where idempotency_key is not null;

create table if not exists public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null default 'INR' check (currency = 'INR'),
  method text not null check (method in ('upi','bank','crypto')),
  destination jsonb not null default '{}'::jsonb,
  status text not null default 'requested' check (status in ('requested','under_review','processing','paid','failed','cancelled')),
  provider text,
  provider_reference text,
  idempotency_key text,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz
);

create unique index if not exists withdrawal_requests_idempotency_idx
  on public.withdrawal_requests(user_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists withdrawal_requests_user_created_idx
  on public.withdrawal_requests(user_id, created_at desc);

create table if not exists public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default current_date,
  request_count integer not null default 0 check (request_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  event_type text,
  signature_valid boolean not null default false,
  processed boolean not null default false,
  payload jsonb not null default '{}'::jsonb,
  error_message text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique(provider, event_id)
);

alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.earnings enable row level security;
alter table public.payment_orders enable row level security;
alter table public.withdrawal_requests enable row level security;
alter table public.ai_usage enable row level security;
alter table public.webhook_events enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using (id = auth.uid());

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles for insert to authenticated with check (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists wallets_select_own on public.wallets;
create policy wallets_select_own on public.wallets for select to authenticated using (user_id = auth.uid());

drop policy if exists wallet_transactions_select_own on public.wallet_transactions;
create policy wallet_transactions_select_own on public.wallet_transactions for select to authenticated using (user_id = auth.uid());

drop policy if exists earnings_select_own on public.earnings;
create policy earnings_select_own on public.earnings for select to authenticated using (user_id = auth.uid());

drop policy if exists payment_orders_select_own on public.payment_orders;
create policy payment_orders_select_own on public.payment_orders for select to authenticated using (user_id = auth.uid());

drop policy if exists withdrawal_requests_select_own on public.withdrawal_requests;
create policy withdrawal_requests_select_own on public.withdrawal_requests for select to authenticated using (user_id = auth.uid());

drop policy if exists ai_usage_select_own on public.ai_usage;
create policy ai_usage_select_own on public.ai_usage for select to authenticated using (user_id = auth.uid());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(id, display_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.phone
  )
  on conflict (id) do nothing;

  insert into public.wallets(user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
