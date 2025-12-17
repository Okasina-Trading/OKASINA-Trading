-- STEP 1: Run this in OLD Supabase (drnqpbyptyyuacmrvdrr) SQL Editor
-- This generates SQL INSERT statements for ALL your data

-- First, get list of all tables
SELECT 
    'SELECT * FROM ' || table_name || ';' as export_query
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Copy the output and run each SELECT query
-- Then copy the results to import into new database

-- OR use this automated approach:
-- Generate INSERT statements for each table

DO $$
DECLARE
    r RECORD;
    table_name TEXT;
                                                                                                                                                  BEGIN
    FOR r IN 
        SELECT t.table_name
        FROM information_schema.tables t
        WHERE t.table_schema = 'public' 
          AND t.table_type = 'BASE TABLE'
        ORDER BY t.table_name
    LOOP
        table_name := r.table_name;
        
        -- Generate COPY command for each table
        RAISE NOTICE 'COPY % TO STDOUT;', table_name;
    END LOOP;
END $$;
