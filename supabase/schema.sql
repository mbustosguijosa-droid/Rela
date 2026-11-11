-- Rela · esquema de base de datos para Supabase (Postgres)
-- Cómo usarlo: Supabase → SQL Editor → pega este archivo → Run.

-- Perfiles (uno por cuenta de usuario)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text unique not null check (handle ~ '^[a-z0-9._]{3,24}$'),
  name text not null default '',
  bio text not null default '' check (char_length(bio) <= 160),
  city text not null default '',
  avatar_url text,
  banner_url text,
  banner_release_id bigint,
  accent text not null default '#a77bff',
  loop_release_id bigint,
  favorites bigint[] not null default '{}' check (cardinality(favorites) <= 4),
  created_at timestamptz not null default now()
);

-- Caché de lanzamientos de Deezer (se rellena cuando alguien puntúa o reseña)
create table if not exists public.releases (
  id bigint primary key,               -- id de Deezer
  title text not null,
  artist_id bigint not null,
  artist_name text not null,
  artist_fans int,
  cover_url text,
  record_type text not null,           -- album | single | ep
  release_date date,
  tracks jsonb not null default '[]',  -- [{id, title}]
  cached_at timestamptz not null default now()
);

-- Nota de una persona a un lanzamiento
create table if not exists public.ratings (
  user_id uuid references public.profiles(id) on delete cascade,
  release_id bigint references public.releases(id) on delete cascade,
  overall numeric(3,1) check (overall between 1 and 10),
  fav_track int,
  listened boolean not null default true,
  liked boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, release_id)
);

-- Nota canción a canción
create table if not exists public.track_ratings (
  user_id uuid references public.profiles(id) on delete cascade,
  release_id bigint references public.releases(id) on delete cascade,
  track_index int not null,
  score numeric(3,1) not null check (score between 1 and 10),
  primary key (user_id, release_id, track_index)
);

-- Reseñas (una por persona y lanzamiento)
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  release_id bigint not null references public.releases(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, release_id)
);

-- Reacciones a reseñas: me gusta, fuego, de acuerdo, no estoy de acuerdo
create table if not exists public.review_reactions (
  review_id uuid references public.reviews(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('like','fuego','acuerdo','discrepo')),
  created_at timestamptz not null default now(),
  primary key (review_id, user_id, kind)
);

-- Respuestas a reseñas
create table if not exists public.replies (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

-- Amigos (seguir)
create table if not exists public.follows (
  follower_id uuid references public.profiles(id) on delete cascade,
  followee_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

-- Denuncias (moderación)
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('review','reply','profile')),
  target_id text not null,
  reason text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists reviews_release_idx on public.reviews (release_id);
create index if not exists replies_review_idx on public.replies (review_id);
create index if not exists ratings_release_idx on public.ratings (release_id);

-- Ranking de reseñas: interacción ponderada que pierde peso con el tiempo (igual que en el boceto)
create or replace view public.review_ranking as
select r.*,
  coalesce(x.likes,0) as likes, coalesce(x.fuego,0) as fuego, coalesce(x.acuerdo,0) as acuerdo, coalesce(x.discrepo,0) as discrepo,
  coalesce(p.n,0) as replies_count,
  (coalesce(x.likes,0) + 1.5*(coalesce(x.fuego,0)+coalesce(x.acuerdo,0)+coalesce(x.discrepo,0)) + 4*coalesce(p.n,0)) as engagement,
  (coalesce(x.likes,0) + 1.5*(coalesce(x.fuego,0)+coalesce(x.acuerdo,0)+coalesce(x.discrepo,0)) + 4*coalesce(p.n,0) + 1)
    / power(extract(epoch from (now() - r.created_at))/3600 + 2, 0.8) as hot_score
from public.reviews r
left join (
  select review_id,
    count(*) filter (where kind='like') as likes, count(*) filter (where kind='fuego') as fuego,
    count(*) filter (where kind='acuerdo') as acuerdo, count(*) filter (where kind='discrepo') as discrepo
  from public.review_reactions group by review_id
) x on x.review_id = r.id
left join (select review_id, count(*) as n from public.replies group by review_id) p on p.review_id = r.id;

-- Crear el perfil automáticamente al registrarse
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, handle, name)
  values (new.id, 'user_' || substr(replace(new.id::text,'-',''),1,10), coalesce(new.raw_user_meta_data->>'full_name',''));
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Seguridad: todo el mundo puede leer; cada persona solo escribe lo suyo
alter table public.profiles enable row level security;
alter table public.releases enable row level security;
alter table public.ratings enable row level security;
alter table public.track_ratings enable row level security;
alter table public.reviews enable row level security;
alter table public.review_reactions enable row level security;
alter table public.replies enable row level security;
alter table public.follows enable row level security;
alter table public.reports enable row level security;

drop policy if exists "leer perfiles" on public.profiles;
create policy "leer perfiles" on public.profiles for select using (true);
drop policy if exists "editar mi perfil" on public.profiles;
create policy "editar mi perfil" on public.profiles for update using (auth.uid() = id);

drop policy if exists "leer releases" on public.releases;
create policy "leer releases" on public.releases for select using (true);
drop policy if exists "cachear releases" on public.releases;
create policy "cachear releases" on public.releases for insert to authenticated with check (true);
drop policy if exists "actualizar releases" on public.releases;
create policy "actualizar releases" on public.releases for update to authenticated using (true);

drop policy if exists "leer notas" on public.ratings;
create policy "leer notas" on public.ratings for select using (true);
drop policy if exists "mis notas" on public.ratings;
create policy "mis notas" on public.ratings for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "leer notas canciones" on public.track_ratings;
create policy "leer notas canciones" on public.track_ratings for select using (true);
drop policy if exists "mis notas canciones" on public.track_ratings;
create policy "mis notas canciones" on public.track_ratings for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "leer reseñas" on public.reviews;
create policy "leer reseñas" on public.reviews for select using (true);
drop policy if exists "mis reseñas" on public.reviews;
create policy "mis reseñas" on public.reviews for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "leer reacciones" on public.review_reactions;
create policy "leer reacciones" on public.review_reactions for select using (true);
drop policy if exists "mis reacciones" on public.review_reactions;
create policy "mis reacciones" on public.review_reactions for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "leer respuestas" on public.replies;
create policy "leer respuestas" on public.replies for select using (true);
drop policy if exists "mis respuestas" on public.replies;
create policy "mis respuestas" on public.replies for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "leer follows" on public.follows;
create policy "leer follows" on public.follows for select using (true);
drop policy if exists "mis follows" on public.follows;
create policy "mis follows" on public.follows for all to authenticated using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

drop policy if exists "denunciar" on public.reports;
create policy "denunciar" on public.reports for insert to authenticated with check (auth.uid() = reporter_id);
