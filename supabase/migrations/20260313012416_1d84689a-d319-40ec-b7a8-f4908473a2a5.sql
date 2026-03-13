-- Create storage buckets
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
insert into storage.buckets (id, name, public) values ('covers', 'covers', true);

-- Allow public read access on avatars
create policy "Public read avatars" on storage.objects for select using (bucket_id = 'avatars');
-- Allow public read access on covers  
create policy "Public read covers" on storage.objects for select using (bucket_id = 'covers');

-- Create victories table
create table public.victories (
  id uuid primary key default gen_random_uuid(),
  game_id text not null,
  winner text not null,
  date date not null default current_date,
  created_at timestamptz default now()
);

alter table public.victories enable row level security;
create policy "Allow public read" on public.victories for select using (true);
create policy "Allow public insert" on public.victories for insert with check (true);
create policy "Allow public update" on public.victories for update using (true) with check (true);
create policy "Allow public delete" on public.victories for delete using (true);