-- Rela · actualización 003: seguir artistas
-- Cómo usarlo: Supabase → SQL Editor → New query → pega este archivo → Run. Se puede ejecutar varias veces.

create table if not exists public.artist_follows (
  user_id uuid references public.profiles(id) on delete cascade,
  artist_id bigint not null,           -- id de Deezer
  artist_name text not null,
  picture_url text,
  fans int,
  created_at timestamptz not null default now(),
  primary key (user_id, artist_id)
);
create index if not exists artist_follows_artist_idx on public.artist_follows (artist_id);

alter table public.artist_follows enable row level security;
drop policy if exists "leer artistas seguidos" on public.artist_follows;
create policy "leer artistas seguidos" on public.artist_follows for select using (true);
drop policy if exists "mis artistas seguidos" on public.artist_follows;
create policy "mis artistas seguidos" on public.artist_follows for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
