-- =====================================================================
-- Helios İç Portal — Login RPC
-- =====================================================================
-- Yüz grid'inde göstermek için public.users listesini anonim kullanıcılara
-- açar (sadece güvenli kolonlar). RLS'i bypass etmek için security definer.
-- Şifre / token / hassas veri dönmez.
-- =====================================================================

create or replace function public.get_login_users()
returns table (
  id          uuid,
  legacy_id   text,
  name        text,
  initials    text,
  role        text,
  color       text,
  user_role   user_role,
  email       text
)
language sql
security definer
set search_path = public
stable
as $$
  select id, legacy_id, name, initials, role, color, user_role, email
  from public.users
  order by name;
$$;

grant execute on function public.get_login_users() to anon, authenticated;
