import { ScanResult } from '../types/scan'
import * as fs from 'fs'
import * as path from 'path'
import puppeteer from 'puppeteer'

export interface ExportOptions {
  format: 'pdf' | 'csv' | 'json' | 'html'
  includeDetails?: boolean
  includeRemediation?: boolean
  includeAIInsights?: boolean
  includeCustomRules?: boolean
  includeCharts?: boolean
  template?: string
}

export interface ReportTemplate {
  name: string
  description: string
  sections: string[]
  includeCharts: boolean
  includeAIInsights: boolean
  includeRemediation: boolean
}

export class EnhancedExportService {
  private readonly templates: Record<string, ReportTemplate> = {
    executive: {
      name: 'Executive Summary',
      description: 'High-level overview for stakeholders',
      sections: ['summary', 'risk-score', 'critical-findings', 'recommendations'],
      includeCharts: true,
      includeAIInsights: true,
      includeRemediation: false
    },
    technical: {
      name: 'Technical Report',
      description: 'Detailed technical analysis for developers',
      sections: ['summary', 'vulnerabilities', 'ai-analysis', 'custom-rules', 'remediation'],
      includeCharts: true,
      includeAIInsights: true,
      includeRemediation: true
    },
    comprehensive: {
      name: 'Comprehensive Audit',
      description: 'Complete audit report with all details',
      sections: ['summary', 'vulnerabilities', 'ai-analysis', 'custom-rules', 'remediation', 'charts', 'appendix'],
      includeCharts: true,
      includeAIInsights: true,
      includeRemediation: true
    }
  }

  async generatePDF(scanResult: ScanResult, options: ExportOptions): Promise<Buffer> {
    const templateName = options.template || 'technical'
    const template = this.templates[templateName]
    const htmlContent = this.generateHTMLReport(scanResult, { ...options, template })
    
    try {
      // Use Puppeteer to generate PDF
      const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })
      const page = await browser.newPage()
      await page.setContent(htmlContent)
      const pdf = await page.pdf({ 
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
      })
      await browser.close()
      return Buffer.from(pdf)
    } catch (error) {
      console.error('PDF generation failed:', error)
      // Fallback to HTML content
      return Buffer.from(htmlContent, 'utf-8')
    }
  }

  async generateCSV(scanResult: ScanResult, options: ExportOptions): Promise<string> {
    const csvRows = [
      ['Vulnerability', 'Severity', 'Line', 'Tool', 'Description', 'Recommendation', 'AI Confidence', 'Risk Score']
    ]

    scanResult.vulnerabilities.forEach(vuln => {
      const aiAnalysis = scanResult.aiAnalysis?.find(ai => ai.vulnerabilityId === vuln.id)
      csvRows.push([
        vuln.title,
        vuln.severity,
        vuln.line?.toString() || 'N/A',
        vuln.tool || 'Unknown',
        vuln.description,
        options.includeRemediation ? (vuln.recommendation || 'N/A') : '',
        aiAnalysis?.confidence ? `${(aiAnalysis.confidence * 100).toFixed(1)}%` : 'N/A',
        aiAnalysis?.riskScore ? aiAnalysis.riskScore.toString() : 'N/A'
      ])
    })

    return csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
  }

  async generateJSON(scanResult: ScanResult, options: ExportOptions): Promise<string> {
    const exportData = {
      metadata: {
        scanId: scanResult.id,
        scanDate: scanResult.scanDate,
        contractAddress: scanResult.contractAddress,
        network: scanResult.network,
        exportOptions: options,
        exportTime: new Date().toISOString()
      },
      summary: scanResult.summary,
      vulnerabilities: scanResult.vulnerabilities.map(vuln => ({
        ...vuln,
        ...(options.includeRemediation && { recommendation: vuln.recommendation }),
        aiAnalysis: scanResult.aiAnalysis?.find(ai => ai.vulnerabilityId === vuln.id)
      })),
      aiAnalysis: options.includeAIInsights ? scanResult.aiAnalysis : undefined,
      customRules: options.includeCustomRules ? scanResult.customRules : undefined,
      tools: scanResult.tools,
      score: scanResult.score,
      totalTime: scanResult.totalTime
    }

    return JSON.stringify(exportData, null, 2)
  }

  async generateHTML(scanResult: ScanResult, options: ExportOptions): Promise<string> {
    const templateName = options.template || 'technical'
    const template = this.templates[templateName]
    return this.generateHTMLReport(scanResult, { ...options, template })
  }

  private generateHTMLReport(scanResult: ScanResult, options: ExportOptions & { template: ReportTemplate | undefined }): string {
    const { template } = options
    const severityColors = {
      critical: '#ef4444',
      high: '#f97316',
      medium: '#eab308',
      low: '#22c55e',
      info: '#3b82f6'
    }

    const severityCounts = this.calculateSeverityCounts(scanResult.vulnerabilities)
    const riskScore = scanResult.score || 0
    const riskLevel = this.getRiskLevel(riskScore)

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BlitzProof Security Audit - ${scanResult.contractAddress || scanResult.fileName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f8f9fa;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
          }
          .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 300;
          }
          .header p {
            font-size: 1.2em;
            opacity: 0.9;
          }
          .content {
            padding: 40px;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
          }
          .summary-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #667eea;
          }
          .summary-card h3 {
            font-size: 2em;
            color: #667eea;
            margin-bottom: 5px;
          }
          .summary-card p {
            color: #666;
            font-size: 0.9em;
          }
          .risk-score {
            background: ${this.getRiskColor(riskLevel)};
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 30px;
          }
          .risk-score h2 {
            font-size: 3em;
            margin-bottom: 10px;
          }
          .risk-score p {
            font-size: 1.2em;
            opacity: 0.9;
          }
          .section {
            margin-bottom: 40px;
          }
          .section h2 {
            color: #333;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .vulnerability {
            background: #f8f9fa;
            padding: 20px;
            margin-bottom: 15px;
            border-radius: 8px;
            border-left: 4px solid ${severityColors[scanResult.vulnerabilities[0]?.severity || 'info']};
          }
          .vulnerability h3 {
            color: #333;
            margin-bottom: 10px;
          }
          .severity-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            color: white;
            font-size: 0.8em;
            font-weight: bold;
            text-transform: uppercase;
          }
          .severity-critical { background: ${severityColors.critical}; }
          .severity-high { background: ${severityColors.high}; }
          .severity-medium { background: ${severityColors.medium}; }
          .severity-low { background: ${severityColors.low}; }
          .severity-info { background: ${severityColors.info}; }
          .ai-insight {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 8px;
            margin-top: 10px;
            border-left: 4px solid #2196f3;
          }
          .chart-container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 20px;
          }
          .chart {
            width: 100%;
            height: 300px;
            background: #f8f9fa;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #666;
          }
          .footer {
            background: #333;
            color: white;
            text-align: center;
            padding: 20px;
            margin-top: 40px;
          }
          @media print {
            body { background: white; }
            .container { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 BlitzProof Security Audit</h1>
            <p>${template.name} - ${scanResult.contractAddress || scanResult.fileName}</p>
            <p>Generated on ${new Date(scanResult.scanDate).toLocaleDateString()}</p>
          </div>

          <div class="content">
            ${template.sections.includes('summary') ? this.generateSummarySection(scanResult, severityCounts) : ''}
            
            ${template.sections.includes('risk-score') ? this.generateRiskScoreSection(riskScore, riskLevel) : ''}
            
            ${template.sections.includes('vulnerabilities') ? this.generateVulnerabilitiesSection(scanResult, options) : ''}
            
            ${template.sections.includes('ai-analysis') && options.includeAIInsights ? this.generateAIAnalysisSection(scanResult) : ''}
            
            ${template.sections.includes('custom-rules') && options.includeCustomRules ? this.generateCustomRulesSection(scanResult) : ''}
            
            ${template.sections.includes('remediation') && options.includeRemediation ? this.generateRemediationSection(scanResult) : ''}
            
            ${template.sections.includes('charts') && options.includeCharts ? this.generateChartsSection(scanResult) : ''}
          </div>

          <div class="footer">
            <p>Generated by BlitzProof Security Platform</p>
            <p>For questions or support, contact our security team</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  private calculateSeverityCounts(vulnerabilities: any[]): Record<string, number> {
    const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
    vulnerabilities.forEach(vuln => {
      counts[vuln.severity] = (counts[vuln.severity] || 0) + 1
    })
    return counts
  }

  private getRiskLevel(score: number): string {
    if (score >= 80) return 'low'
    if (score >= 60) return 'medium'
    if (score >= 40) return 'high'
    return 'critical'
  }

  private getRiskColor(level: string): string {
    switch (level) {
      case 'low': return '#22c55e'
      case 'medium': return '#eab308'
      case 'high': return '#f97316'
      case 'critical': return '#ef4444'
      default: return '#3b82f6'
    }
  }

  private generateSummarySection(scanResult: ScanResult, severityCounts: Record<string, number>): string {
    return `
      <div class="section">
        <h2>📊 Executive Summary</h2>
        <div class="summary-grid">
          <div class="summary-card">
            <h3>${scanResult.vulnerabilities.length}</h3>
            <p>Total Vulnerabilities</p>
          </div>
          <div class="summary-card">
            <h3>${severityCounts.critical + severityCounts.high}</h3>
            <p>Critical & High</p>
          </div>
          <div class="summary-card">
            <h3>${scanResult.tools?.length || 0}</h3>
            <p>Security Tools Used</p>
          </div>
          <div class="summary-card">
            <h3>${Math.round(scanResult.totalTime / 1000)}s</h3>
            <p>Scan Duration</p>
          </div>
        </div>
      </div>
    `
  }

  private generateRiskScoreSection(score: number, level: string): string {
    return `
      <div class="section">
        <h2>🎯 Risk Assessment</h2>
        <div class="risk-score">
          <h2>${score}/100</h2>
          <p>Security Score - ${level.toUpperCase()} Risk</p>
        </div>
      </div>
    `
  }

  private generateVulnerabilitiesSection(scanResult: ScanResult, options: ExportOptions): string {
    const vulnerabilities = scanResult.vulnerabilities.map(vuln => {
      const aiAnalysis = scanResult.aiAnalysis?.find(ai => ai.vulnerabilityId === vuln.id)
      return `
        <div class="vulnerability">
          <h3>${vuln.title}</h3>
          <span class="severity-badge severity-${vuln.severity}">${vuln.severity}</span>
          <p><strong>Line:</strong> ${vuln.line || 'N/A'}</p>
          <p><strong>Tool:</strong> ${vuln.tool || 'Unknown'}</p>
          <p><strong>Description:</strong> ${vuln.description}</p>
          ${options.includeRemediation && vuln.recommendation ? `<p><strong>Recommendation:</strong> ${vuln.recommendation}</p>` : ''}
          ${aiAnalysis ? `
            <div class="ai-insight">
              <p><strong>AI Analysis:</strong> ${aiAnalysis.description}</p>
              <p><strong>Confidence:</strong> ${(aiAnalysis.confidence * 100).toFixed(1)}%</p>
              <p><strong>Risk Score:</strong> ${aiAnalysis.riskScore}/100</p>
            </div>
          ` : ''}
        </div>
      `
    }).join('')

    return `
      <div class="section">
        <h2>🔍 Vulnerabilities Found</h2>
        ${vulnerabilities}
      </div>
    `
  }

  private generateAIAnalysisSection(scanResult: ScanResult): string {
    if (!scanResult.aiAnalysis || scanResult.aiAnalysis.length === 0) {
      return `
        <div class="section">
          <h2>🤖 AI Analysis</h2>
          <p>No AI analysis results available for this scan.</p>
        </div>
      `
    }

    const aiInsights = scanResult.aiAnalysis.map(ai => `
      <div class="ai-insight">
        <h3>AI Insight #${ai.id}</h3>
        <p><strong>Description:</strong> ${ai.description}</p>
        <p><strong>Confidence:</strong> ${(ai.confidence * 100).toFixed(1)}%</p>
        <p><strong>Risk Score:</strong> ${ai.riskScore}/100</p>
        ${ai.remediation ? `<p><strong>Smart Remediation:</strong> ${ai.remediation}</p>` : ''}
      </div>
    `).join('')

    return `
      <div class="section">
        <h2>🤖 AI Analysis</h2>
        ${aiInsights}
      </div>
    `
  }

  private generateCustomRulesSection(scanResult: ScanResult): string {
    if (!scanResult.customRules || scanResult.customRules.length === 0) {
      return `
        <div class="section">
          <h2>📋 Custom Rules</h2>
          <p>No custom rules were applied to this scan.</p>
        </div>
      `
    }

    const customRules = scanResult.customRules.map(rule => `
      <div class="vulnerability">
        <h3>${rule.ruleName}</h3>
        <span class="severity-badge severity-${rule.severity}">${rule.severity}</span>
        <p><strong>Category:</strong> ${rule.category}</p>
        <p><strong>Line:</strong> ${rule.line}</p>
        <p><strong>Description:</strong> ${rule.context}</p>
      </div>
    `).join('')

    return `
      <div class="section">
        <h2>📋 Custom Rules Results</h2>
        ${customRules}
      </div>
    `
  }

  private generateRemediationSection(scanResult: ScanResult): string {
    const remediations = scanResult.vulnerabilities
      .filter(vuln => vuln.recommendation)
      .map(vuln => `
        <div class="vulnerability">
          <h3>${vuln.title}</h3>
          <p><strong>Severity:</strong> ${vuln.severity}</p>
          <p><strong>Recommendation:</strong> ${vuln.recommendation}</p>
        </div>
      `).join('')

    return `
      <div class="section">
        <h2>🔧 Remediation Guide</h2>
        ${remediations || '<p>No specific remediation recommendations available.</p>'}
      </div>
    `
  }

  private generateChartsSection(scanResult: ScanResult): string {
    const severityCounts = this.calculateSeverityCounts(scanResult.vulnerabilities)
    
    return `
      <div class="section">
        <h2>📈 Analysis Charts</h2>
        <div class="chart-container">
          <h3>Vulnerability Distribution</h3>
          <div class="chart">
            <div style="text-align: center;">
              <h4>Severity Breakdown</h4>
              <p>Critical: ${severityCounts.critical}</p>
              <p>High: ${severityCounts.high}</p>
              <p>Medium: ${severityCounts.medium}</p>
              <p>Low: ${severityCounts.low}</p>
              <p>Info: ${severityCounts.info}</p>
            </div>
          </div>
        </div>
      </div>
    `
  }

  getAvailableTemplates(): ReportTemplate[] {
    return Object.values(this.templates)
  }

  getTemplate(name: string): ReportTemplate | null {
    return this.templates[name] || null
  }
}

export default new EnhancedExportService() 