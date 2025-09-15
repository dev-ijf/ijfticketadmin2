-- Verification script for Neon database setup
-- This script verifies that all tables exist and have data

-- Check if all required tables exist
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Get row counts for all tables
SELECT 
    'events' as table_name, 
    COUNT(*) as row_count 
FROM events
UNION ALL
SELECT 
    'customers' as table_name, 
    COUNT(*) as row_count 
FROM customers
UNION ALL
SELECT 
    'orders' as table_name, 
    COUNT(*) as row_count 
FROM orders
UNION ALL
SELECT 
    'tickets' as table_name, 
    COUNT(*) as row_count 
FROM tickets
UNION ALL
SELECT 
    'ticket_types' as table_name, 
    COUNT(*) as row_count 
FROM ticket_types
UNION ALL
SELECT 
    'payment_channels' as table_name, 
    COUNT(*) as row_count 
FROM payment_channels
UNION ALL
SELECT 
    'notification_templates' as table_name, 
    COUNT(*) as row_count 
FROM notification_templates
ORDER BY table_name;

-- Check database connection info
SELECT 
    current_database() as database_name,
    current_user as current_user,
    version() as postgresql_version,
    NOW() as current_timestamp;
