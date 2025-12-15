-- Enable Loyalty System
-- 1. Create Loyalty Profiles (Holds current balance)
create table if not exists loyalty_profiles (
  id uuid references auth.users not null primary key,
  points_balance integer default 0,
  lifetime_points integer default 0,
  tier text default 'Silver', -- Silver, Gold, Platinum
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Loyalty History (Transaction Log)
create table if not exists loyalty_transactions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users not null,
    amount integer not null, -- Positive for earning, Negative for redeeming
    transaction_type text not null, -- 'earned_order', 'redeemed_checkout', 'bonus_signup', 'admin_adjustment'
    description text,
    order_id uuid references orders(id), -- Optional link to order
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Add Columns to Orders table to track points
alter table orders add column if not exists points_earned integer default 0;
alter table orders add column if not exists points_redeemed integer default 0;
alter table orders add column if not exists discount_amount numeric default 0; -- Track general discounts

-- 4. Enable RLS
alter table loyalty_profiles enable row level security;
alter table loyalty_transactions enable row level security;

-- Policies
create policy "Users can view their own profile" on loyalty_profiles for select using (auth.uid() = id);
create policy "Users can view their own transactions" on loyalty_transactions for select using (auth.uid() = user_id);
-- Admins can view/edit all (Assumes admin check exists or is handled by service role)

-- 5. FUNCTION: Award Points on Order Complete
create or replace function public.handle_order_completion()
returns trigger as $$
begin
  -- Only trigger when status changes to 'completed'
  if new.status = 'completed' and old.status <> 'completed' then
    -- Rule: Earn 1 Point for every Rs 20 spent (5% return roughly)
    -- Calculate points based on total_amount
    declare
        earned_pts integer;
    begin
        earned_pts := floor(new.total_amount / 20);
        
        -- 1. Update Profile
        insert into loyalty_profiles (id, points_balance, lifetime_points)
        values (new.user_id, earned_pts, earned_pts)
        on conflict (id) do update
        set points_balance = loyalty_profiles.points_balance + earned_pts,
            lifetime_points = loyalty_profiles.lifetime_points + earned_pts,
            updated_at = now();

        -- 2. Log Transaction
        insert into loyalty_transactions (user_id, amount, transaction_type, description, order_id)
        values (new.user_id, earned_pts, 'earned_order', 'Points earned from Order #' || substring(new.id::text, 1, 8), new.id);
        
        -- 3. Update Order with Earned Points record
        update orders set points_earned = earned_pts where id = new.id;
    end;
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger
drop trigger if exists on_order_complete_award_points on orders;
create trigger on_order_complete_award_points
  after update on orders
  for each row execute procedure public.handle_order_completion();

-- Seed some points for testing (optional)
-- insert into loyalty_profiles (id, points_balance) values ('USER_UUID', 100);
