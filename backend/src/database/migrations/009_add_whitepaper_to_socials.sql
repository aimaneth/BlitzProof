-- Migration: Add source code platforms to allowed social platforms
-- This adds support for source code links in the social media section

-- Update the CHECK constraint to include source code platforms
ALTER TABLE token_socials DROP CONSTRAINT IF EXISTS token_socials_platform_check;

ALTER TABLE token_socials ADD CONSTRAINT token_socials_platform_check 
CHECK (platform IN ('twitter', 'telegram', 'discord', 'github', 'linkedin', 'medium', 'website', 'reddit', 'youtube', 'whitepaper', 'gitlab', 'etherscan'));

-- Add comment to document the change
COMMENT ON COLUMN token_socials.platform IS 'Social media platform or document type. Allowed values: twitter, telegram, discord, github, linkedin, medium, website, reddit, youtube, whitepaper, gitlab, etherscan';
