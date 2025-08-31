import express from 'express';
import {
  getAllTokens,
  getAllTokensWithPrice,
  getTokenByUniqueId,
  getTokenWithPrice,
  addToken,
  updateToken,
  deleteToken
} from '../controllers/simpleTokenController';

const router = express.Router();

// Add JSON parsing middleware for this route
router.use(express.json({ limit: '10mb' }));

// Get all tokens
router.get('/', getAllTokens);

// Get all tokens with price data
router.get('/with-price', getAllTokensWithPrice);

// Get token by unique ID
router.get('/:uniqueId', getTokenByUniqueId);

// Get token with price data
router.get('/:uniqueId/price', getTokenWithPrice);

// Add new token
router.post('/', addToken);

// Update token
router.put('/:uniqueId', updateToken);

// Delete token
router.delete('/:uniqueId', deleteToken);

export default router;
