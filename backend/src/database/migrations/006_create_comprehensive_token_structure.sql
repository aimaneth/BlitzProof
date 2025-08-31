-- Migration: Create comprehensive token structure with best practices
-- This replaces the old manual_tokens and cached_token_data tables with a proper relational structure

-- 1. Extend the existing tokens table with missing fields
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS rank INTEGER;
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS holder_count INTEGER DEFAULT 0;
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS contract_score INTEGER DEFAULT 0;
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS audits_count INTEGER DEFAULT 0;

-- 2. Create token_socials table for social media links
CREATE TABLE IF NOT EXISTS token_socials (
  id SERIAL PRIMARY KEY,
  token_id INTEGER REFERENCES tokens(id) ON DELETE CASCADE,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('twitter', 'telegram', 'discord', 'github', 'linkedin', 'medium', 'website', 'reddit', 'youtube')),
  url VARCHAR(255) NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(token_id, platform)
);

-- 3. Create token_audits table for audit information
CREATE TABLE IF NOT EXISTS token_audits (
  id SERIAL PRIMARY KEY,
  token_id INTEGER REFERENCES tokens(id) ON DELETE CASCADE,
  auditor_name VARCHAR(100) NOT NULL,
  audit_date DATE NOT NULL,
  audit_type VARCHAR(50) DEFAULT 'security',
  score INTEGER CHECK (score >= 0 AND score <= 100),
  report_url VARCHAR(255),
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  findings_summary TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create token_security_scores table for BlitzProof scores
CREATE TABLE IF NOT EXISTS token_security_scores (
  id SERIAL PRIMARY KEY,
  token_id INTEGER REFERENCES tokens(id) ON DELETE CASCADE,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  rating VARCHAR(5) CHECK (rating IN ('AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'CC', 'C', 'D', 'F')),
  code_security_score INTEGER CHECK (code_security_score >= 0 AND code_security_score <= 100),
  market_score INTEGER CHECK (market_score >= 0 AND market_score <= 100),
  governance_score INTEGER CHECK (governance_score >= 0 AND governance_score <= 100),
  fundamental_score INTEGER CHECK (fundamental_score >= 0 AND fundamental_score <= 100),
  community_score INTEGER CHECK (community_score >= 0 AND community_score <= 100),
  operational_score INTEGER CHECK (operational_score >= 0 AND operational_score <= 100),
  verified_count INTEGER DEFAULT 0,
  informational_count INTEGER DEFAULT 0,
  warnings_count INTEGER DEFAULT 0,
  critical_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(token_id)
);

-- 5. Create token_dex_pairs table for DEX pair information
CREATE TABLE IF NOT EXISTS token_dex_pairs (
  id SERIAL PRIMARY KEY,
  token_id INTEGER REFERENCES tokens(id) ON DELETE CASCADE,
  dex_name VARCHAR(50) NOT NULL,
  pair_address VARCHAR(255),
  base_token VARCHAR(50),
  quote_token VARCHAR(50) DEFAULT 'USDT',
  liquidity_usd DECIMAL(20,2) DEFAULT 0,
  volume_24h DECIMAL(20,2) DEFAULT 0,
  price_usd DECIMAL(20,8) DEFAULT 0,
  price_change_24h DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create tags table for token categorization
CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Create token_tags junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS token_tags (
  token_id INTEGER REFERENCES tokens(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (token_id, tag_id)
);

-- 8. Create token_price_history table for historical prices
CREATE TABLE IF NOT EXISTS token_price_history (
  id SERIAL PRIMARY KEY,
  token_id INTEGER REFERENCES tokens(id) ON DELETE CASCADE,
  price_usd DECIMAL(20,8) NOT NULL,
  market_cap DECIMAL(20,2),
  volume_24h DECIMAL(20,2),
  recorded_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_token_socials_token_id ON token_socials(token_id);
CREATE INDEX IF NOT EXISTS idx_token_socials_platform ON token_socials(platform);
CREATE INDEX IF NOT EXISTS idx_token_audits_token_id ON token_audits(token_id);
CREATE INDEX IF NOT EXISTS idx_token_audits_auditor ON token_audits(auditor_name);
CREATE INDEX IF NOT EXISTS idx_token_audits_date ON token_audits(audit_date DESC);
CREATE INDEX IF NOT EXISTS idx_token_security_scores_token_id ON token_security_scores(token_id);
CREATE INDEX IF NOT EXISTS idx_token_dex_pairs_token_id ON token_dex_pairs(token_id);
CREATE INDEX IF NOT EXISTS idx_token_dex_pairs_dex ON token_dex_pairs(dex_name);
CREATE INDEX IF NOT EXISTS idx_token_tags_token_id ON token_tags(token_id);
CREATE INDEX IF NOT EXISTS idx_token_tags_tag_id ON token_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_token_price_history_token_id ON token_price_history(token_id);
CREATE INDEX IF NOT EXISTS idx_token_price_history_recorded_at ON token_price_history(recorded_at DESC);

-- Create updated_at triggers for all new tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_token_socials_updated_at 
    BEFORE UPDATE ON token_socials 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_token_audits_updated_at 
    BEFORE UPDATE ON token_audits 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_token_security_scores_updated_at 
    BEFORE UPDATE ON token_security_scores 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_token_dex_pairs_updated_at 
    BEFORE UPDATE ON token_dex_pairs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some default tags
INSERT INTO tags (name, category, description) VALUES
('DeFi', 'category', 'Decentralized Finance'),
('NFT', 'category', 'Non-Fungible Tokens'),
('Gaming', 'category', 'Gaming and Metaverse'),
('Layer1', 'category', 'Layer 1 Blockchains'),
('Layer2', 'category', 'Layer 2 Scaling Solutions'),
('Stablecoin', 'category', 'Stablecoins'),
('Meme', 'category', 'Meme Coins'),
('Infrastructure', 'category', 'Blockchain Infrastructure'),
('Privacy', 'category', 'Privacy-focused tokens'),
('AI', 'category', 'Artificial Intelligence'),
('Ethereum', 'network', 'Ethereum network'),
('Bitcoin', 'network', 'Bitcoin network'),
('Polygon', 'network', 'Polygon network'),
('BSC', 'network', 'Binance Smart Chain'),
('Arbitrum', 'network', 'Arbitrum network'),
('Optimism', 'network', 'Optimism network'),
('Avalanche', 'network', 'Avalanche network'),
('Solana', 'network', 'Solana network')
ON CONFLICT (name) DO NOTHING;

-- Add some sample data for existing tokens
-- Bitcoin
INSERT INTO token_socials (token_id, platform, url, is_verified) 
SELECT id, 'website', 'https://bitcoin.org', true FROM tokens WHERE unique_id = 'bitcoin'
ON CONFLICT (token_id, platform) DO NOTHING;

INSERT INTO token_security_scores (token_id, overall_score, rating, code_security_score, market_score, governance_score, fundamental_score, community_score, operational_score, verified_count, informational_count, warnings_count, critical_count)
SELECT id, 95, 'AAA', 95, 95, 95, 95, 95, 95, 15, 2, 1, 0 FROM tokens WHERE unique_id = 'bitcoin'
ON CONFLICT (token_id) DO NOTHING;

-- Ethereum
INSERT INTO token_socials (token_id, platform, url, is_verified) 
SELECT id, 'website', 'https://ethereum.org', true FROM tokens WHERE unique_id = 'ethereum'
ON CONFLICT (token_id, platform) DO NOTHING;

INSERT INTO token_security_scores (token_id, overall_score, rating, code_security_score, market_score, governance_score, fundamental_score, community_score, operational_score, verified_count, informational_count, warnings_count, critical_count)
SELECT id, 90, 'AA', 90, 90, 90, 90, 90, 90, 12, 3, 2, 0 FROM tokens WHERE unique_id = 'ethereum'
ON CONFLICT (token_id) DO NOTHING;

-- Cardano
INSERT INTO token_socials (token_id, platform, url, is_verified) 
SELECT id, 'website', 'https://cardano.org', true FROM tokens WHERE unique_id = 'cardano'
ON CONFLICT (token_id, platform) DO NOTHING;

INSERT INTO token_security_scores (token_id, overall_score, rating, code_security_score, market_score, governance_score, fundamental_score, community_score, operational_score, verified_count, informational_count, warnings_count, critical_count)
SELECT id, 85, 'A', 85, 85, 85, 85, 85, 85, 10, 4, 3, 0 FROM tokens WHERE unique_id = 'cardano'
ON CONFLICT (token_id) DO NOTHING;

-- Add tags to existing tokens
INSERT INTO token_tags (token_id, tag_id)
SELECT t.id, tag.id 
FROM tokens t, tags tag 
WHERE t.unique_id = 'bitcoin' AND tag.name = 'Layer1'
ON CONFLICT (token_id, tag_id) DO NOTHING;

INSERT INTO token_tags (token_id, tag_id)
SELECT t.id, tag.id 
FROM tokens t, tags tag 
WHERE t.unique_id = 'ethereum' AND tag.name = 'Layer1'
ON CONFLICT (token_id, tag_id) DO NOTHING;

INSERT INTO token_tags (token_id, tag_id)
SELECT t.id, tag.id 
FROM tokens t, tags tag 
WHERE t.unique_id = 'cardano' AND tag.name = 'Layer1'
ON CONFLICT (token_id, tag_id) DO NOTHING;

-- Update existing tokens with better data
UPDATE tokens SET 
  website = 'https://bitcoin.org',
  rank = 1,
  holder_count = 1000000,
  contract_score = 95,
  audits_count = 5
WHERE unique_id = 'bitcoin';

UPDATE tokens SET 
  website = 'https://ethereum.org',
  rank = 2,
  holder_count = 800000,
  contract_score = 90,
  audits_count = 8
WHERE unique_id = 'ethereum';

UPDATE tokens SET 
  website = 'https://cardano.org',
  rank = 8,
  holder_count = 500000,
  contract_score = 85,
  audits_count = 3
WHERE unique_id = 'cardano';

UPDATE tokens SET 
  website = 'https://blox.com',
  rank = 150,
  holder_count = 10000,
  contract_score = 75,
  audits_count = 1
WHERE unique_id = 'blox-myrc';
