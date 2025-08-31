-- Migration: Update token_socials platform constraint to include new platforms
-- This adds support for website, whitepaper, and audit platforms

-- First, drop the existing constraint
ALTER TABLE token_socials DROP CONSTRAINT IF EXISTS token_socials_platform_check;

-- Add the new constraint with all supported platforms
ALTER TABLE token_socials ADD CONSTRAINT token_socials_platform_check 
CHECK (platform IN (
  'twitter', 'telegram', 'discord', 'reddit', 'linkedin', 
  'website', 'whitepaper', 
  'github', 'gitlab', 'etherscan',
  'certik', 'hacken', 'slowmist', 'quantstamp'
));

-- Update existing records if needed (optional)
-- This ensures any existing data is compatible with the new constraint
