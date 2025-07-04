import { Pool } from 'pg'
import dotenv from 'dotenv'
import pool from './database'

dotenv.config()

// Embedded database schema
const schema = `
-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    username VARCHAR(100),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    preferences JSONB DEFAULT '{}',
    reputation_score INTEGER DEFAULT 0,
    total_scans INTEGER DEFAULT 0,
    successful_scans INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create scans table
CREATE TABLE IF NOT EXISTS scans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    contract_address VARCHAR(42),
    contract_name VARCHAR(255),
    network VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending',
    scan_type VARCHAR(20) DEFAULT 'file',
    file_path VARCHAR(500),
    file_size INTEGER,
    scan_results JSONB,
    error_message TEXT,
    scan_duration INTEGER,
    tools_used TEXT[],
    ai_analysis_enabled BOOLEAN DEFAULT true,
    custom_config JSONB DEFAULT '{}',
    scan_id VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create scan_results table
CREATE TABLE IF NOT EXISTS scan_results (
    id SERIAL PRIMARY KEY,
    scan_id INTEGER REFERENCES scans(id) ON DELETE CASCADE,
    tool VARCHAR(50) NOT NULL,
    vulnerability_type VARCHAR(100),
    severity VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    line_number INTEGER,
    code_snippet TEXT,
    recommendation TEXT,
    cwe_id VARCHAR(20),
    confidence DECIMAL(3,2),
    file_path VARCHAR(500),
    function_name VARCHAR(100),
    contract_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(255) UNIQUE NOT NULL,
    permissions TEXT[] DEFAULT ARRAY['read', 'scan'],
    rate_limit INTEGER DEFAULT 1000,
    last_used TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create ai_analysis_results table
CREATE TABLE IF NOT EXISTS ai_analysis_results (
    id SERIAL PRIMARY KEY,
    vulnerability_id INTEGER REFERENCES scan_results(id) ON DELETE CASCADE,
    scan_id INTEGER REFERENCES scans(id) ON DELETE CASCADE,
    confidence DECIMAL(3,2) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    description TEXT,
    remediation TEXT,
    risk_score INTEGER,
    ai_model VARCHAR(50),
    analysis_time INTEGER,
    enhanced_description TEXT,
    smart_remediation TEXT,
    code_fixes TEXT[],
    false_positive_risk DECIMAL(3,2),
    exploitability_score INTEGER,
    impact_score INTEGER,
    reference_links TEXT[],
    cwe_ids TEXT[],
    tags TEXT[],
    pattern_matches JSONB,
    context_analysis JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create security tools configuration table
CREATE TABLE IF NOT EXISTS security_tools (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    version VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create vulnerability patterns table for AI learning
CREATE TABLE IF NOT EXISTS vulnerability_patterns (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    patterns TEXT[] NOT NULL,
    severity VARCHAR(20) NOT NULL,
    description TEXT,
    cwe_id VARCHAR(20),
    remediation TEXT,
    reference_links TEXT[],
    confidence_threshold DECIMAL(3,2) DEFAULT 0.3,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create scan configurations table for custom scan settings
CREATE TABLE IF NOT EXISTS scan_configurations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    tools_enabled TEXT[] DEFAULT ARRAY['slither', 'mythril'],
    ai_analysis_enabled BOOLEAN DEFAULT true,
    custom_rules JSONB DEFAULT '{}',
    severity_threshold VARCHAR(20) DEFAULT 'low',
    timeout_seconds INTEGER DEFAULT 300,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user reputation and achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    achievement_type VARCHAR(50) NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    points INTEGER DEFAULT 0,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create scan templates table for predefined scan types
CREATE TABLE IF NOT EXISTS scan_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(50),
    tools_config JSONB NOT NULL,
    ai_config JSONB DEFAULT '{}',
    severity_weights JSONB DEFAULT '{"high": 1.0, "medium": 0.6, "low": 0.3}',
    is_public BOOLEAN DEFAULT false,
    created_by INTEGER REFERENCES users(id),
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create audit reports table for comprehensive reporting
CREATE TABLE IF NOT EXISTS audit_reports (
    id SERIAL PRIMARY KEY,
    scan_id INTEGER REFERENCES scans(id) ON DELETE CASCADE,
    report_type VARCHAR(50) DEFAULT 'comprehensive',
    executive_summary TEXT,
    technical_details JSONB,
    risk_assessment JSONB,
    recommendations JSONB,
    compliance_check JSONB,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create custom rules table for user-defined security rules
CREATE TABLE IF NOT EXISTS custom_rules (
    id VARCHAR(100) PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    pattern TEXT,
    regex TEXT,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('high', 'medium', 'low')),
    category VARCHAR(50) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    examples TEXT[] DEFAULT ARRAY[]::TEXT[],
    remediation TEXT,
    confidence DECIMAL(3,2) DEFAULT 0.8,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create batch scan jobs table for processing multiple contracts
CREATE TABLE IF NOT EXISTS batch_scan_jobs (
    id VARCHAR(100) PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    total_files INTEGER NOT NULL,
    processed_files INTEGER DEFAULT 0,
    failed_files INTEGER DEFAULT 0,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    results JSONB DEFAULT '[]',
    config JSONB NOT NULL,
    progress INTEGER DEFAULT 0,
    error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create batch scan files table for tracking individual files in batch jobs
CREATE TABLE IF NOT EXISTS batch_scan_files (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(100) REFERENCES batch_scan_jobs(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    scan_results JSONB,
    error_message TEXT,
    processing_time INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create ML model performance tracking table
CREATE TABLE IF NOT EXISTS ml_model_performance (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(20),
    accuracy DECIMAL(5,4),
    precision DECIMAL(5,4),
    recall DECIMAL(5,4),
    f1_score DECIMAL(5,4),
    training_samples INTEGER,
    test_samples INTEGER,
    training_time INTEGER,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create security tool integration logs table
CREATE TABLE IF NOT EXISTS tool_integration_logs (
    id SERIAL PRIMARY KEY,
    tool_name VARCHAR(50) NOT NULL,
    operation VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    execution_time INTEGER,
    error_message TEXT,
    config_used JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_status ON scans(status);
CREATE INDEX IF NOT EXISTS idx_scan_results_scan_id ON scan_results(scan_id);
CREATE INDEX IF NOT EXISTS idx_scan_results_severity ON scan_results(severity);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_vulnerability_id ON ai_analysis_results(vulnerability_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_scan_id ON ai_analysis_results(scan_id);
CREATE INDEX IF NOT EXISTS idx_scan_configurations_user_id ON scan_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_reports_scan_id ON audit_reports(scan_id);
CREATE INDEX IF NOT EXISTS idx_custom_rules_user_id ON custom_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_rules_enabled ON custom_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_custom_rules_severity ON custom_rules(severity);
CREATE INDEX IF NOT EXISTS idx_batch_scan_jobs_user_id ON batch_scan_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_batch_scan_jobs_status ON batch_scan_jobs(status);
CREATE INDEX IF NOT EXISTS idx_batch_scan_files_job_id ON batch_scan_files(job_id);
CREATE INDEX IF NOT EXISTS idx_batch_scan_files_status ON batch_scan_files(status);
CREATE INDEX IF NOT EXISTS idx_ml_model_performance_model_name ON ml_model_performance(model_name);
CREATE INDEX IF NOT EXISTS idx_tool_integration_logs_tool_name ON tool_integration_logs(tool_name);
CREATE INDEX IF NOT EXISTS idx_tool_integration_logs_created_at ON tool_integration_logs(created_at);
`

export async function initializeDatabase() {
  try {
    // First, connect to default postgres database to create our database
    const defaultPool = new Pool({
      connectionString: process.env.DATABASE_URL?.replace('/blitzproof_db', '/postgres'),
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: {
        rejectUnauthorized: false
      }
    })

    // Check if blitzproof_db database exists, if not create it
    const result = await defaultPool.query('SELECT 1 FROM pg_database WHERE datname = $1', ['blitzproof_db'])
    if (result.rows.length === 0) {
      console.log('Creating database blitzproof_db...')
      await defaultPool.query('CREATE DATABASE blitzproof_db')
      console.log('Database blitzproof_db created successfully')
    } else {
      console.log('Database blitzproof_db already exists')
    }

    await defaultPool.end()

    // Now connect to the blitzproof_db database and create tables
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: {
        rejectUnauthorized: false
      }
    })

    // First, create tables without indexes
    const tablesOnlySchema = schema.replace(/-- Create indexes for better performance[\s\S]*$/, '')
    await pool.query(tablesOnlySchema)
    
    // Add missing columns if they don't exist
    await pool.query(`
      DO $$ 
      BEGIN 
        -- Add reputation_score column to users if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'reputation_score') THEN
          ALTER TABLE users ADD COLUMN reputation_score INTEGER DEFAULT 0;
        END IF;
        
        -- Add total_scans column to users if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'total_scans') THEN
          ALTER TABLE users ADD COLUMN total_scans INTEGER DEFAULT 0;
        END IF;
        
        -- Add successful_scans column to users if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'successful_scans') THEN
          ALTER TABLE users ADD COLUMN successful_scans INTEGER DEFAULT 0;
        END IF;

        -- Add key_hash column to api_keys if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'api_keys' AND column_name = 'key_hash') THEN
          ALTER TABLE api_keys ADD COLUMN key_hash VARCHAR(255) UNIQUE;
        END IF;

        -- Add reference_links column to ai_analysis_results if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_analysis_results' AND column_name = 'reference_links') THEN
          ALTER TABLE ai_analysis_results ADD COLUMN reference_links TEXT[];
        END IF;

        -- Add reference_links column to vulnerability_patterns if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vulnerability_patterns' AND column_name = 'reference_links') THEN
          ALTER TABLE vulnerability_patterns ADD COLUMN reference_links TEXT[];
        END IF;

        -- Add scan_id column to scans if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scans' AND column_name = 'scan_id') THEN
          ALTER TABLE scans ADD COLUMN scan_id VARCHAR(100) UNIQUE;
        END IF;

        -- Add scan_results column to scans if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scans' AND column_name = 'scan_results') THEN
          ALTER TABLE scans ADD COLUMN scan_results JSONB;
        END IF;

        -- Add scan_duration column to scans if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scans' AND column_name = 'scan_duration') THEN
          ALTER TABLE scans ADD COLUMN scan_duration INTEGER;
        END IF;

        -- Add tools_used column to scans if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scans' AND column_name = 'tools_used') THEN
          ALTER TABLE scans ADD COLUMN tools_used TEXT[];
        END IF;

        -- Add enhanced_description column to ai_analysis_results if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_analysis_results' AND column_name = 'enhanced_description') THEN
          ALTER TABLE ai_analysis_results ADD COLUMN enhanced_description TEXT;
        END IF;

        -- Add smart_remediation column to ai_analysis_results if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_analysis_results' AND column_name = 'smart_remediation') THEN
          ALTER TABLE ai_analysis_results ADD COLUMN smart_remediation TEXT;
        END IF;

        -- Add code_fixes column to ai_analysis_results if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_analysis_results' AND column_name = 'code_fixes') THEN
          ALTER TABLE ai_analysis_results ADD COLUMN code_fixes TEXT[];
        END IF;

        -- Add false_positive_risk column to ai_analysis_results if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_analysis_results' AND column_name = 'false_positive_risk') THEN
          ALTER TABLE ai_analysis_results ADD COLUMN false_positive_risk DECIMAL(3,2);
        END IF;

        -- Add exploitability_score column to ai_analysis_results if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_analysis_results' AND column_name = 'exploitability_score') THEN
          ALTER TABLE ai_analysis_results ADD COLUMN exploitability_score INTEGER;
        END IF;

        -- Add impact_score column to ai_analysis_results if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_analysis_results' AND column_name = 'impact_score') THEN
          ALTER TABLE ai_analysis_results ADD COLUMN impact_score INTEGER;
        END IF;

        -- Add cwe_ids column to ai_analysis_results if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_analysis_results' AND column_name = 'cwe_ids') THEN
          ALTER TABLE ai_analysis_results ADD COLUMN cwe_ids TEXT[];
        END IF;

        -- Add tags column to ai_analysis_results if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_analysis_results' AND column_name = 'tags') THEN
          ALTER TABLE ai_analysis_results ADD COLUMN tags TEXT[];
        END IF;
      END $$;
    `)

    // Now create indexes after columns exist - with error handling
    await pool.query(`
      DO $$ 
      BEGIN 
        -- Create indexes for better performance with error handling
        BEGIN
          CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
        EXCEPTION WHEN OTHERS THEN
          -- Index creation failed, table or column might not exist
          NULL;
        END;
        
        BEGIN
          CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id);
        EXCEPTION WHEN OTHERS THEN
          NULL;
        END;
        
        BEGIN
          CREATE INDEX IF NOT EXISTS idx_scans_status ON scans(status);
        EXCEPTION WHEN OTHERS THEN
          NULL;
        END;
        
        BEGIN
          CREATE INDEX IF NOT EXISTS idx_scan_results_scan_id ON scan_results(scan_id);
        EXCEPTION WHEN OTHERS THEN
          NULL;
        END;
        
        BEGIN
          CREATE INDEX IF NOT EXISTS idx_scan_results_severity ON scan_results(severity);
        EXCEPTION WHEN OTHERS THEN
          NULL;
        END;
        
        BEGIN
          CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
        EXCEPTION WHEN OTHERS THEN
          NULL;
        END;
        
        BEGIN
          CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
        EXCEPTION WHEN OTHERS THEN
          NULL;
        END;
        
        BEGIN
          CREATE INDEX IF NOT EXISTS idx_ai_analysis_vulnerability_id ON ai_analysis_results(vulnerability_id);
        EXCEPTION WHEN OTHERS THEN
          NULL;
        END;
        
        BEGIN
          CREATE INDEX IF NOT EXISTS idx_ai_analysis_scan_id ON ai_analysis_results(scan_id);
        EXCEPTION WHEN OTHERS THEN
          NULL;
        END;
        
        BEGIN
          CREATE INDEX IF NOT EXISTS idx_scan_configurations_user_id ON scan_configurations(user_id);
        EXCEPTION WHEN OTHERS THEN
          NULL;
        END;
        
        BEGIN
          CREATE INDEX IF NOT EXISTS idx_audit_reports_scan_id ON audit_reports(scan_id);
        EXCEPTION WHEN OTHERS THEN
          NULL;
        END;
      END $$;
    `)
    
    // Insert default security tools with error handling
    try {
      await pool.query(`
        INSERT INTO security_tools (name, version, config) VALUES
        ('slither', '0.9.3', '{"detectors": ["all"], "exclude": [], "filter_paths": []}'),
        ('mythril', '0.23.0', '{"execution_timeout": 600, "max_depth": 10, "solver_timeout": 10000}'),
        ('oyente', '0.2.7', '{"timeout": 300, "depth": 10, "gas": 6000000}'),
        ('securify', '2.0', '{"timeout": 600, "max_depth": 15}')
        ON CONFLICT (name) DO NOTHING
      `)
    } catch (error: any) {
      console.log('⚠️ Security tools insertion failed (table might not exist yet):', error.message)
    }

    // Insert default vulnerability patterns with error handling
    try {
      await pool.query(`
        INSERT INTO vulnerability_patterns (name, patterns, severity, description, cwe_id, remediation, reference_links) VALUES
        ('Reentrancy Attack', ARRAY['external call', 'state change', 'call.value', 'transfer', 'send', 'before state update', 'modifier', 'reentrant'], 'high', 'Potential reentrancy vulnerability where external calls can be made before state updates', 'CWE-841', 'Use Checks-Effects-Interactions pattern, implement reentrancy guards, or use pull payment pattern', ARRAY['https://consensys.net/diligence/blog/2019/09/stop-using-soliditys-transfer-now/', 'https://docs.openzeppelin.com/contracts/4.x/api/security#ReentrancyGuard']),
        ('Integer Overflow/Underflow', ARRAY['uint256', 'int256', 'addition', 'subtraction', 'multiplication', 'division', 'unchecked', 'overflow', 'underflow'], 'medium', 'Potential integer overflow or underflow in arithmetic operations', 'CWE-190', 'Use SafeMath library or Solidity 0.8+ built-in overflow checks, validate inputs', ARRAY['https://docs.openzeppelin.com/contracts/4.x/api/utils#SafeMath', 'https://solidity.readthedocs.io/en/v0.8.0/080-breaking-changes.html']),
        ('Access Control Issues', ARRAY['public function', 'external function', 'modifier', 'onlyOwner', 'access control', 'permission', 'role', 'authorization'], 'high', 'Missing or improper access control mechanisms', 'CWE-284', 'Implement proper access control using modifiers, OpenZeppelin AccessControl, or custom role-based systems', ARRAY['https://docs.openzeppelin.com/contracts/4.x/api/access', 'https://consensys.net/diligence/blog/2020/08/the-risks-of-using-address-0-as-a-privileged-address/'])
        ON CONFLICT (name) DO NOTHING
      `)
    } catch (error: any) {
      console.log('⚠️ Vulnerability patterns insertion failed (table might not exist yet):', error.message)
    }

    // Insert default scan templates with error handling
    try {
      await pool.query(`
        INSERT INTO scan_templates (name, description, category, tools_config, ai_config, is_public) VALUES
        ('Quick Security Check', 'Fast security analysis for basic vulnerabilities', 'basic', '{"slither": {"detectors": ["all"]}, "mythril": {"execution_timeout": 300}}', '{"enabled": true, "confidence_threshold": 0.5}', true),
        ('Comprehensive Audit', 'Full security audit with all tools and AI analysis', 'comprehensive', '{"slither": {"detectors": ["all"]}, "mythril": {"execution_timeout": 600}, "oyente": {"timeout": 300}, "securify": {"timeout": 600}}', '{"enabled": true, "confidence_threshold": 0.3, "deep_analysis": true}', true),
        ('DeFi Protocol Scan', 'Specialized scan for DeFi protocols and financial contracts', 'defi', '{"slither": {"detectors": ["all"]}, "mythril": {"execution_timeout": 900}}', '{"enabled": true, "defi_patterns": true, "financial_risk_analysis": true}', true)
        ON CONFLICT (name) DO NOTHING
      `)
    } catch (error: any) {
      console.log('⚠️ Scan templates insertion failed (table might not exist yet):', error.message)
    }

    console.log('✅ Database initialized successfully with enhanced schema')
  } catch (error) {
    console.error('❌ Database initialization error:', error)
    throw error
  }
} 