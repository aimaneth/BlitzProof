import { Request, Response } from 'express'
import remediationService from '../services/remediationService'
import { Vulnerability } from '../types/scan'

export const generateRemediationPlan = async (req: Request, res: Response) => {
  try {
    const { vulnerability } = req.body

    if (!vulnerability || !vulnerability.id || !vulnerability.title) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid vulnerability data' 
      })
    }

    const remediationPlan = await remediationService.generateRemediationPlan(vulnerability)
    
    res.json({
      success: true,
      data: remediationPlan
    })
  } catch (error) {
    console.error('Remediation plan generation error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate remediation plan' 
    })
  }
}

export const generateAutomatedFix = async (req: Request, res: Response) => {
  try {
    const { vulnerability } = req.body

    if (!vulnerability || !vulnerability.id || !vulnerability.title) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid vulnerability data' 
      })
    }

    const automatedFix = await remediationService.generateAutomatedFix(vulnerability)
    
    res.json({
      success: true,
      data: {
        vulnerabilityId: vulnerability.id,
        vulnerabilityTitle: vulnerability.title,
        fix: automatedFix,
        generatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Automated fix generation error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate automated fix' 
    })
  }
}

export const getBestPractices = async (req: Request, res: Response) => {
  try {
    const { category } = req.query
    const practices = await remediationService.getBestPractices(category as string)
    
    res.json({
      success: true,
      data: practices
    })
  } catch (error) {
    console.error('Best practices fetch error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch best practices' 
    })
  }
}

export const getSecurityRecommendations = async (req: Request, res: Response) => {
  try {
    const { vulnerabilities } = req.body

    if (!vulnerabilities || !Array.isArray(vulnerabilities)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid vulnerabilities data' 
      })
    }

    const recommendations = await remediationService.getSecurityRecommendations(vulnerabilities)
    
    res.json({
      success: true,
      data: {
        recommendations,
        totalCount: recommendations.length,
        generatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Security recommendations error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate security recommendations' 
    })
  }
}

export const generateBatchRemediation = async (req: Request, res: Response) => {
  try {
    const { vulnerabilities } = req.body

    if (!vulnerabilities || !Array.isArray(vulnerabilities)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid vulnerabilities data' 
      })
    }

    const remediationPlans = await Promise.all(
      vulnerabilities.map(async (vuln: Vulnerability) => {
        try {
          return await remediationService.generateRemediationPlan(vuln)
        } catch (error) {
          console.error(`Failed to generate plan for vulnerability ${vuln.id}:`, error)
          return null
        }
      })
    )

    const validPlans = remediationPlans.filter(plan => plan !== null)
    const recommendations = await remediationService.getSecurityRecommendations(vulnerabilities)
    
    res.json({
      success: true,
      data: {
        remediationPlans: validPlans,
        recommendations,
        summary: {
          totalVulnerabilities: vulnerabilities.length,
          plansGenerated: validPlans.length,
          recommendationsCount: recommendations.length,
          estimatedTotalTime: calculateTotalTime(validPlans)
        },
        generatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Batch remediation error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate batch remediation' 
    })
  }
}

export const getRemediationStats = async (req: Request, res: Response) => {
  try {
    const practices = await remediationService.getBestPractices()
    
    const stats = {
      totalBestPractices: practices.length,
      categories: [...new Set(practices.map(p => p.category))],
      vulnerabilityTypes: ['reentrancy', 'overflow', 'access-control', 'unchecked-return', 'timestamp-dependence'],
      averageConfidence: 0.85,
      totalReferences: practices.reduce((total, p) => total + p.references.length, 0)
    }
    
    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Remediation stats error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch remediation stats' 
    })
  }
}

function calculateTotalTime(plans: any[]): string {
  const totalMinutes = plans.reduce((total, plan) => {
    const time = plan.totalEstimatedTime
         if (time.includes('h')) {
       const [hours, minutes] = time.split('h').map((s: string) => parseInt(s.trim()) || 0)
      return total + (hours * 60) + minutes
    }
    return total + (parseInt(time) || 0)
  }, 0)

  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${hours}h ${minutes}m`
  }
  return `${totalMinutes}m`
} 