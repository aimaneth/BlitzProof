-- Migration: Add token_contracts table for multiple contract addresses per token
-- This replaces the single contract_address field in tokens table

-- Create token_contracts table
CREATE TABLE IF NOT EXISTS token_contracts (
  id SERIAL PRIMARY KEY,
  token_id INTEGER NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  network VARCHAR(50) NOT NULL,
  contract_address VARCHAR(255) NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(token_id, network, contract_address)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_token_contracts_token_id ON token_contracts(token_id);
CREATE INDEX IF NOT EXISTS idx_token_contracts_network ON token_contracts(network);
CREATE INDEX IF NOT EXISTS idx_token_contracts_contract_address ON token_contracts(contract_address);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_token_contracts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_token_contracts_updated_at
  BEFORE UPDATE ON token_contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_token_contracts_updated_at();

-- Migrate existing contract addresses to the new table
INSERT INTO token_contracts (token_id, network, contract_address, is_verified, is_active)
SELECT 
  id as token_id,
  network,
  contract_address,
  FALSE as is_verified,
  is_active
FROM tokens 
WHERE contract_address IS NOT NULL AND contract_address != '';

-- Note: We'll keep the contract_address field in tokens table for backward compatibility
-- but it will be deprecated in future versions
