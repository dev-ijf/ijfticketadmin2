-- Migration script to update payment channel relations
-- This script will update the database structure to use payment_channel_id instead of payment_channel_code

-- Step 1: Add new payment_channel_id column to orders table
ALTER TABLE orders 
ADD COLUMN payment_channel_id INTEGER;

-- Step 2: Add foreign key constraint for orders.payment_channel_id
ALTER TABLE orders 
ADD CONSTRAINT fk_orders_payment_channel 
FOREIGN KEY (payment_channel_id) REFERENCES payment_channels(id);

-- Step 3: Update existing orders to use payment_channel_id
UPDATE orders 
SET payment_channel_id = pc.id
FROM payment_channels pc 
WHERE orders.payment_channel_code = pc.pg_code;

-- Step 4: Add new payment_channel_id column to payment_instructions table
ALTER TABLE payment_instructions 
ADD COLUMN payment_channel_id INTEGER;

-- Step 5: Add foreign key constraint for payment_instructions.payment_channel_id
ALTER TABLE payment_instructions 
ADD CONSTRAINT fk_payment_instructions_payment_channel 
FOREIGN KEY (payment_channel_id) REFERENCES payment_channels(id);

-- Step 6: Update existing payment_instructions to use payment_channel_id
UPDATE payment_instructions 
SET payment_channel_id = pc.id
FROM payment_channels pc 
WHERE payment_instructions.payment_channel_code = pc.pg_code;

-- Step 7: Make payment_channel_id NOT NULL after data migration
ALTER TABLE orders 
ALTER COLUMN payment_channel_id SET NOT NULL;

ALTER TABLE payment_instructions 
ALTER COLUMN payment_channel_id SET NOT NULL;

-- Step 8: Drop old columns (uncomment after verifying data migration)
-- ALTER TABLE orders DROP COLUMN payment_channel_code;
-- ALTER TABLE payment_instructions DROP COLUMN payment_channel_code;

-- Step 9: Add indexes for better performance
CREATE INDEX idx_orders_payment_channel_id ON orders(payment_channel_id);
CREATE INDEX idx_payment_instructions_payment_channel_id ON payment_instructions(payment_channel_id);

-- Step 10: Update RLS policies if needed
-- Drop existing policies that reference old columns
DROP POLICY IF EXISTS "payment_instructions_select_policy" ON payment_instructions;
DROP POLICY IF EXISTS "payment_instructions_insert_policy" ON payment_instructions;
DROP POLICY IF EXISTS "payment_instructions_update_policy" ON payment_instructions;
DROP POLICY IF EXISTS "payment_instructions_delete_policy" ON payment_instructions;

-- Create new RLS policies
CREATE POLICY "payment_instructions_select_policy" ON payment_instructions
    FOR SELECT USING (true);

CREATE POLICY "payment_instructions_insert_policy" ON payment_instructions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "payment_instructions_update_policy" ON payment_instructions
    FOR UPDATE USING (true);

CREATE POLICY "payment_instructions_delete_policy" ON payment_instructions
    FOR DELETE USING (true);

-- Enable RLS
ALTER TABLE payment_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_channels ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for orders if not exists
CREATE POLICY IF NOT EXISTS "orders_select_policy" ON orders
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "orders_insert_policy" ON orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "orders_update_policy" ON orders
    FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "orders_delete_policy" ON orders
    FOR DELETE USING (true);

-- Create RLS policies for payment_channels if not exists
CREATE POLICY IF NOT EXISTS "payment_channels_select_policy" ON payment_channels
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "payment_channels_insert_policy" ON payment_channels
    FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "payment_channels_update_policy" ON payment_channels
    FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "payment_channels_delete_policy" ON payment_channels
    FOR DELETE USING (true);

-- Verify the migration
SELECT 'Migration completed successfully' as status;

-- Show summary of changes
SELECT 
    'orders' as table_name,
    COUNT(*) as total_rows,
    COUNT(payment_channel_id) as rows_with_new_relation
FROM orders
UNION ALL
SELECT 
    'payment_instructions' as table_name,
    COUNT(*) as total_rows,
    COUNT(payment_channel_id) as rows_with_new_relation
FROM payment_instructions
UNION ALL
SELECT 
    'payment_channels' as table_name,
    COUNT(*) as total_rows,
    COUNT(id) as rows_with_id
FROM payment_channels;
