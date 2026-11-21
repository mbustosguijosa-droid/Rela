-- Rela Music · avisos (notificaciones) y moderación
-- Cómo usarlo: Supabase → SQL Editor → pega este archivo → Run. Se puede ejecutar más de una vez.

/* ============================== AVISOS ============================== */
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,   -- quien recibe el aviso
  actor_id uuid references public.profiles(id) on delete cascade,           -- quien lo provoca
  kind text not null check (kind in ('like','react','reply','follow','fav_rated')),
  release_id bigint,
  review_id uuid,
  detail text,                                                               -- tipo de reacción o nota
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;
drop policy if exists "mis avisos" on public.notifications;
create policy "mis avisos" on public.notifications for select to authenticated using (auth.uid() = user_id);
drop policy if exists "leer mis avisos" on public.notifications;
create policy "leer mis avisos" on public.notifications for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "borrar mis avisos" on public.notifications;
create policy "borrar mis avisos" on public.notifications for delete to authenticated using (auth.uid() = user_id);
-- Nadie inserta a mano: los avisos los crean los disparadores de abajo.

-- Crea un aviso si no es para uno mismo, no hay bloqueo y no se ha repetido en el último día
create or replace function public.notify(p_user uuid, p_actor uuid, p_kind text, p_release bigint, p_review uuid, p_detail text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_user is null or p_user = p_actor then return; end if;
  if public.is_blocked(p_user, p_actor) then return; end if;
  if exists (select 1 from notifications n where n.user_id = p_user and n.actor_id = p_actor and n.kind = p_kind
             and n.release_id is not distinct from p_release and n.review_id is not distinct from p_review
             and n.created_at > now() - interval '1 day') then return; end if;
  insert into notifications (user_id, actor_id, kind, release_id, review_id, detail) values (p_user, p_actor, p_kind, p_release, p_review, p_detail);
end $$;

create or replace function public.on_reaction() returns trigger language plpgsql security definer set search_path = public as $$
declare rv record;
begin
  select user_id, release_id into rv from reviews where id = new.review_id;
  perform public.notify(rv.user_id, new.user_id, case when new.kind = 'like' then 'like' else 'react' end, rv.release_id, new.review_id, new.kind);
  return new;
end $$;
drop trigger if exists notify_reaction on public.review_reactions;
create trigger notify_reaction after insert on public.review_reactions for each row execute function public.on_reaction();

create or replace function public.on_reply() returns trigger language plpgsql security definer set search_path = public as $$
declare rv record;
begin
  select user_id, release_id into rv from reviews where id = new.review_id;
  perform public.notify(rv.user_id, new.user_id, 'reply', rv.release_id, new.review_id, left(new.body, 140));
  return new;
end $$;
drop trigger if exists notify_reply on public.replies;
create trigger notify_reply after insert on public.replies for each row execute function public.on_reply();

create or replace function public.on_follow() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.notify(new.followee_id, new.follower_id, 'follow', null, null, null);
  return new;
end $$;
drop trigger if exists notify_follow on public.follows;
create trigger notify_follow after insert on public.follows for each row execute function public.on_follow();

-- "Tu amigo ha puntuado uno de tus favoritos": avisa a quien sigue a esa persona y tiene el disco en su top 4
create or replace function public.on_rating() returns trigger language plpgsql security definer set search_path = public as $$
declare f record;
begin
  if new.overall is null then return new; end if;
  if tg_op = 'UPDATE' and old.overall is not null then return new; end if;
  for f in select p.id from follows fo join profiles p on p.id = fo.follower_id
           where fo.followee_id = new.user_id and new.release_id = any(p.favorites) loop
    perform public.notify(f.id, new.user_id, 'fav_rated', new.release_id, null, new.overall::text);
  end loop;
  return new;
end $$;
drop trigger if exists notify_rating on public.ratings;
create trigger notify_rating after insert or update of overall on public.ratings for each row execute function public.on_rating();

/* ============================ MODERACIÓN ============================ */
-- Quién modera (se añade a mano desde el SQL Editor; nadie puede hacerse moderador desde la web)
create table if not exists public.admins (user_id uuid primary key references public.profiles(id) on delete cascade);
alter table public.admins enable row level security;
drop policy if exists "ver si soy admin" on public.admins;
create policy "ver si soy admin" on public.admins for select to authenticated using (auth.uid() = user_id);

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

-- Denuncias: también de conversaciones (antes fallaba), con motivo, estado y una sola por persona
alter table public.reports drop constraint if exists reports_target_type_check;
alter table public.reports add constraint reports_target_type_check check (target_type in ('review','reply','profile','conversation'));
alter table public.reports add column if not exists status text not null default 'open';
alter table public.reports drop constraint if exists reports_status_check;
alter table public.reports add constraint reports_status_check check (status in ('open','hidden','dismissed'));
delete from public.reports a using public.reports b
  where a.ctid < b.ctid and a.reporter_id = b.reporter_id and a.target_type = b.target_type and a.target_id = b.target_id;
create unique index if not exists reports_once on public.reports (reporter_id, target_type, target_id);
drop policy if exists "moderar denuncias" on public.reports;
create policy "moderar denuncias" on public.reports for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Contenido oculto: lo sigue viendo su autor y quien modera
alter table public.reviews add column if not exists hidden boolean not null default false;
alter table public.replies add column if not exists hidden boolean not null default false;

drop policy if exists "leer reseñas" on public.reviews;
create policy "leer reseñas" on public.reviews for select using (not hidden or auth.uid() = user_id or public.is_admin());
drop policy if exists "moderar reseñas" on public.reviews;
create policy "moderar reseñas" on public.reviews for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "leer respuestas" on public.replies;
create policy "leer respuestas" on public.replies for select using (not hidden or auth.uid() = user_id or public.is_admin());
drop policy if exists "moderar respuestas" on public.replies;
create policy "moderar respuestas" on public.replies for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Que nadie se des-oculte a sí mismo editando su reseña
create or replace function public.keep_hidden() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.hidden is distinct from old.hidden and not public.is_admin() then new.hidden := old.hidden; end if;
  return new;
end $$;
drop trigger if exists keep_hidden_reviews on public.reviews;
create trigger keep_hidden_reviews before update on public.reviews for each row execute function public.keep_hidden();
drop trigger if exists keep_hidden_replies on public.replies;
create trigger keep_hidden_replies before update on public.replies for each row execute function public.keep_hidden();

-- Con 3 denuncias de personas distintas, la reseña o respuesta se oculta sola hasta que alguien la revise
create or replace function public.on_report() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(distinct reporter_id) from reports where target_type = new.target_type and target_id = new.target_id and status = 'open') >= 3 then
    if new.target_type = 'review' then update reviews set hidden = true where id::text = new.target_id;
    elsif new.target_type = 'reply' then update replies set hidden = true where id::text = new.target_id; end if;
  end if;
  return new;
end $$;
drop trigger if exists auto_hide on public.reports;
create trigger auto_hide after insert on public.reports for each row execute function public.on_report();

-- Límite anti-spam: no más de N publicaciones por minuto
create or replace function public.rate_limit() returns trigger language plpgsql security definer set search_path = public as $$
declare n int; lim int;
begin
  if tg_table_name = 'reviews' then select count(*) into n from reviews where user_id = new.user_id and created_at > now() - interval '1 minute'; lim := 4;
  elsif tg_table_name = 'replies' then select count(*) into n from replies where user_id = new.user_id and created_at > now() - interval '1 minute'; lim := 6;
  else select count(*) into n from messages where sender_id = new.sender_id and created_at > now() - interval '1 minute'; lim := 25; end if;
  if n >= lim then raise exception 'rate_limit' using errcode = 'P0001'; end if;
  return new;
end $$;
drop trigger if exists limit_reviews on public.reviews;
create trigger limit_reviews before insert on public.reviews for each row execute function public.rate_limit();
drop trigger if exists limit_replies on public.replies;
create trigger limit_replies before insert on public.replies for each row execute function public.rate_limit();
drop trigger if exists limit_messages on public.messages;
create trigger limit_messages before insert on public.messages for each row execute function public.rate_limit();

-- El ranking de reseñas deja fuera lo oculto
drop view if exists public.review_ranking;
create view public.review_ranking as
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
left join (select review_id, count(*) as n from public.replies where not hidden group by review_id) p on p.review_id = r.id
where not r.hidden;
grant select on public.review_ranking to anon, authenticated;
