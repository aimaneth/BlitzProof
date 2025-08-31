import { Vulnerability } from '../types/scan'
import pool from '../config/postgres'

interface CustomRule {
  id: string
  name: string
  description: string
  pattern: string
  regex?: string
  severity: 'high' | 'medium' | 'low'
  category: string
  enabled: boolean
  userId?: number
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
  tags: string[]
  examples: string[]
  remediation: string
  confidence: number
}

interface RuleMatch {
  ruleId: string
  ruleName: string
  line: number
  column: number
  matchedText: string
  severity: 'high' | 'medium' | 'low'
  category: string
  confidence: number
  context: string
}

interface RuleEngineConfig {
  enableCustomRules: boolean
  enablePatternMatching: boolean
  enableRegexMatching: boolean
  enableSemanticAnalysis: boolean
  maxRulesPerUser: number
  confidenceThreshold: number
}

class CustomRulesService {
  private readonly config: RuleEngineConfig = {
    enableCustomRules: true,
    enablePatternMatching: true,
    enableRegexMatching: true,
    enableSemanticAnalysis: true,
    maxRulesPerUser: 50,
    confidenceThreshold: 0.7
  }

  private readonly builtInRules: CustomRule[] = [
    {
      id: 'builtin-001',
      name: 'Unsafe Delegatecall',
      description: 'Detects unsafe delegatecall usage without proper access controls',
      pattern: 'delegatecall',
      regex: '\\bdelegatecall\\s*\\(',
      severity: 'high',
      category: 'unsafe-delegatecall',
      enabled: true,
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ['delegatecall', 'proxy', 'security'],
      examples: [
        'target.delegatecall(data)',
        'address(this).delegatecall(abi.encodeWithSignature("function()"))'
      ],
      remediation: 'Ensure delegatecall is only used with trusted contracts and proper access controls',
      confidence: 0.9
    },
    {
      id: 'builtin-002',
      name: 'Unchecked Return Values',
      description: 'Detects external calls without return value checks',
      pattern: 'external call without check',
      regex: '\\b(call|send|transfer)\\s*\\([^)]*\\)(?!\\s*;\\s*require)',
      severity: 'medium',
      category: 'unchecked-return',
      enabled: true,
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ['external-call', 'return-value', 'error-handling'],
      examples: [
        'recipient.transfer(amount)',
        'target.call{value: amount}(data)'
      ],
      remediation: 'Always check return values from external calls and handle failures appropriately',
      confidence: 0.8
    },
    {
      id: 'builtin-003',
      name: 'Unsafe Assembly',
      description: 'Detects potentially unsafe assembly code usage',
      pattern: 'assembly',
      regex: '\\bassembly\\b',
      severity: 'medium',
      category: 'unsafe-assembly',
      enabled: true,
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ['assembly', 'low-level', 'security'],
      examples: [
        'assembly { let result := call(gas(), target, value, add(data, 0x20), mload(data), 0, 0) }'
      ],
      remediation: 'Review assembly code carefully and ensure it follows security best practices',
      confidence: 0.7
    },
    {
      id: 'builtin-004',
      name: 'Unbounded Loops',
      description: 'Detects loops that could potentially run unbounded',
      pattern: 'unbounded loop',
      regex: 'for\\s*\\([^)]*\\)\\s*\\{[^}]*\\}',
      severity: 'medium',
      category: 'unbounded-loop',
      enabled: true,
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ['loop', 'gas', 'performance'],
      examples: [
        'for (uint i = 0; i < array.length; i++) { ... }',
        'while (condition) { ... }'
      ],
      remediation: 'Limit loop iterations or use pagination to prevent gas limit issues',
      confidence: 0.6
    },
    {
      id: 'builtin-005',
      name: 'Unsafe Randomness',
      description: 'Detects potentially unsafe randomness sources',
      pattern: 'unsafe randomness',
      regex: '\\b(block\\.timestamp|block\\.hash|block\\.number)\\b',
      severity: 'medium',
      category: 'unsafe-randomness',
      enabled: true,
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ['randomness', 'timestamp', 'mining'],
      examples: [
        'uint256 random = uint256(keccak256(abi.encodePacked(block.timestamp)))',
        'uint256 hash = uint256(blockhash(block.number - 1))'
      ],
      remediation: 'Use Chainlink VRF or other secure randomness sources for critical operations',
      confidence: 0.8
    }
  ]

  async applyCustomRules(contractCode: string, userId?: number): Promise<RuleMatch[]> {
    const matches: RuleMatch[] = []
    
    try {
      // Get all applicable rules
      const rules = await this.getApplicableRules(userId)
      
      // Apply each rule
      for (const rule of rules) {
        if (!rule.enabled) continue
        
        const ruleMatches = await this.applyRule(rule, contractCode)
        matches.push(...ruleMatches)
      }
      
      // Filter by confidence threshold
      return matches.filter(match => match.confidence >= this.config.confidenceThreshold)
    } catch (error) {
      console.error('Error applying custom rules:', error)
      return []
    }
  }

  private async applyRule(rule: CustomRule, contractCode: string): Promise<RuleMatch[]> {
    const matches: RuleMatch[] = []
    const lines = contractCode.split('\n')
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex]
      const lineNumber = lineIndex + 1
      
      // Pattern matching
      if (this.config.enablePatternMatching && rule.pattern) {
        if (line.toLowerCase().includes(rule.pattern.toLowerCase())) {
          matches.push({
            ruleId: rule.id,
            ruleName: rule.name,
            line: lineNumber,
            column: line.toLowerCase().indexOf(rule.pattern.toLowerCase()) + 1,
            matchedText: line.trim(),
            severity: rule.severity,
            category: rule.category,
            confidence: rule.confidence,
            context: this.extractContext(lines, lineIndex)
          })
        }
      }
      
      // Regex matching
      if (this.config.enableRegexMatching && rule.regex) {
        try {
          const regex = new RegExp(rule.regex, 'gi')
          const regexMatches = line.match(regex)
          
          if (regexMatches) {
            matches.push({
              ruleId: rule.id,
              ruleName: rule.name,
              line: lineNumber,
              column: line.search(regex) + 1,
              matchedText: regexMatches[0],
              severity: rule.severity,
              category: rule.category,
              confidence: rule.confidence,
              context: this.extractContext(lines, lineIndex)
            })
          }
        } catch (error) {
          console.warn(`Invalid regex in rule ${rule.id}:`, error)
        }
      }
    }
    
    return matches
  }

  private extractContext(lines: string[], lineIndex: number): string {
    const contextLines = []
    const start = Math.max(0, lineIndex - 2)
    const end = Math.min(lines.length, lineIndex + 3)
    
    for (let i = start; i < end; i++) {
      const prefix = i === lineIndex ? '>>> ' : '    '
      contextLines.push(`${prefix}${i + 1}: ${lines[i]}`)
    }
    
    return contextLines.join('\n')
  }

  async createCustomRule(rule: Omit<CustomRule, 'id' | 'createdAt' | 'updatedAt'>, userId: number): Promise<string> {
    try {
      // Validate rule
      this.validateRule(rule)
      
      // Check user rule limit
      const userRuleCount = await this.getUserRuleCount(userId)
      if (userRuleCount >= this.config.maxRulesPerUser) {
        throw new Error(`Maximum rules limit (${this.config.maxRulesPerUser}) exceeded`)
      }
      
      const ruleId = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const newRule: CustomRule = {
        ...rule,
        id: ruleId,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      // Save to database
      await this.saveRuleToDatabase(newRule)
      
      return ruleId
    } catch (error) {
      console.error('Error creating custom rule:', error)
      throw error
    }
  }

  async updateCustomRule(ruleId: string, updates: Partial<CustomRule>, userId: number): Promise<boolean> {
    try {
      // Verify ownership
      const rule = await this.getRuleById(ruleId)
      if (!rule || (rule.userId && rule.userId !== userId)) {
        throw new Error('Rule not found or access denied')
      }
      
      // Validate updates
      if (updates.pattern) this.validatePattern(updates.pattern)
      if (updates.regex) this.validateRegex(updates.regex)
      
      // Update rule
      const updatedRule = {
        ...rule,
        ...updates,
        updatedAt: new Date()
      }
      
      await this.updateRuleInDatabase(ruleId, updatedRule)
      return true
    } catch (error) {
      console.error('Error updating custom rule:', error)
      return false
    }
  }

  async deleteCustomRule(ruleId: string, userId: number): Promise<boolean> {
    try {
      // Verify ownership
      const rule = await this.getRuleById(ruleId)
      if (!rule || (rule.userId && rule.userId !== userId)) {
        throw new Error('Rule not found or access denied')
      }
      
      await this.deleteRuleFromDatabase(ruleId)
      return true
    } catch (error) {
      console.error('Error deleting custom rule:', error)
      return false
    }
  }

  async getUserRules(userId: number): Promise<CustomRule[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM custom_rules WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      )
      return result.rows.map(row => this.mapDatabaseRowToRule(row))
    } catch (error) {
      console.error('Error fetching user rules:', error)
      return []
    }
  }

  async getPublicRules(): Promise<CustomRule[]> {
    return this.builtInRules.filter(rule => rule.isPublic)
  }

  private async getApplicableRules(userId?: number): Promise<CustomRule[]> {
    const rules: CustomRule[] = []
    
    // Add built-in rules
    rules.push(...this.builtInRules.filter(rule => rule.enabled))
    
    // Add user's custom rules
    if (userId) {
      const userRules = await this.getUserRules(userId)
      rules.push(...userRules.filter(rule => rule.enabled))
    }
    
    return rules
  }

  private validateRule(rule: Partial<CustomRule>): void {
    if (!rule.name || rule.name.trim().length === 0) {
      throw new Error('Rule name is required')
    }
    
    if (!rule.pattern && !rule.regex) {
      throw new Error('Either pattern or regex is required')
    }
    
    if (rule.pattern) this.validatePattern(rule.pattern)
    if (rule.regex) this.validateRegex(rule.regex)
    
    if (!['high', 'medium', 'low'].includes(rule.severity || '')) {
      throw new Error('Invalid severity level')
    }
  }

  private validatePattern(pattern: string): void {
    if (pattern.trim().length === 0) {
      throw new Error('Pattern cannot be empty')
    }
  }

  private validateRegex(regex: string): void {
    try {
      new RegExp(regex)
    } catch (error) {
      throw new Error(`Invalid regex pattern: ${error}`)
    }
  }

  private async getUserRuleCount(userId: number): Promise<number> {
    try {
      const result = await pool.query(
        'SELECT COUNT(*) FROM custom_rules WHERE user_id = $1',
        [userId]
      )
      return parseInt(result.rows[0].count)
    } catch (error) {
      console.error('Error getting user rule count:', error)
      return 0
    }
  }

  private async saveRuleToDatabase(rule: CustomRule): Promise<void> {
    await pool.query(
      `INSERT INTO custom_rules (
        id, name, description, pattern, regex, severity, category, 
        enabled, user_id, is_public, created_at, updated_at, tags, 
        examples, remediation, confidence
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        rule.id, rule.name, rule.description, rule.pattern, rule.regex,
        rule.severity, rule.category, rule.enabled, rule.userId, rule.isPublic,
        rule.createdAt, rule.updatedAt, JSON.stringify(rule.tags),
        JSON.stringify(rule.examples), rule.remediation, rule.confidence
      ]
    )
  }

  private async updateRuleInDatabase(ruleId: string, rule: CustomRule): Promise<void> {
    await pool.query(
      `UPDATE custom_rules SET 
        name = $1, description = $2, pattern = $3, regex = $4, severity = $5,
        category = $6, enabled = $7, is_public = $8, updated_at = $9,
        tags = $10, examples = $11, remediation = $12, confidence = $13
       WHERE id = $14`,
      [
        rule.name, rule.description, rule.pattern, rule.regex, rule.severity,
        rule.category, rule.enabled, rule.isPublic, rule.updatedAt,
        JSON.stringify(rule.tags), JSON.stringify(rule.examples),
        rule.remediation, rule.confidence, ruleId
      ]
    )
  }

  private async deleteRuleFromDatabase(ruleId: string): Promise<void> {
    await pool.query('DELETE FROM custom_rules WHERE id = $1', [ruleId])
  }

  private async getRuleById(ruleId: string): Promise<CustomRule | null> {
    try {
      const result = await pool.query('SELECT * FROM custom_rules WHERE id = $1', [ruleId])
      if (result.rows.length === 0) return null
      return this.mapDatabaseRowToRule(result.rows[0])
    } catch (error) {
      console.error('Error getting rule by ID:', error)
      return null
    }
  }

  private mapDatabaseRowToRule(row: any): CustomRule {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      pattern: row.pattern,
      regex: row.regex,
      severity: row.severity,
      category: row.category,
      enabled: row.enabled,
      userId: row.user_id,
      isPublic: row.is_public,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      tags: row.tags ? JSON.parse(row.tags) : [],
      examples: row.examples ? JSON.parse(row.examples) : [],
      remediation: row.remediation,
      confidence: row.confidence
    }
  }

  // Configuration management
  async updateConfig(config: Partial<RuleEngineConfig>): Promise<void> {
    Object.assign(this.config, config)
  }

  async getConfig(): Promise<RuleEngineConfig> {
    return { ...this.config }
  }

  // Rule templates
  async getRuleTemplates(): Promise<Partial<CustomRule>[]> {
    return [
      {
        name: 'Custom Reentrancy Pattern',
        description: 'Detect custom reentrancy patterns',
        pattern: 'external call before state update',
        severity: 'high',
        category: 'custom-reentrancy',
        tags: ['reentrancy', 'custom'],
        examples: ['Example: call() before balance update'],
        remediation: 'Implement proper reentrancy protection'
      },
      {
        name: 'Custom Access Control',
        description: 'Detect missing access controls for specific functions',
        pattern: 'function without modifier',
        severity: 'medium',
        category: 'custom-access-control',
        tags: ['access-control', 'custom'],
        examples: ['Example: public function without access control'],
        remediation: 'Add appropriate access control modifiers'
      }
    ]
  }
}

export default new CustomRulesService() 