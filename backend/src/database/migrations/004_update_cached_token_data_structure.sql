-- Migration: Update cached_token_data table structure
-- Remove static data columns (name, symbol, network, address, contract_type)
-- Keep only price/real-time data that changes frequently

-- Drop existing columns that contain static data
ALTER TABLE cached_token_data 
DROP COLUMN IF EXISTS name,
DROP COLUMN IF EXISTS symbol,
DROP COLUMN IF EXISTS network,
DROP COLUMN IF EXISTS address,
DROP COLUMN IF EXISTS contract_type;

-- Add comment to clarify the table's purpose
COMMENT ON TABLE cached_token_data IS 'Stores only price/real-time data for tokens. Static data (name, symbol, network, etc.) comes from manual_tokens table.';

-- Update existing data to remove any static information
-- This ensures the table only contains price/real-time data
UPDATE cached_token_data SET 
    name = NULL,
    symbol = NULL,
    network = NULL,
    address = NULL,
    contract_type = NULL
WHERE name IS NOT NULL OR symbol IS NOT NULL OR network IS NOT NULL OR address IS NOT NULL OR contract_type IS NOT NULL;

-- Create index for efficient price data queries
CREATE INDEX IF NOT EXISTS idx_cached_token_data_price_update ON cached_token_data(last_api_update DESC);
CREATE INDEX IF NOT EXISTS idx_cached_token_data_coin_gecko_id ON cached_token_data(coin_gecko_id);

-- Add constraint to ensure coin_gecko_id is not null
ALTER TABLE cached_token_data ALTER COLUMN coin_gecko_id SET NOT NULL;

-- Add comment to coin_gecko_id column
COMMENT ON COLUMN cached_token_data.coin_gecko_id IS 'References manual_tokens.coin_gecko_id for static data lookup';
