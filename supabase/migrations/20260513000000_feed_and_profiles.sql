-- Run in Supabase SQL editor (or via CLI) if not already applied.

-- Payout fields on profiles (used by transfer API)
alter table public.profiles add column if not exists account_number text;
alter table public.profiles add column if not exists bank_code text;

-- PostGIS-style nearby feed (cube + earthdistance)
create extension if not exists cube;
create extension if not exists earthdistance;

create or replace function public.nearby_open_bounties(p_lat double precision, p_lng double precision)
returns setof public.bounties
language sql
stable
as $$
  select b.*
  from public.bounties b
  where b.status = 'open'
    and earth_distance(
      ll_to_earth(b.latitude::double precision, b.longitude::double precision),
      ll_to_earth(p_lat, p_lng)
    ) < (coalesce(b.radius_km, 1)::double precision * 1000)
  order by b.created_at desc;
$$;
