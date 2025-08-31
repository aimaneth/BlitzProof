import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'
import { Vulnerability } from '../types/scan'
import scanService from './scanService'
import customRulesService from './customRulesService'
import aiAnalysisService from './aiAnalysisService'
import pool from '../config/postgres'

const execAsync = promisify(exec)

interface BatchScanConfig {
  maxConcurrentScans: number
  timeout: number
  tools: string[]
  aiAnalysis: boolean
  customRules: boolean
  severityThreshold: string
  outputFormat: 'json' | 'csv' | 'html'
  includeDetails: boolean
  parallelProcessing: boolean
}

interface BatchScanJob {
  id: string
  userId: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  totalFiles: number
  processedFiles: number
  failedFiles: number
  startTime: Date
  endTime?: Date
  results: BatchScanResult[]
  config: BatchScanConfig
  progress: number
  error?: string
}

interface BatchScanResult {
  fileName: string
  filePath: string
  status: 'success' | 'failed'
  vulnerabilities: Vulnerability[]
  aiAnalysis: any[]
  customRules: any[]
  scanTime: number
  error?: string
  summary: any
  riskScore: number
}

interface BatchScanSummary {
  totalFiles: number
  successfulScans: number
  failedScans: number
  totalVulnerabilities: number
  highSeverityCount: number
  mediumSeverityCount: number
  lowSeverityCount: number
  averageRiskScore: number
  totalScanTime: number
  toolsUsed: string[]
  recommendations: string[]
}

class BatchScanService {
  private readonly config: BatchScanConfig = {
    maxConcurrentScans: 5,
    timeout: 300,
    tools: ['slither', 'mythril', 'manticore', 'echidna'],
    aiAnalysis: true,
    customRules: true,
    severityThreshold: 'low',
    outputFormat: 'json',
    includeDetails: true,
    parallelProcessing: true
  }

  private activeJobs = new Map<string, BatchScanJob>()
  private jobQueue: string[] = []

  async startBatchScan(filePaths: string[], userId: number, config?: Partial<BatchScanConfig>): Promise<string> {
    const jobId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const batchConfig = { ...this.config, ...config }
    
    const job: BatchScanJob = {
      id: jobId,
      userId,
      status: 'pending',
      totalFiles: filePaths.length,
      processedFiles: 0,
      failedFiles: 0,
      startTime: new Date(),
      results: [],
      config: batchConfig,
      progress: 0
    }

    // Save job to database
    await this.saveJobToDatabase(job)
    
    // Add to queue
    this.jobQueue.push(jobId)
    this.activeJobs.set(jobId, job)
    
    // Start processing if not at capacity
    this.processQueue()
    
    return jobId
  }

  async getBatchScanStatus(jobId: string): Promise<BatchScanJob | null> {
    try {
      // Check active jobs first
      const activeJob = this.activeJobs.get(jobId)
      if (activeJob) {
        return activeJob
      }
      
      // Check database
      const result = await pool.query('SELECT * FROM batch_scan_jobs WHERE id = $1', [jobId])
      if (result.rows.length === 0) return null
      
      return this.mapDatabaseRowToJob(result.rows[0])
    } catch (error) {
      console.error('Error getting batch scan status:', error)
      return null
    }
  }

  async getBatchScanResults(jobId: string): Promise<BatchScanResult[]> {
    try {
      const result = await pool.query('SELECT results FROM batch_scan_jobs WHERE id = $1', [jobId])
      if (result.rows.length === 0) return []
      
      return result.rows[0].results || []
    } catch (error) {
      console.error('Error getting batch scan results:', error)
      return []
    }
  }

  async getBatchScanSummary(jobId: string): Promise<BatchScanSummary | null> {
    try {
      const results = await this.getBatchScanResults(jobId)
      if (results.length === 0) return null
      
      return this.generateSummary(results)
    } catch (error) {
      console.error('Error generating batch scan summary:', error)
      return null
    }
  }

  async cancelBatchScan(jobId: string, userId: number): Promise<boolean> {
    try {
      const job = this.activeJobs.get(jobId)
      if (!job || job.userId !== userId) {
        throw new Error('Job not found or access denied')
      }
      
      job.status = 'failed'
      job.error = 'Cancelled by user'
      job.endTime = new Date()
      
      // Remove from active jobs
      this.activeJobs.delete(jobId)
      
      // Update database
      await this.updateJobInDatabase(jobId, job)
      
      return true
    } catch (error) {
      console.error('Error cancelling batch scan:', error)
      return false
    }
  }

  async exportBatchResults(jobId: string, format: 'json' | 'csv' | 'html'): Promise<string> {
    try {
      const results = await this.getBatchScanResults(jobId)
      const summary = await this.getBatchScanSummary(jobId)
      
      switch (format) {
        case 'json':
          return this.exportToJSON(results, summary)
        case 'csv':
          return this.exportToCSV(results, summary)
        case 'html':
          return this.exportToHTML(results, summary)
        default:
          throw new Error('Unsupported export format')
      }
    } catch (error) {
      console.error('Error exporting batch results:', error)
      throw error
    }
  }

  private async processQueue(): Promise<void> {
    if (this.activeJobs.size >= this.config.maxConcurrentScans) {
      return
    }
    
    const nextJobId = this.jobQueue.shift()
    if (!nextJobId) return
    
    const job = this.activeJobs.get(nextJobId)
    if (!job) return
    
    // Start processing
    job.status = 'running'
    await this.updateJobInDatabase(nextJobId, job)
    
    this.processBatchJob(job).catch(error => {
      console.error('Error processing batch job:', error)
    })
  }

  private async processBatchJob(job: BatchScanJob): Promise<void> {
    try {
      const filePaths = await this.getJobFilePaths(job.id)
      
      if (job.config.parallelProcessing) {
        await this.processFilesParallel(job, filePaths)
      } else {
        await this.processFilesSequential(job, filePaths)
      }
      
      job.status = 'completed'
      job.endTime = new Date()
      job.progress = 100
      
      await this.updateJobInDatabase(job.id, job)
      this.activeJobs.delete(job.id)
      
      // Process next job in queue
      this.processQueue()
    } catch (error) {
      job.status = 'failed'
      job.error = error instanceof Error ? error.message : 'Unknown error'
      job.endTime = new Date()
      
      await this.updateJobInDatabase(job.id, job)
      this.activeJobs.delete(job.id)
      
      console.error('Batch job failed:', error)
      this.processQueue()
    }
  }

  private async processFilesParallel(job: BatchScanJob, filePaths: string[]): Promise<void> {
    const chunks = this.chunkArray(filePaths, Math.ceil(filePaths.length / job.config.maxConcurrentScans))
    
    for (const chunk of chunks) {
      const promises = chunk.map(filePath => this.scanSingleFile(job, filePath))
      const results = await Promise.allSettled(promises)
      
      for (const result of results) {
        if (result.status === 'fulfilled') {
          job.results.push(result.value)
          job.processedFiles++
        } else {
          job.failedFiles++
        }
        
        job.progress = Math.round((job.processedFiles + job.failedFiles) / job.totalFiles * 100)
        await this.updateJobInDatabase(job.id, job)
      }
    }
  }

  private async processFilesSequential(job: BatchScanJob, filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        const result = await this.scanSingleFile(job, filePath)
        job.results.push(result)
        job.processedFiles++
      } catch (error) {
        job.failedFiles++
        console.error(`Failed to scan ${filePath}:`, error)
      }
      
      job.progress = Math.round((job.processedFiles + job.failedFiles) / job.totalFiles * 100)
      await this.updateJobInDatabase(job.id, job)
    }
  }

  private async scanSingleFile(job: BatchScanJob, filePath: string): Promise<BatchScanResult> {
    const startTime = Date.now()
    const fileName = path.basename(filePath)
    
    try {
      // Run security tools
      const scanResult = await scanService.scanContract(filePath, {
        tools: job.config.tools,
        aiAnalysis: job.config.aiAnalysis,
        customRules: job.config.customRules,
        timeout: job.config.timeout,
        severityThreshold: job.config.severityThreshold
      })
      
      // Apply custom rules if enabled
      let customRulesResults: any[] = []
      if (job.config.customRules) {
        const contractCode = fs.readFileSync(filePath, 'utf-8')
        customRulesResults = await customRulesService.applyCustomRules(contractCode, job.userId)
      }
      
      const scanTime = Date.now() - startTime
      
      return {
        fileName,
        filePath,
        status: 'success',
        vulnerabilities: scanResult.vulnerabilities,
        aiAnalysis: scanResult.aiAnalysis || [],
        customRules: customRulesResults,
        scanTime,
        summary: scanResult.summary,
        riskScore: scanResult.score
      }
    } catch (error) {
      const scanTime = Date.now() - startTime
      
      return {
        fileName,
        filePath,
        status: 'failed',
        vulnerabilities: [],
        aiAnalysis: [],
        customRules: [],
        scanTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        summary: {},
        riskScore: 0
      }
    }
  }

  private generateSummary(results: BatchScanResult[]): BatchScanSummary {
    const successfulScans = results.filter(r => r.status === 'success')
    const failedScans = results.filter(r => r.status === 'failed')
    
    const allVulnerabilities = successfulScans.flatMap(r => r.vulnerabilities)
    const highSeverityCount = allVulnerabilities.filter(v => v.severity === 'high').length
    const mediumSeverityCount = allVulnerabilities.filter(v => v.severity === 'medium').length
    const lowSeverityCount = allVulnerabilities.filter(v => v.severity === 'low').length
    
    const totalScanTime = results.reduce((sum, r) => sum + r.scanTime, 0)
    const averageRiskScore = successfulScans.length > 0 
      ? successfulScans.reduce((sum, r) => sum + r.riskScore, 0) / successfulScans.length 
      : 0
    
    const recommendations = this.generateRecommendations(allVulnerabilities)
    
    return {
      totalFiles: results.length,
      successfulScans: successfulScans.length,
      failedScans: failedScans.length,
      totalVulnerabilities: allVulnerabilities.length,
      highSeverityCount,
      mediumSeverityCount,
      lowSeverityCount,
      averageRiskScore,
      totalScanTime,
      toolsUsed: this.config.tools,
      recommendations
    }
  }

  private generateRecommendations(vulnerabilities: Vulnerability[]): string[] {
    const recommendations = []
    
    const highSeverityCount = vulnerabilities.filter(v => v.severity === 'high').length
    if (highSeverityCount > 0) {
      recommendations.push(`Address ${highSeverityCount} high-severity vulnerabilities immediately`)
    }
    
    const reentrancyCount = vulnerabilities.filter(v => v.category === 'reentrancy').length
    if (reentrancyCount > 0) {
      recommendations.push('Implement comprehensive reentrancy protection')
    }
    
    const overflowCount = vulnerabilities.filter(v => v.category === 'arithmetic').length
    if (overflowCount > 0) {
      recommendations.push('Use SafeMath or upgrade to Solidity 0.8+ for arithmetic operations')
    }
    
    recommendations.push('Conduct thorough security audit before deployment')
    recommendations.push('Implement automated security testing in CI/CD pipeline')
    
    return recommendations
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  private exportToJSON(results: BatchScanResult[], summary: BatchScanSummary | null): string {
    return JSON.stringify({
      summary,
      results,
      exportTime: new Date().toISOString(),
      format: 'json'
    }, null, 2)
  }

  private exportToCSV(results: BatchScanResult[], summary: BatchScanSummary | null): string {
    let csv = 'FileName,Status,VulnerabilityCount,HighSeverity,MediumSeverity,LowSeverity,RiskScore,ScanTime,Error\n'
    
    results.forEach(result => {
      const highCount = result.vulnerabilities.filter(v => v.severity === 'high').length
      const mediumCount = result.vulnerabilities.filter(v => v.severity === 'medium').length
      const lowCount = result.vulnerabilities.filter(v => v.severity === 'low').length
      
      csv += `"${result.fileName}","${result.status}",${result.vulnerabilities.length},${highCount},${mediumCount},${lowCount},${result.riskScore},${result.scanTime},"${result.error || ''}"\n`
    })
    
    return csv
  }

  private exportToHTML(results: BatchScanResult[], summary: BatchScanSummary | null): string {
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Batch Scan Results</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          .result { border: 1px solid #ddd; margin: 10px 0; padding: 10px; border-radius: 5px; }
          .success { border-left: 4px solid #4CAF50; }
          .failed { border-left: 4px solid #f44336; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Batch Scan Results</h1>
        <div class="summary">
          <h2>Summary</h2>
          <p>Total Files: ${summary?.totalFiles}</p>
          <p>Successful Scans: ${summary?.successfulScans}</p>
          <p>Failed Scans: ${summary?.failedScans}</p>
          <p>Total Vulnerabilities: ${summary?.totalVulnerabilities}</p>
          <p>Average Risk Score: ${summary?.averageRiskScore.toFixed(2)}</p>
        </div>
        <h2>Results</h2>
    `
    
    results.forEach(result => {
      const statusClass = result.status === 'success' ? 'success' : 'failed'
      html += `
        <div class="result ${statusClass}">
          <h3>${result.fileName}</h3>
          <p>Status: ${result.status}</p>
          <p>Vulnerabilities: ${result.vulnerabilities.length}</p>
          <p>Risk Score: ${result.riskScore}</p>
          <p>Scan Time: ${result.scanTime}ms</p>
          ${result.error ? `<p>Error: ${result.error}</p>` : ''}
        </div>
      `
    })
    
    html += `
      </body>
      </html>
    `
    
    return html
  }

  // Database operations
  private async saveJobToDatabase(job: BatchScanJob): Promise<void> {
    await pool.query(
      `INSERT INTO batch_scan_jobs (
        id, user_id, status, total_files, processed_files, failed_files,
        start_time, end_time, results, config, progress, error
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        job.id, job.userId, job.status, job.totalFiles, job.processedFiles,
        job.failedFiles, job.startTime, job.endTime, JSON.stringify(job.results),
        JSON.stringify(job.config), job.progress, job.error
      ]
    )
  }

  private async updateJobInDatabase(jobId: string, job: BatchScanJob): Promise<void> {
    await pool.query(
      `UPDATE batch_scan_jobs SET 
        status = $1, processed_files = $2, failed_files = $3, end_time = $4,
        results = $5, progress = $6, error = $7
       WHERE id = $8`,
      [
        job.status, job.processedFiles, job.failedFiles, job.endTime,
        JSON.stringify(job.results), job.progress, job.error, jobId
      ]
    )
  }

  private async getJobFilePaths(jobId: string): Promise<string[]> {
    // This would typically be stored in the database
    // For now, return empty array - implement based on your file storage
    return []
  }

  private mapDatabaseRowToJob(row: any): BatchScanJob {
    return {
      id: row.id,
      userId: row.user_id,
      status: row.status,
      totalFiles: row.total_files,
      processedFiles: row.processed_files,
      failedFiles: row.failed_files,
      startTime: new Date(row.start_time),
      endTime: row.end_time ? new Date(row.end_time) : undefined,
      results: row.results ? JSON.parse(row.results) : [],
      config: row.config ? JSON.parse(row.config) : this.config,
      progress: row.progress,
      error: row.error
    }
  }

  // Configuration management
  async updateConfig(config: Partial<BatchScanConfig>): Promise<void> {
    Object.assign(this.config, config)
  }

  async getConfig(): Promise<BatchScanConfig> {
    return { ...this.config }
  }

  // Job management
  async getUserJobs(userId: number): Promise<BatchScanJob[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM batch_scan_jobs WHERE user_id = $1 ORDER BY start_time DESC',
        [userId]
      )
      return result.rows.map(row => this.mapDatabaseRowToJob(row))
    } catch (error) {
      console.error('Error fetching user jobs:', error)
      return []
    }
  }

  async cleanupOldJobs(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)
      
      const result = await pool.query(
        'DELETE FROM batch_scan_jobs WHERE start_time < $1 AND status IN ($2, $3)',
        [cutoffDate, 'completed', 'failed']
      )
      
      return result.rowCount || 0
    } catch (error) {
      console.error('Error cleaning up old jobs:', error)
      return 0
    }
  }
}

export default new BatchScanService() 