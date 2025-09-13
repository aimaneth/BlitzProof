-- Migration: Add holder count fields to tokens table
-- This adds fields for storing real-time holder count data from blockchain APIs

-- Add holder count related fields to tokens table
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS holder_count INTEGER DEFAULT 0;
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS holder_source VARCHAR(20) DEFAULT 'database';
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS holder_last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tokens_holder_count ON tokens(holder_count DESC);
CREATE INDEX IF NOT EXISTS idx_tokens_holder_last_update ON tokens(holder_last_update DESC);

-- Add comments for documentation
COMMENT ON COLUMN tokens.holder_count IS 'Number of unique token holders';
COMMENT ON COLUMN tokens.holder_source IS 'Source of holder count data: etherscan, coingecko, morails, database, fallback';
COMMENT ON COLUMN tokens.holder_last_update IS 'Last time holder count was updated from blockchain';
