-- BlitzProof BlockNet Score and Token Info Tables Migration

-- Create blitzproof_scores table
CREATE TABLE IF NOT EXISTS blitzproof_scores (
  id SERIAL PRIMARY KEY,
  token_id VARCHAR(255) NOT NULL,
  overall_score DECIMAL(5,2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  rating VARCHAR(3) NOT NULL CHECK (rating IN ('AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'CC', 'C', 'D')),
  code_security DECIMAL(5,2) NOT NULL CHECK (code_security >= 0 AND code_security <= 100),
  market DECIMAL(5,2) NOT NULL CHECK (market >= 0 AND market <= 100),
  governance DECIMAL(5,2) NOT NULL CHECK (governance >= 0 AND governance <= 100),
  fundamental DECIMAL(5,2) NOT NULL CHECK (fundamental >= 0 AND fundamental <= 100),
  community DECIMAL(5,2) NOT NULL CHECK (community >= 0 AND community <= 100),
  operational DECIMAL(5,2) NOT NULL CHECK (operational >= 0 AND operational <= 100),
  verified_count INTEGER NOT NULL DEFAULT 0 CHECK (verified_count >= 0),
  informational_count INTEGER NOT NULL DEFAULT 0 CHECK (informational_count >= 0),
  warnings_count INTEGER NOT NULL DEFAULT 0 CHECK (warnings_count >= 0),
  critical_count INTEGER NOT NULL DEFAULT 0 CHECK (critical_count >= 0),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create token_info table
CREATE TABLE IF NOT EXISTS token_info (
  id SERIAL PRIMARY KEY,
  token_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  symbol VARCHAR(50) NOT NULL,
  rank INTEGER CHECK (rank >= 0),
  audits INTEGER DEFAULT 0 CHECK (audits >= 0),
  website VARCHAR(500),
  contract_address VARCHAR(255),
  contract_score DECIMAL(5,2) CHECK (contract_score >= 0 AND contract_score <= 100),
  tags TEXT[] DEFAULT '{}',
  socials JSONB DEFAULT '{}',
  description TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blitzproof_scores_token_id ON blitzproof_scores(token_id);
CREATE INDEX IF NOT EXISTS idx_blitzproof_scores_last_updated ON blitzproof_scores(last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_token_info_token_id ON token_info(token_id);
CREATE INDEX IF NOT EXISTS idx_token_info_last_updated ON token_info(last_updated DESC);

-- Insert sample data for Chainlink (LINK)
INSERT INTO blitzproof_scores (
  token_id, overall_score, rating, code_security, market, governance, 
  fundamental, community, operational, verified_count, informational_count, 
  warnings_count, critical_count, updated_by
) VALUES (
  'link', 93.88, 'AAA', 83.27, 95.00, 95.00, 82.28, 95.00, 95.00, 13, 2, 4, 0, 'system'
) ON CONFLICT DO NOTHING;

INSERT INTO token_info (
  token_id, name, symbol, rank, audits, website, contract_address, 
  contract_score, tags, socials, description, updated_by
) VALUES (
  'link', 'Chainlink', 'LINK', 17, 1, 'chain.link', '0x514910771AF9Ca656af840dff83E8264EcF986CA',
  97.50, ARRAY['Ethereum', 'BSC'], 
  '{"twitter": "https://twitter.com/chainlink", "telegram": "https://t.me/chainlink", "discord": "https://discord.gg/chainlink", "github": "https://github.com/smartcontractkit", "linkedin": "https://linkedin.com/company/chainlink", "medium": "https://medium.com/chainlink", "website": "https://chain.link"}',
  'Chainlink is a decentralized oracle network that provides reliable and secure inputs and outputs for smart contracts on the blockchain. With its unique approach to bringing off-chain data on-chain, Chainlink enables smart contracts to securely interact with external data sources, APIs, and traditional bank account payments.',
  'system'
) ON CONFLICT DO NOTHING;

-- Insert sample data for Bitcoin (BTC)
INSERT INTO blitzproof_scores (
  token_id, overall_score, rating, code_security, market, governance, 
  fundamental, community, operational, verified_count, informational_count, 
  warnings_count, critical_count, updated_by
) VALUES (
  'btc', 95.50, 'AAA', 90.00, 98.00, 95.00, 95.00, 98.00, 97.00, 15, 1, 2, 0, 'system'
) ON CONFLICT DO NOTHING;

INSERT INTO token_info (
  token_id, name, symbol, rank, audits, website, contract_address, 
  contract_score, tags, socials, description, updated_by
) VALUES (
  'btc', 'Bitcoin', 'BTC', 1, 0, 'bitcoin.org', '',
  100.00, ARRAY['Bitcoin'], 
  '{"twitter": "https://twitter.com/bitcoin", "website": "https://bitcoin.org"}',
  'Bitcoin is a decentralized digital currency, without a central bank or single administrator, that can be sent from user to user on the peer-to-peer bitcoin network without intermediaries.',
  'system'
) ON CONFLICT DO NOTHING;

-- Insert sample data for Ethereum (ETH)
INSERT INTO blitzproof_scores (
  token_id, overall_score, rating, code_security, market, governance, 
  fundamental, community, operational, verified_count, informational_count, 
  warnings_count, critical_count, updated_by
) VALUES (
  'eth', 94.20, 'AAA', 88.50, 96.00, 94.00, 92.00, 96.00, 95.00, 14, 2, 3, 0, 'system'
) ON CONFLICT DO NOTHING;

INSERT INTO token_info (
  token_id, name, symbol, rank, audits, website, contract_address, 
  contract_score, tags, socials, description, updated_by
) VALUES (
  'eth', 'Ethereum', 'ETH', 2, 2, 'ethereum.org', '',
  98.00, ARRAY['Ethereum'], 
  '{"twitter": "https://twitter.com/ethereum", "github": "https://github.com/ethereum", "website": "https://ethereum.org"}',
  'Ethereum is a decentralized, open-source blockchain with smart contract functionality. Ether is the native cryptocurrency of the platform.',
  'system'
) ON CONFLICT DO NOTHING;
