-- Migration: Add real-time price fields to tokens table
-- This adds fields for storing current price data from APIs

-- Add price-related fields to tokens table
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS current_price DECIMAL(20,8) DEFAULT 0;
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS price_change_24h DECIMAL(10,2) DEFAULT 0;
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS market_cap DECIMAL(20,2) DEFAULT 0;
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS volume_24h DECIMAL(20,2) DEFAULT 0;
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS pairs_count INTEGER DEFAULT 0;
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS total_liquidity DECIMAL(20,2) DEFAULT 0;
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS price_source VARCHAR(20) DEFAULT 'none';
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS price_reliability INTEGER DEFAULT 0;
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS last_price_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tokens_current_price ON tokens(current_price DESC);
CREATE INDEX IF NOT EXISTS idx_tokens_price_change_24h ON tokens(price_change_24h DESC);
CREATE INDEX IF NOT EXISTS idx_tokens_market_cap ON tokens(market_cap DESC);
CREATE INDEX IF NOT EXISTS idx_tokens_volume_24h ON tokens(volume_24h DESC);
CREATE INDEX IF NOT EXISTS idx_tokens_last_price_update ON tokens(last_price_update DESC);

-- Add comments for documentation
COMMENT ON COLUMN tokens.current_price IS 'Current token price in USD';
COMMENT ON COLUMN tokens.price_change_24h IS '24-hour price change percentage';
COMMENT ON COLUMN tokens.market_cap IS 'Market capitalization in USD';
COMMENT ON COLUMN tokens.volume_24h IS '24-hour trading volume in USD';
COMMENT ON COLUMN tokens.pairs_count IS 'Number of DEX pairs for this token';
COMMENT ON COLUMN tokens.total_liquidity IS 'Total liquidity across all DEX pairs in USD';
COMMENT ON COLUMN tokens.price_source IS 'Source of price data: coingecko, dexscreener, combined, none';
COMMENT ON COLUMN tokens.price_reliability IS 'Reliability score of price data (0-100)';
COMMENT ON COLUMN tokens.last_price_update IS 'Timestamp of last price update';
