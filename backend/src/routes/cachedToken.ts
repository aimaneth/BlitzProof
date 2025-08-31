import { Router } from 'express';
import { CachedTokenController } from '../controllers/cachedTokenController';

const router = Router();

// Database-first endpoints (instant response)
router.get('/dashboard', CachedTokenController.getCachedDashboard);
router.get('/token/:tokenId', CachedTokenController.getCachedToken);

// Force refresh endpoints
router.post('/refresh/:tokenId', CachedTokenController.forceRefreshToken);
router.get('/refresh/status', CachedTokenController.getRefreshStatus);

// Admin endpoints
router.post('/initialize', CachedTokenController.initializeCache);

export default router;
