-- Rela Music · planes de pago (Rela Pro y Artist Pro)
-- Cómo usarlo: Supabase → SQL Editor → pega este archivo → Run. Se puede ejecutar más de una vez.

-- Plan activo de cada persona. Solo lo escribe el servidor (con la clave secreta) cuando Stripe confirma el pago;
-- nadie puede darse un plan a sí mismo desde la web. Todo el mundo puede ver quién es Pro (para la insignia).
create table if not exists public.subscriptions (
  user_id uuid references public.profiles(id) on delete cascade,
  plan text not null check (plan in ('pro','artist')),
  status text not null default 'active',
  period text check (period in ('month','year')),
  current_period_end timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, plan)
);
alter table public.subscriptions enable row level security;
drop policy if exists "ver planes" on public.subscriptions;
create policy "ver planes" on public.subscriptions for select using (true);

-- Cliente de Stripe de cada persona (para "Gestionar suscripción"). Solo lo ve su dueño.
create table if not exists public.billing (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  stripe_customer text,
  updated_at timestamptz not null default now()
);
alter table public.billing enable row level security;
drop policy if exists "mi facturacion" on public.billing;
create policy "mi facturacion" on public.billing for select to authenticated using (auth.uid() = user_id);

-- Lista de espera mientras los pagos no estén activados
create table if not exists public.pro_interest (
  user_id uuid references public.profiles(id) on delete cascade,
  plan text not null check (plan in ('pro','artist')),
  period text,
  created_at timestamptz not null default now(),
  primary key (user_id, plan)
);
alter table public.pro_interest enable row level security;
drop policy if exists "apuntarme" on public.pro_interest;
create policy "apuntarme" on public.pro_interest for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
