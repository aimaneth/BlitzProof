import express, { RequestHandler } from 'express';
import { getScanResult, exportPDF, exportCSV, exportJSON, generateShareableLink } from '../controllers/exportController';

const router = express.Router();

router.get('/scan/:id', getScanResult as RequestHandler);
router.get('/export/:id/pdf', exportPDF as RequestHandler);
router.get('/export/:id/csv', exportCSV as RequestHandler);
router.get('/export/:id/json', exportJSON as RequestHandler);
router.get('/share/:id', generateShareableLink as RequestHandler);

export default router; 