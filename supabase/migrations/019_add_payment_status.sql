-- Add Payment Status and Reference columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_ref text;

-- Add check constraint for valid payment statuses
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE orders 
ADD CONSTRAINT orders_payment_status_check 
CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));

-- Force default for existing rows if needed
UPDATE orders SET payment_status = 'pending' WHERE payment_status IS NULL;
