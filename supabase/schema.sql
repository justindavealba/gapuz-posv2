-- Gapuz POS - Supabase schema
-- Run this in Supabase Dashboard -> SQL Editor -> New query -> Run.

-- PROFILES (role + display name for each auth user)
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null,
  role       text not null default 'cashier' check (role in ('admin','cashier')),
  created_at timestamptz not null default now()
);

-- PRODUCTS
create table if not exists products (
  id            bigint generated always as identity primary key,
  name          text not null,
  category      text not null,
  price         numeric(12,2) not null default 0,
  cost_price    numeric(12,2) not null default 0,
  stock         integer not null default 0,
  barcode       text unique,
  icon          text,
  image         text,
  sold          integer not null default 0,
  created_at    timestamptz not null default now(),
  last_sold_at  timestamptz
);

-- CUSTOMERS
create table if not exists customers (
  id           bigint generated always as identity primary key,
  name         text not null,
  email        text,
  phone        text,
  address      text,
  points       integer not null default 0,
  purchases    integer not null default 0,
  total_spent  numeric(12,2) not null default 0,
  created_at   timestamptz not null default now()
);

-- TRANSACTIONS
-- payment holds values like Cash, GCash, Card, or a combined string for split payments
create table if not exists transactions (
  id             bigint generated always as identity primary key,
  customer_id    bigint references customers(id) on delete set null,
  customer_name  text not null default 'Walk-in',
  payment        text not null,
  subtotal       numeric(12,2) not null,
  disc_amt       numeric(12,2) not null default 0,
  vat            numeric(12,2) not null default 0,
  total          numeric(12,2) not null,
  cash_given     numeric(12,2) not null default 0,
  status         text not null default 'Completed',
  cashier_name   text,
  items          jsonb not null,
  created_at     timestamptz not null default now()
);

-- REFUNDS
create table if not exists refunds (
  id              bigint generated always as identity primary key,
  transaction_id  bigint references transactions(id) on delete set null,
  customer_name   text,
  reason          text,
  refund_method   text,
  notes           text,
  total           numeric(12,2) not null,
  status          text not null default 'Pending' check (status in ('Pending','Approved','Rejected')),
  processed_by    text,
  items           jsonb not null,
  created_at      timestamptz not null default now()
);

-- HOLDS (parked carts)
create table if not exists holds (
  id           bigint generated always as identity primary key,
  label        text not null,
  items        jsonb not null,
  customer_id  bigint references customers(id) on delete set null,
  saved_at     timestamptz not null default now()
);

-- Row Level Security
-- Simple policy: any signed-in user (admin or cashier) can read/write everything.
alter table profiles     enable row level security;
alter table products     enable row level security;
alter table customers    enable row level security;
alter table transactions enable row level security;
alter table refunds      enable row level security;
alter table holds        enable row level security;

create policy "authenticated read profiles" on profiles for select using (auth.role() = 'authenticated');
create policy "authenticated all products" on products for all using (auth.role() = 'authenticated');
create policy "authenticated all customers" on customers for all using (auth.role() = 'authenticated');
create policy "authenticated all transactions" on transactions for all using (auth.role() = 'authenticated');
create policy "authenticated all refunds" on refunds for all using (auth.role() = 'authenticated');
create policy "authenticated all holds" on holds for all using (auth.role() = 'authenticated');
