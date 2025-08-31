-- Migration: Add explorer, wallet, and source code tables for SecuritySidebar
-- This adds support for the new sections: Explorers, Wallets, and Source Code

-- 1. Create token_explorers table for blockchain explorer links
CREATE TABLE IF NOT EXISTS token_explorers (
  id SERIAL PRIMARY KEY,
  token_id INTEGER REFERENCES tokens(id) ON DELETE CASCADE,
  explorer_name VARCHAR(50) NOT NULL CHECK (explorer_name IN ('Etherscan', 'BscScan', 'PolygonScan', 'Arbiscan', 'OptimisticEtherscan', 'Basescan', 'Snowtrace', 'FtmScan')),
  explorer_url VARCHAR(500) NOT NULL,
  network VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(token_id, explorer_name, network)
);

-- 2. Create token_wallets table for wallet support links
CREATE TABLE IF NOT EXISTS token_wallets (
  id SERIAL PRIMARY KEY,
  token_id INTEGER REFERENCES tokens(id) ON DELETE CASCADE,
  wallet_name VARCHAR(50) NOT NULL CHECK (wallet_name IN ('MetaMask', 'Trust Wallet', 'WalletConnect', 'Coinbase Wallet', 'Phantom', 'Rainbow', 'Argent', 'Gnosis Safe')),
  wallet_url VARCHAR(500) NOT NULL,
  wallet_type VARCHAR(20) NOT NULL CHECK (wallet_type IN ('browser', 'mobile', 'hardware', 'multisig')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(token_id, wallet_name)
);

-- 3. Create token_source_code table for source code links
CREATE TABLE IF NOT EXISTS token_source_code (
  id SERIAL PRIMARY KEY,
  token_id INTEGER REFERENCES tokens(id) ON DELETE CASCADE,
  source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('contract_code', 'github_repo', 'documentation', 'whitepaper', 'audit_report')),
  source_name VARCHAR(100) NOT NULL,
  source_url VARCHAR(500) NOT NULL,
  network VARCHAR(50),
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(token_id, source_type, network)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_token_explorers_token_id ON token_explorers(token_id);
CREATE INDEX IF NOT EXISTS idx_token_explorers_network ON token_explorers(network);
CREATE INDEX IF NOT EXISTS idx_token_explorers_active ON token_explorers(is_active);

CREATE INDEX IF NOT EXISTS idx_token_wallets_token_id ON token_wallets(token_id);
CREATE INDEX IF NOT EXISTS idx_token_wallets_type ON token_wallets(wallet_type);
CREATE INDEX IF NOT EXISTS idx_token_wallets_active ON token_wallets(is_active);

CREATE INDEX IF NOT EXISTS idx_token_source_code_token_id ON token_source_code(token_id);
CREATE INDEX IF NOT EXISTS idx_token_source_code_type ON token_source_code(source_type);
CREATE INDEX IF NOT EXISTS idx_token_source_code_active ON token_source_code(is_active);

-- Create updated_at triggers for all new tables
CREATE OR REPLACE FUNCTION update_token_explorers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_token_explorers_updated_at
  BEFORE UPDATE ON token_explorers
  FOR EACH ROW
  EXECUTE FUNCTION update_token_explorers_updated_at();

CREATE OR REPLACE FUNCTION update_token_wallets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_token_wallets_updated_at
  BEFORE UPDATE ON token_wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_token_wallets_updated_at();

CREATE OR REPLACE FUNCTION update_token_source_code_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_token_source_code_updated_at
  BEFORE UPDATE ON token_source_code
  FOR EACH ROW
  EXECUTE FUNCTION update_token_source_code_updated_at();

-- Insert default explorer links for existing tokens
INSERT INTO token_explorers (token_id, explorer_name, explorer_url, network, is_active)
SELECT 
  t.id as token_id,
  'Etherscan' as explorer_name,
  CASE 
    WHEN tc.contract_address IS NOT NULL AND tc.contract_address != '' 
    THEN 'https://etherscan.io/token/' || tc.contract_address
    ELSE 'https://etherscan.io'
  END as explorer_url,
  'Ethereum' as network,
  true as is_active
FROM tokens t
LEFT JOIN token_contracts tc ON t.id = tc.token_id AND tc.network = 'Ethereum'
WHERE t.is_active = true
ON CONFLICT DO NOTHING;

-- Insert default wallet links for existing tokens
INSERT INTO token_wallets (token_id, wallet_name, wallet_url, wallet_type, is_active)
SELECT 
  t.id as token_id,
  'MetaMask' as wallet_name,
  'https://metamask.io' as wallet_url,
  'browser' as wallet_type,
  true as is_active
FROM tokens t
WHERE t.is_active = true
ON CONFLICT DO NOTHING;

INSERT INTO token_wallets (token_id, wallet_name, wallet_url, wallet_type, is_active)
SELECT 
  t.id as token_id,
  'Trust Wallet' as wallet_name,
  'https://trustwallet.com' as wallet_url,
  'mobile' as wallet_type,
  true as is_active
FROM tokens t
WHERE t.is_active = true
ON CONFLICT DO NOTHING;

INSERT INTO token_wallets (token_id, wallet_name, wallet_url, wallet_type, is_active)
SELECT 
  t.id as token_id,
  'WalletConnect' as wallet_name,
  'https://walletconnect.com' as wallet_url,
  'mobile' as wallet_type,
  true as is_active
FROM tokens t
WHERE t.is_active = true
ON CONFLICT DO NOTHING;

-- Insert default source code links for existing tokens
INSERT INTO token_source_code (token_id, source_type, source_name, source_url, network, is_verified, is_active)
SELECT 
  t.id as token_id,
  'contract_code' as source_type,
  'Contract Code' as source_name,
  CASE 
    WHEN tc.contract_address IS NOT NULL AND tc.contract_address != '' 
    THEN 'https://etherscan.io/address/' || tc.contract_address || '#code'
    ELSE 'https://etherscan.io'
  END as source_url,
  'Ethereum' as network,
  tc.is_verified as is_verified,
  true as is_active
FROM tokens t
LEFT JOIN token_contracts tc ON t.id = tc.token_id AND tc.network = 'Ethereum'
WHERE t.is_active = true
ON CONFLICT DO NOTHING;

-- Add comment to document the new tables
COMMENT ON TABLE token_explorers IS 'Stores blockchain explorer links for tokens (Etherscan, BscScan, etc.)';
COMMENT ON TABLE token_wallets IS 'Stores wallet support links for tokens (MetaMask, Trust Wallet, etc.)';
COMMENT ON TABLE token_source_code IS 'Stores source code and documentation links for tokens';
