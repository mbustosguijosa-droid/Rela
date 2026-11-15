-- Rela · actualización 004: mensajes privados entre perfiles y bloqueos
-- Cómo usarlo: Supabase → SQL Editor → New query → pega este archivo → Run. Se puede ejecutar varias veces.

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  check (sender_id <> recipient_id)
);
create index if not exists messages_recipient_idx on public.messages (recipient_id, created_at desc);
create index if not exists messages_sender_idx on public.messages (sender_id, created_at desc);

-- Bloqueos: si alguien te bloquea, no puedes escribirle
create table if not exists public.blocks (
  user_id uuid references public.profiles(id) on delete cascade,
  blocked_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, blocked_id)
);

-- Comprueba si "a" ha bloqueado a "b" (se ejecuta con permisos propios porque
-- quien escribe no puede leer los bloqueos de otra persona)
create or replace function public.is_blocked(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.blocks where user_id = a and blocked_id = b)
$$;
revoke all on function public.is_blocked(uuid, uuid) from public;
grant execute on function public.is_blocked(uuid, uuid) to authenticated;

alter table public.messages enable row level security;
alter table public.blocks enable row level security;

-- Solo quien envía y quien recibe pueden leer un mensaje
drop policy if exists "leer mis mensajes" on public.messages;
create policy "leer mis mensajes" on public.messages for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = recipient_id);
-- Solo puedes enviar en tu nombre y a alguien que no te haya bloqueado
drop policy if exists "enviar mensajes" on public.messages;
create policy "enviar mensajes" on public.messages for insert to authenticated
  with check (
    auth.uid() = sender_id
    and not public.is_blocked(recipient_id, auth.uid())
  );
-- Quien recibe solo puede marcarlo como leído
drop policy if exists "marcar leido" on public.messages;
create policy "marcar leido" on public.messages for update to authenticated
  using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id);
revoke update on public.messages from authenticated;
grant update (read_at) on public.messages to authenticated;
-- Quien envía puede borrar su mensaje
drop policy if exists "borrar mis mensajes" on public.messages;
create policy "borrar mis mensajes" on public.messages for delete to authenticated
  using (auth.uid() = sender_id);

drop policy if exists "mis bloqueos" on public.blocks;
create policy "mis bloqueos" on public.blocks for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Mensajes en tiempo real
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; when undefined_object then null;
end $$;

-- Permitir denunciar conversaciones
alter table public.reports drop constraint if exists reports_target_type_check;
alter table public.reports add constraint reports_target_type_check check (target_type in ('review','reply','profile','conversation'));
