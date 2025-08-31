-- Migration: Remove website from allowed social platforms
-- Website is now handled as a separate field in the tokens table

-- First, remove any existing website entries from token_socials
DELETE FROM token_socials WHERE platform = 'website';

-- Update the CHECK constraint to remove website
ALTER TABLE token_socials DROP CONSTRAINT IF EXISTS token_socials_platform_check;

ALTER TABLE token_socials ADD CONSTRAINT token_socials_platform_check 
CHECK (platform IN ('twitter', 'telegram', 'discord', 'github', 'linkedin', 'medium', 'reddit', 'youtube', 'whitepaper', 'gitlab', 'etherscan'));

-- Add comment to document the change
COMMENT ON COLUMN token_socials.platform IS 'Social media platform or document type. Allowed values: twitter, telegram, discord, github, linkedin, medium, reddit, youtube, whitepaper, gitlab, etherscan';
