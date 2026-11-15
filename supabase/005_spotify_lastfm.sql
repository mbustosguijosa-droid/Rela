-- Rela · 005: conectar Spotify / Last.fm, lo que escuchas y "escuchando ahora".
-- Se puede ejecutar varias veces sin problema.

-- Qué cuentas de música tiene conectadas cada persona (visible para todos; no guarda claves).
create table if not exists public.music_links (
  user_id uuid primary key references auth.users on delete cascade,
  spotify_id text,
  spotify_name text,
  lastfm_user text,
  share_listening boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.music_links enable row level security;
drop policy if exists "music_links leer" on public.music_links;
create policy "music_links leer" on public.music_links for select using (true);
drop policy if exists "music_links propio" on public.music_links;
create policy "music_links propio" on public.music_links for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Claves de Spotify: solo las puede leer su dueño (y el servidor con la clave secreta).
create table if not exists public.spotify_tokens (
  user_id uuid primary key references auth.users on delete cascade,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  scope text
);
alter table public.spotify_tokens enable row level security;
drop policy if exists "spotify_tokens propio" on public.spotify_tokens;
create policy "spotify_tokens propio" on public.spotify_tokens for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ¿Se puede ver lo que escucha esta persona? (es tuya, o tiene activado "mostrar lo que escucho")
create or replace function public.can_see_listening(owner uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select owner = auth.uid() or coalesce((select share_listening from public.music_links where user_id = owner), true);
$$;

-- Lo último que ha sonado (canción actual) de cada persona.
create table if not exists public.now_playing (
  user_id uuid primary key references auth.users on delete cascade,
  source text not null,
  track text, artist text, album text, cover text, url text,
  is_playing boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.now_playing enable row level security;
drop policy if exists "now_playing leer" on public.now_playing;
create policy "now_playing leer" on public.now_playing for select using (public.can_see_listening(user_id));
drop policy if exists "now_playing propio" on public.now_playing;
create policy "now_playing propio" on public.now_playing for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Foto de tu música: últimas escuchas, temas y artistas top y playlists.
create table if not exists public.music_snapshots (
  user_id uuid primary key references auth.users on delete cascade,
  source text not null,
  recent jsonb not null default '[]',
  top_tracks jsonb not null default '[]',
  top_artists jsonb not null default '[]',
  playlists jsonb not null default '[]',
  updated_at timestamptz not null default now()
);
alter table public.music_snapshots enable row level security;
drop policy if exists "music_snapshots leer" on public.music_snapshots;
create policy "music_snapshots leer" on public.music_snapshots for select using (public.can_see_listening(user_id));
drop policy if exists "music_snapshots propio" on public.music_snapshots;
create policy "music_snapshots propio" on public.music_snapshots for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
