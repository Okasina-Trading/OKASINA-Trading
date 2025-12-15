-- Loyalty Redemption Logic & Missing Column Fix
-- 1. Ensure 'user_id' exists on orders (Critical for linking to loyalty)
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'orders' and column_name = 'user_id') then
        alter table orders add column user_id uuid references auth.users(id);
    end if;
end $$;

-- 2. Trigger Function: Redeem Points on Order Create
create or replace function public.handle_loyalty_redemption()
returns trigger as $$
begin
  -- Only run if user_id is present and points are redeemed
  if new.user_id is not null and new.points_redeemed > 0 then
    
    -- Deduct Points
    update loyalty_profiles
    set points_balance = points_balance - new.points_redeemed,
        updated_at = now()
    where id = new.user_id;

    -- Log Transaction
    insert into loyalty_transactions (user_id, amount, transaction_type, description, order_id)
    values (
        new.user_id, 
        -new.points_redeemed, 
        'redeemed_checkout', 
        'Redeemed ' || new.points_redeemed || ' points on Order #' || substring(new.id::text, 1, 8), 
        new.id
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- 3. Trigger Definition
drop trigger if exists on_order_created_redeem_points on orders;
create trigger on_order_created_redeem_points
  after insert on orders
  for each row execute procedure public.handle_loyalty_redemption();

-- 4. RLS Policy for Inserting Orders (if not exists)
drop policy if exists "Users can insert their own orders" on orders;
create policy "Users can insert their own orders" on orders for insert with check (auth.uid() = user_id);

-- Ensure orders table has RLS enabled
alter table orders enable row level security;
