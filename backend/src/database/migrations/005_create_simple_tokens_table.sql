-- Create simple tokens table from scratch
-- This replaces the complex manual_tokens and cached_token_data tables

CREATE TABLE IF NOT EXISTS tokens (
    id SERIAL PRIMARY KEY,
    unique_id VARCHAR(50) UNIQUE NOT NULL, -- User-editable unique identifier
    coin_gecko_id VARCHAR(100) UNIQUE NOT NULL, -- For API calls
    name VARCHAR(255) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    description TEXT,
    network VARCHAR(50) DEFAULT 'Ethereum',
    contract_address VARCHAR(255),
    category VARCHAR(50) DEFAULT 'DeFi',
    priority INTEGER DEFAULT 50,
    risk_level VARCHAR(20) DEFAULT 'MEDIUM',
    monitoring_strategy VARCHAR(20) DEFAULT 'REAL_TIME',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tokens_unique_id ON tokens(unique_id);
CREATE INDEX IF NOT EXISTS idx_tokens_coin_gecko_id ON tokens(coin_gecko_id);
CREATE INDEX IF NOT EXISTS idx_tokens_active ON tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_tokens_priority ON tokens(priority DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tokens_updated_at 
    BEFORE UPDATE ON tokens 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample tokens
INSERT INTO tokens (unique_id, coin_gecko_id, name, symbol, description, network, category, priority, risk_level) VALUES
('blox-myrc', 'blox-myrc', 'Blox MYRC', 'MYRC', 'Blox MYRC token for testing', 'Ethereum', 'DeFi', 90, 'LOW'),
('bitcoin', 'bitcoin', 'Bitcoin', 'BTC', 'The original cryptocurrency', 'Bitcoin', 'Established', 100, 'LOW'),
('ethereum', 'ethereum', 'Ethereum', 'ETH', 'Smart contract platform', 'Ethereum', 'Established', 95, 'LOW'),
('cardano', 'cardano', 'Cardano', 'ADA', 'Proof of stake blockchain', 'Cardano', 'Established', 85, 'MEDIUM');

-- Drop old tables (commented out for safety - uncomment when ready)
-- DROP TABLE IF EXISTS manual_tokens CASCADE;
-- DROP TABLE IF EXISTS cached_token_data CASCADE;
