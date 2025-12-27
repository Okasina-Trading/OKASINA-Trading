-- =================================================================
-- AUTOMATIC STOCK MANAGEMENT
-- =================================================================
-- Logic:
-- 1. New Order (Pending) -> Deduct Stock (Reserve it)
-- 2. Order Cancelled -> Restore Stock (Release it)
-- 3. Order Confirmed/Shipped -> No Change (Already deducted)
-- =================================================================

-- 1. Create the Function
CREATE OR REPLACE FUNCTION public.manage_inventory()
RETURNS TRIGGER AS $$
DECLARE
    item jsonb;
    item_qty int;
    product_id uuid;
BEGIN
    -- CASE 1: NEW ORDER (Deduct Stock)
    IF (TG_OP = 'INSERT') THEN
        FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
        LOOP
            product_id := (item->>'id')::uuid;
            item_qty := (item->>'quantity')::int;
            
            UPDATE public.products 
            SET stock_qty = stock_qty - item_qty
            WHERE id = product_id;
        END LOOP;
        RETURN NEW;
    END IF;

    -- CASE 2: STATUS CHANGE
    IF (TG_OP = 'UPDATE') THEN
        -- If cancelling: RESTORE STOCK
        IF (NEW.status = 'cancelled' AND OLD.status != 'cancelled') THEN
            FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
            LOOP
                product_id := (item->>'id')::uuid;
                item_qty := (item->>'quantity')::int;
                
                UPDATE public.products 
                SET stock_qty = stock_qty + item_qty
                WHERE id = product_id;
            END LOOP;
        END IF;

        -- If un-cancelling (e.g. mistake): DEDUCT AGAIN
        IF (OLD.status = 'cancelled' AND NEW.status != 'cancelled') THEN
             FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
            LOOP
                product_id := (item->>'id')::uuid;
                item_qty := (item->>'quantity')::int;
                
                UPDATE public.products 
                SET stock_qty = stock_qty - item_qty
                WHERE id = product_id;
            END LOOP;
        END IF;
        
        RETURN NEW;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the Trigger
DROP TRIGGER IF EXISTS on_order_change ON public.orders;

CREATE TRIGGER on_order_change
AFTER INSERT OR UPDATE OF status
ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.manage_inventory();

-- 3. Reload Config
NOTIFY pgrst, 'reload config';
