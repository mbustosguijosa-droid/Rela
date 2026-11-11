-- Rela · actualización 002: fotos de perfil, notas manuales y ranking de debates
-- Cómo usarlo: Supabase → SQL Editor → New query → pega este archivo → Run.
-- Se puede ejecutar más de una vez sin problema.

-- 1) Saber si la nota final la puso la persona a mano o es la media de las canciones
alter table public.ratings add column if not exists manual boolean not null default false;

-- 2) Guardar la foto de Google al registrarse
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, handle, name, avatar_url)
  values (
    new.id,
    'user_' || substr(replace(new.id::text,'-',''),1,10),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end $$;

-- 3) Carpeta pública para fotos de perfil y cabeceras (cada persona solo escribe en la suya)
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists "subir mis imagenes" on storage.objects;
create policy "subir mis imagenes" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "cambiar mis imagenes" on storage.objects;
create policy "cambiar mis imagenes" on storage.objects for update to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "borrar mis imagenes" on storage.objects;
create policy "borrar mis imagenes" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

-- 4) Ranking de reseñas con puntuación de "debate" (gente a favor y en contra a la vez)
create or replace view public.review_ranking as
select r.*,
  coalesce(x.likes,0) as likes, coalesce(x.fuego,0) as fuego, coalesce(x.acuerdo,0) as acuerdo, coalesce(x.discrepo,0) as discrepo,
  coalesce(p.n,0) as replies_count,
  (coalesce(x.likes,0) + 1.5*(coalesce(x.fuego,0)+coalesce(x.acuerdo,0)+coalesce(x.discrepo,0)) + 4*coalesce(p.n,0)) as engagement,
  (coalesce(x.likes,0) + 1.5*(coalesce(x.fuego,0)+coalesce(x.acuerdo,0)+coalesce(x.discrepo,0)) + 4*coalesce(p.n,0) + 1)
    / power(extract(epoch from (now() - r.created_at))/3600 + 2, 0.8) as hot_score,
  (2*least(coalesce(x.acuerdo,0), coalesce(x.discrepo,0)) + 3*coalesce(p.n,0)) as debate_score
from public.reviews r
left join (
  select review_id,
    count(*) filter (where kind='like') as likes, count(*) filter (where kind='fuego') as fuego,
    count(*) filter (where kind='acuerdo') as acuerdo, count(*) filter (where kind='discrepo') as discrepo
  from public.review_reactions group by review_id
) x on x.review_id = r.id
left join (select review_id, count(*) as n from public.replies group by review_id) p on p.review_id = r.id;

-- 5) Índices para que perfiles y amigos carguen rápido
create index if not exists ratings_user_idx on public.ratings (user_id, updated_at desc);
create index if not exists follows_followee_idx on public.follows (followee_id);
create index if not exists reviews_user_idx on public.reviews (user_id);
