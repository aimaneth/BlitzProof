-- Migration: Update token_source_code constraint to allow more source types
-- This fixes the constraint error when trying to insert github, etherscan, etc.

-- Drop the existing constraint
ALTER TABLE token_source_code DROP CONSTRAINT IF EXISTS token_source_code_source_type_check;

-- Add new constraint with expanded source types
ALTER TABLE token_source_code ADD CONSTRAINT token_source_code_source_type_check 
CHECK (source_type IN (
  'contract_code', 
  'github_repo', 
  'github',
  'gitlab',
  'etherscan',
  'documentation', 
  'whitepaper', 
  'audit_report',
  'bscscan',
  'polygonscan',
  'arbiscan',
  'optimistic_etherscan',
  'basescan'
));
