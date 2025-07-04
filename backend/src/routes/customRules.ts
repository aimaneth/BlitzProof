import express from 'express'
import customRulesService from '../services/customRulesService'
import { authenticateToken } from '../middleware/auth'

const router = express.Router()

// Add JSON parsing for custom rules routes
router.use(express.json({ limit: '50mb' }))

// Get all custom rules (user's rules + public rules)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id
    const [userRules, publicRules] = await Promise.all([
      customRulesService.getUserRules(userId),
      customRulesService.getPublicRules()
    ])
    
    const allRules = [...userRules, ...publicRules]
    res.json({ rules: allRules })
  } catch (error) {
    console.error('Error fetching custom rules:', error)
    res.status(500).json({ error: 'Failed to fetch rules' })
  }
})

// Get user's custom rules
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id
    const rules = await customRulesService.getUserRules(userId)
    res.json({ success: true, rules })
  } catch (error) {
    console.error('Error fetching user rules:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch rules' })
  }
})

// Get public rules
router.get('/public', async (req, res) => {
  try {
    const rules = await customRulesService.getPublicRules()
    res.json({ success: true, rules })
  } catch (error) {
    console.error('Error fetching public rules:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch public rules' })
  }
})

// Create custom rule
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id
    const ruleData = req.body
    
    const ruleId = await customRulesService.createCustomRule(ruleData, userId)
    res.json({ success: true, ruleId })
  } catch (error) {
    console.error('Error creating custom rule:', error)
    res.status(500).json({ success: false, error: 'Failed to create rule' })
  }
})

// Update custom rule
router.put('/:ruleId', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id
    const { ruleId } = req.params
    const updates = req.body
    
    const success = await customRulesService.updateCustomRule(ruleId, updates, userId)
    res.json({ success })
  } catch (error) {
    console.error('Error updating custom rule:', error)
    res.status(500).json({ success: false, error: 'Failed to update rule' })
  }
})

// Delete custom rule
router.delete('/:ruleId', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id
    const { ruleId } = req.params
    
    const success = await customRulesService.deleteCustomRule(ruleId, userId)
    res.json({ success })
  } catch (error) {
    console.error('Error deleting custom rule:', error)
    res.status(500).json({ success: false, error: 'Failed to delete rule' })
  }
})

// Get rule templates
router.get('/templates', async (req, res) => {
  try {
    const templates = await customRulesService.getRuleTemplates()
    res.json({ success: true, templates })
  } catch (error) {
    console.error('Error fetching rule templates:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch templates' })
  }
})

// Get rule engine configuration
router.get('/config', async (req, res) => {
  try {
    const config = await customRulesService.getConfig()
    res.json({ success: true, config })
  } catch (error) {
    console.error('Error fetching rule config:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch config' })
  }
})

// Update rule engine configuration
router.put('/config', authenticateToken, async (req, res) => {
  try {
    const config = req.body
    await customRulesService.updateConfig(config)
    res.json({ success: true })
  } catch (error) {
    console.error('Error updating rule config:', error)
    res.status(500).json({ success: false, error: 'Failed to update config' })
  }
})

export default router 