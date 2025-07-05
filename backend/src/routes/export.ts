import express, { RequestHandler } from 'express';
import { 
  getScanResult, 
  exportPDF, 
  exportCSV, 
  exportJSON, 
  exportEnhancedPDF,
  exportEnhancedHTML,
  exportEnhancedCSV,
  getExportTemplates,
  generateShareableLink 
} from '../controllers/exportController';

const router = express.Router();

router.get('/scan/:id', getScanResult as RequestHandler);
router.get('/export/:id/pdf', exportPDF as RequestHandler);
router.get('/export/:id/csv', exportCSV as RequestHandler);
router.get('/export/:id/json', exportJSON as RequestHandler);

// Enhanced export routes
router.get('/enhanced/:id/pdf', exportEnhancedPDF as RequestHandler);
router.get('/enhanced/:id/html', exportEnhancedHTML as RequestHandler);
router.get('/enhanced/:id/csv', exportEnhancedCSV as RequestHandler);
router.get('/templates', getExportTemplates as RequestHandler);

router.get('/share/:id', generateShareableLink as RequestHandler);

export default router; 