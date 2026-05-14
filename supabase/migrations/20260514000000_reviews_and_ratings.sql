-- 20260514000000_reviews_and_ratings.sql

-- Reviews table
create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  bounty_id uuid references public.bounties(id) not null,
  poster_id uuid references public.profiles(id) not null,
  provider_id uuid references public.profiles(id) not null,
  rating integer check (rating >= 1 and rating <= 5) not null,
  comment text,
  created_at timestamp with time zone default now()
);

-- Index for fast lookup by provider
create index if not exists idx_reviews_provider_id on public.reviews(provider_id);

-- Cache columns on profiles for faster trust computation
alter table public.profiles add column if not exists average_rating numeric(3,2) default 0;
alter table public.profiles add column if not exists rating_count integer default 0;

-- Function to update profile stats on new review
create or replace function public.update_profile_rating_stats()
returns trigger as $$
begin
  update public.profiles
  set 
    average_rating = (
      select coalesce(avg(rating), 0)
      from public.reviews
      where provider_id = new.provider_id
    ),
    rating_count = (
      select count(*)
      from public.reviews
      where provider_id = new.provider_id
    )
  where id = new.provider_id;
  return new;
end;
$$ language plpgsql;

-- Trigger to run after a new review is inserted
create trigger trigger_update_profile_rating
after insert on public.reviews
for each row
execute function public.update_profile_rating_stats();
