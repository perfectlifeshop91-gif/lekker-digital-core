
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  price numeric(10,2) not null check (price >= 0),
  image text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create sequence public.order_number_seq start 1000;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number int not null unique default nextval('public.order_number_seq'),
  subtotal numeric(10,2) not null default 0,
  tax numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  payment_method text not null default 'cash',
  status text not null default 'paid',
  table_number text,
  customer_name text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  price numeric(10,2) not null,
  quantity int not null check (quantity > 0),
  subtotal numeric(10,2) not null
);

create index on public.order_items(order_id);
create index on public.orders(created_at desc);

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "public read products" on public.products for select using (true);
create policy "public write products" on public.products for insert with check (true);
create policy "public update products" on public.products for update using (true);
create policy "public delete products" on public.products for delete using (true);

create policy "public read orders" on public.orders for select using (true);
create policy "public insert orders" on public.orders for insert with check (true);
create policy "public update orders" on public.orders for update using (true);

create policy "public read order_items" on public.order_items for select using (true);
create policy "public insert order_items" on public.order_items for insert with check (true);
