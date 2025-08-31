-- Migration: Create manual_tokens table
-- This table stores all manually added tokens with their configuration

CREATE TABLE IF NOT EXISTS manual_tokens (
    id SERIAL PRIMARY KEY,
    token_id VARCHAR(255) UNIQUE NOT NULL,
    coin_gecko_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    address VARCHAR(255),
    network VARCHAR(100),
    contract_type VARCHAR(100),
    description TEXT,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0,
    category VARCHAR(50) DEFAULT 'TRENDING',
    monitoring_strategy VARCHAR(50) DEFAULT 'HOURLY',
    risk_level VARCHAR(50) DEFAULT 'MEDIUM',
    alert_thresholds JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_manual_tokens_coin_gecko_id ON manual_tokens(coin_gecko_id);
CREATE INDEX IF NOT EXISTS idx_manual_tokens_is_active ON manual_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_manual_tokens_priority ON manual_tokens(priority DESC);
CREATE INDEX IF NOT EXISTS idx_manual_tokens_category ON manual_tokens(category);
CREATE INDEX IF NOT EXISTS idx_manual_tokens_network ON manual_tokens(network);

-- Insert default tokens
INSERT INTO manual_tokens (token_id, coin_gecko_id, name, symbol, network, contract_type, description, priority, category, monitoring_strategy, risk_level, alert_thresholds) VALUES
('1', 'bitcoin', 'Bitcoin', 'BTC', 'Bitcoin', 'Native', 'The first and most well-known cryptocurrency', 100, 'ESTABLISHED', 'REAL_TIME', 'LOW', '{"priceChange": 5, "volumeSpike": 200, "largeTransfer": 1000000, "holderMovement": 2}'),
('2', 'ethereum', 'Ethereum', 'ETH', 'Ethereum', 'Native', 'Smart contract platform and cryptocurrency', 95, 'ESTABLISHED', 'REAL_TIME', 'LOW', '{"priceChange": 5, "volumeSpike": 200, "largeTransfer": 1000000, "holderMovement": 2}'),
('3', 'blox-myrc', 'Blox', 'MYRC', 'Ethereum', 'ERC20', 'Blox token on Ethereum network', 80, 'TRENDING', 'REAL_TIME', 'MEDIUM', '{"priceChange": 10, "volumeSpike": 300, "largeTransfer": 100000, "holderMovement": 5}')
ON CONFLICT (token_id) DO NOTHING;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_manual_tokens_updated_at 
    BEFORE UPDATE ON manual_tokens 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 🆕 REMOVED: Database triggers for syncing static data to cache
-- Static data (name, symbol, network, etc.) should only come from manual_tokens table
-- Cache should only contain price/real-time data that changes frequently
