import { Request, Response } from 'express';
import { ExportService } from '../services/exportService';
import pool from '../config/database';
import { ScanResult } from '../types/scan';

const exportService = new ExportService();

export const getScanResult = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM scans WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Scan not found' });
    const scan = result.rows[0];
    const vulnerabilities = scan.vulnerabilities || [];
    const scanResult: ScanResult = {
      id: scan.id,
      userId: scan.user_id,
      fileName: scan.file_name,
      contractAddress: scan.contract_address,
      network: scan.network,
      status: scan.status,
      scanDate: scan.created_at,
      vulnerabilities,
      summary: {
        totalVulnerabilities: vulnerabilities.length,
        criticalCount: vulnerabilities.filter((v: any) => v.severity === 'critical').length,
        highCount: vulnerabilities.filter((v: any) => v.severity === 'high').length,
        mediumCount: vulnerabilities.filter((v: any) => v.severity === 'medium').length,
        lowCount: vulnerabilities.filter((v: any) => v.severity === 'low').length,
        infoCount: vulnerabilities.filter((v: any) => v.severity === 'info').length,
      },
    };
    res.json(scanResult);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const exportPDF = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { includeDetails, includeRemediation } = req.query;
    const result = await pool.query('SELECT * FROM scans WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Scan not found' });
    const scan = result.rows[0];
    const scanResult: ScanResult = {
      id: scan.id,
      userId: scan.user_id,
      fileName: scan.file_name,
      contractAddress: scan.contract_address,
      network: scan.network,
      status: scan.status,
      scanDate: scan.created_at,
      vulnerabilities: scan.vulnerabilities || [],
    };
    const pdfBuffer = await exportService.generatePDF(scanResult, {
      format: 'pdf',
      includeDetails: includeDetails === 'true',
      includeRemediation: includeRemediation === 'true',
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=scan-${id}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const exportCSV = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { includeRemediation } = req.query;
    const result = await pool.query('SELECT * FROM scans WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Scan not found' });
    const scan = result.rows[0];
    const scanResult: ScanResult = {
      id: scan.id,
      userId: scan.user_id,
      fileName: scan.file_name,
      contractAddress: scan.contract_address,
      network: scan.network,
      status: scan.status,
      scanDate: scan.created_at,
      vulnerabilities: scan.vulnerabilities || [],
    };
    const csvContent = await exportService.generateCSV(scanResult, {
      format: 'csv',
      includeRemediation: includeRemediation === 'true',
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=scan-${id}.csv`);
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const exportJSON = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { includeDetails, includeRemediation } = req.query;
    const result = await pool.query('SELECT * FROM scans WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Scan not found' });
    const scan = result.rows[0];
    const scanResult: ScanResult = {
      id: scan.id,
      userId: scan.user_id,
      fileName: scan.file_name,
      contractAddress: scan.contract_address,
      network: scan.network,
      status: scan.status,
      scanDate: scan.created_at,
      vulnerabilities: scan.vulnerabilities || [],
    };
    const jsonContent = await exportService.generateJSON(scanResult, {
      format: 'json',
      includeDetails: includeDetails === 'true',
      includeRemediation: includeRemediation === 'true',
    });
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=scan-${id}.json`);
    res.send(jsonContent);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const generateShareableLink = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3002';
    const shareableLink = exportService.generateShareableLink(id, baseUrl);
    res.json({ shareableLink, scanId: id, message: 'Shareable link generated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}; 