export interface Vulnerability {
  id: number;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  description: string;
  line?: number;
  recommendation?: string;
  file?: string;
  category?: string;
  tool?: string;
}

export interface ScanResult {
  id: string;
  userId: string;
  fileName?: string;
  contractAddress?: string;
  network: string;
  status: 'pending' | 'scanning' | 'completed' | 'failed';
  scanDate: Date;
  vulnerabilities: Vulnerability[];
  summary?: {
    totalVulnerabilities: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    infoCount: number;
  };
} 