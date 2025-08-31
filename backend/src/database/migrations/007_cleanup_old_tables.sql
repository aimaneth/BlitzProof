-- Migration: Cleanup old unused tables
-- Remove manual_tokens and cached_token_data tables as they're replaced by the new structure

-- Drop old tables and their dependencies
-- Note: This will permanently delete data from these tables

-- 1. Drop cached_token_data table (replaced by token_price_history and token_dex_pairs)
DROP TABLE IF EXISTS cached_token_data CASCADE;

-- 2. Drop manual_tokens table (replaced by tokens table)
DROP TABLE IF EXISTS manual_tokens CASCADE;

-- 3. Drop any related triggers that might exist
DROP TRIGGER IF EXISTS update_manual_tokens_updated_at ON manual_tokens;
DROP TRIGGER IF EXISTS update_cached_token_data_updated_at ON cached_token_data;

-- 4. Drop any related indexes that might exist
DROP INDEX IF EXISTS idx_manual_tokens_coin_gecko_id;
DROP INDEX IF EXISTS idx_manual_tokens_is_active;
DROP INDEX IF EXISTS idx_manual_tokens_priority;
DROP INDEX IF EXISTS idx_manual_tokens_category;
DROP INDEX IF EXISTS idx_manual_tokens_network;

DROP INDEX IF EXISTS idx_cached_token_data_token_id;
DROP INDEX IF EXISTS idx_cached_token_data_coin_gecko_id;
DROP INDEX IF EXISTS idx_cached_token_data_last_update;
DROP INDEX IF EXISTS idx_cached_token_data_refreshing;
DROP INDEX IF EXISTS idx_cached_token_data_price_update;

-- 5. Clean up any orphaned data or references
-- (This is handled by CASCADE in the DROP TABLE statements above)

-- 6. Verify cleanup by checking remaining tables
-- The following tables should remain:
-- - tokens (main table)
-- - token_logos (for uploaded logos)
-- - token_socials (new)
-- - token_audits (new)
-- - token_security_scores (new)
-- - token_dex_pairs (new)
-- - tags (new)
-- - token_tags (new)
-- - token_price_history (new)

-- Add comment to document the cleanup
COMMENT ON SCHEMA public IS 'Database cleaned up - old manual_tokens and cached_token_data tables removed. New relational structure implemented.';
