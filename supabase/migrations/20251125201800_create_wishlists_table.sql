-- Create Wishlists Table
create table if not exists public.wishlists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, product_id)
);

-- Enable RLS
alter table public.wishlists enable row level security;

-- Policy: Users can see their own wishlist
create policy "Users can view own wishlist"
  on public.wishlists for select
  using ( auth.uid() = user_id );

-- Policy: Users can insert into their own wishlist
create policy "Users can add to own wishlist"
  on public.wishlists for insert
  with check ( auth.uid() = user_id );

-- Policy: Users can delete from their own wishlist
create policy "Users can remove from own wishlist"
  on public.wishlists for delete
  using ( auth.uid() = user_id );

