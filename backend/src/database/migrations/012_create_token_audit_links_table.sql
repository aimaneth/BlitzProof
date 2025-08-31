-- Migration: Create token_audit_links table
-- This table stores audit links for tokens (like explorer links but for audits)

CREATE TABLE IF NOT EXISTS token_audit_links (
  id SERIAL PRIMARY KEY,
  token_id INTEGER NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  audit_name VARCHAR(255) NOT NULL,
  audit_url TEXT NOT NULL,
  audit_type VARCHAR(100) DEFAULT 'Security',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_token_audit_links_token_id ON token_audit_links(token_id);
CREATE INDEX IF NOT EXISTS idx_token_audit_links_active ON token_audit_links(is_active);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_token_audit_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_token_audit_links_updated_at
  BEFORE UPDATE ON token_audit_links
  FOR EACH ROW
  EXECUTE FUNCTION update_token_audit_links_updated_at();
