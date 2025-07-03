import { ScanResult } from '../types/scan';

export interface ExportOptions {
  format: 'pdf' | 'csv' | 'json';
  includeDetails?: boolean;
  includeRemediation?: boolean;
}

export class ExportService {
  async generatePDF(scanResult: ScanResult, options: ExportOptions): Promise<Buffer> {
    // Mock PDF content for now
    const pdfContent = this.generatePDFContent(scanResult, options);
    return Buffer.from(pdfContent, 'utf-8');
  }

  async generateCSV(scanResult: ScanResult, options: ExportOptions): Promise<string> {
    const csvRows = [
      ['Vulnerability', 'Severity', 'Line', 'Description', 'Recommendation'],
    ];
    scanResult.vulnerabilities.forEach(vuln => {
      csvRows.push([
        vuln.title,
        vuln.severity,
        vuln.line?.toString() || 'N/A',
        vuln.description,
        options.includeRemediation ? (vuln.recommendation || 'N/A') : ''
      ]);
    });
    return csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }

  async generateJSON(scanResult: ScanResult, options: ExportOptions): Promise<string> {
    const exportData = {
      ...scanResult,
      vulnerabilities: scanResult.vulnerabilities.map(vuln => ({
        ...vuln,
        ...(options.includeRemediation && { recommendation: vuln.recommendation }),
      })),
    };
    return JSON.stringify(exportData, null, 2);
  }

  generateShareableLink(scanId: string, baseUrl: string): string {
    return `${baseUrl}/scan/${scanId}`;
  }

  private generatePDFContent(scanResult: ScanResult, options: ExportOptions): string {
    return `BlitzProof Security Scan Report\nScan ID: ${scanResult.id}\nContract: ${scanResult.contractAddress || scanResult.fileName}\nNetwork: ${scanResult.network}\nDate: ${new Date(scanResult.scanDate).toLocaleString()}\n\nSummary:\n- Total Vulnerabilities: ${scanResult.vulnerabilities.length}\n- Critical: ${scanResult.vulnerabilities.filter(v => v.severity === 'critical').length}\n- High: ${scanResult.vulnerabilities.filter(v => v.severity === 'high').length}\n- Medium: ${scanResult.vulnerabilities.filter(v => v.severity === 'medium').length}\n- Low: ${scanResult.vulnerabilities.filter(v => v.severity === 'low').length}\n- Info: ${scanResult.vulnerabilities.filter(v => v.severity === 'info').length}\n\nVulnerabilities:\n${scanResult.vulnerabilities.map(vuln => `\n${vuln.severity.toUpperCase()}: ${vuln.title}\nLine: ${vuln.line || 'N/A'}\nDescription: ${vuln.description}\n${options.includeRemediation && vuln.recommendation ? `Recommendation: ${vuln.recommendation}` : ''}\n`).join('')}`;
  }
} 