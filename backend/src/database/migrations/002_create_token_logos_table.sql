-- Create token_logos table
CREATE TABLE IF NOT EXISTS token_logos (
  id SERIAL PRIMARY KEY,
  token_id VARCHAR(50) NOT NULL UNIQUE,
  symbol VARCHAR(20),
  name VARCHAR(100),
  logo_url VARCHAR(255) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_token_logos_token_id ON token_logos(token_id);

-- Add some sample data
INSERT INTO token_logos (token_id, symbol, name, logo_url) VALUES
  ('btc', 'BTC', 'Bitcoin', '/token-logo/btc.png'),
  ('eth', 'ETH', 'Ethereum', '/token-logo/ethereum.png'),
  ('sol', 'SOL', 'Solana', '/token-logo/solana.png'),
  ('link', 'LINK', 'Chainlink', '/token-logo/chainlink.png')
ON CONFLICT (token_id) DO NOTHING;
