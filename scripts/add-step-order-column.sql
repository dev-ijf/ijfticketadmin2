-- Add step_order column to payment_instructions table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_instructions' 
        AND column_name = 'step_order'
    ) THEN
        ALTER TABLE payment_instructions ADD COLUMN step_order INTEGER DEFAULT 1;
        
        -- Update existing records with sequential step_order
        WITH numbered_instructions AS (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY payment_channel_id ORDER BY created_at) as rn
            FROM payment_instructions
        )
        UPDATE payment_instructions 
        SET step_order = numbered_instructions.rn
        FROM numbered_instructions
        WHERE payment_instructions.id = numbered_instructions.id;
        
        -- Make step_order NOT NULL after updating existing records
        ALTER TABLE payment_instructions ALTER COLUMN step_order SET NOT NULL;
        
        -- Add index for better performance
        CREATE INDEX IF NOT EXISTS idx_payment_instructions_step_order 
        ON payment_instructions(payment_channel_id, step_order);
    END IF;
END $$;
