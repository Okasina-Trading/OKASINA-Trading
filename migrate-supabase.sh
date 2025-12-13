#!/bin/bash
# OKASINA - Automated Supabase Data Migration
# This script copies ALL data from old to new Supabase

# Old Supabase
OLD_DB="postgresql://postgres.drnqpbyptyyuacmrvdrr:[YOUR_OLD_DB_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

# New Supabase  
NEW_DB="postgresql://postgres.hthkrbtwfymaxtnvshfz:[YOUR_NEW_DB_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

echo "🔄 Starting data migration..."

# Export data from old database
echo "📤 Exporting from old database..."
pg_dump --data-only --no-owner --no-privileges "$OLD_DB" > okasina_data_backup.sql

# Import to new database
echo "📥 Importing to new database..."
psql "$NEW_DB" < okasina_data_backup.sql

echo "✅ Migration complete!"
echo "📊 Verifying data..."
psql "$NEW_DB" -c "SELECT table_name, (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns FROM information_schema.tables t WHERE table_schema = 'public' ORDER BY table_name;"
