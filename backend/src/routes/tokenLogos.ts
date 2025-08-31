import express from 'express';
import axios from 'axios';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pool from '../config/postgres';

const router = express.Router();

// Add body parsing middleware for form data
router.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/token-logos');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // For now, use a timestamp-based filename and we'll rename it later
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `temp-${timestamp}${ext}`;
    
    console.log(`📁 Saving logo as temporary file: ${filename}`);
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Upload token logo
router.post('/', upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const { tokenId, symbol, name } = req.body;
    
    if (!tokenId) {
      return res.status(400).json({ success: false, error: 'Token ID is required' });
    }

    // Rename the file to use the correct tokenId
    const uploadDir = path.join(__dirname, '../../uploads/token-logos');
    const tempPath = req.file.path;
    const ext = path.extname(req.file.originalname);
    const newFilename = `${tokenId}${ext}`;
    const newPath = path.join(uploadDir, newFilename);
    
    // Rename the file
    fs.renameSync(tempPath, newPath);
    
    const logoUrl = `/uploads/token-logos/${newFilename}`;
    
    console.log(`✅ Logo uploaded for token ${tokenId}: ${logoUrl}`);
    console.log(`📁 File renamed from ${req.file.filename} to ${newFilename}`);
    
    // 🆕 SAVE TO DATABASE
    try {
      // Check if logo already exists for this token
      const existingLogo = await pool.query(
        'SELECT id FROM token_logos WHERE token_id = $1',
        [tokenId]
      );

      if (existingLogo.rows.length > 0) {
        // Update existing logo
        await pool.query(
          'UPDATE token_logos SET symbol = $1, name = $2, logo_url = $3, updated_at = NOW() WHERE token_id = $4',
          [symbol || null, name || null, logoUrl, tokenId]
        );
        console.log(`🔄 Updated existing logo record for token ${tokenId}`);
      } else {
        // Insert new logo
        await pool.query(
          'INSERT INTO token_logos (token_id, symbol, name, logo_url, created_at) VALUES ($1, $2, $3, $4, NOW())',
          [tokenId, symbol || null, name || null, logoUrl]
        );
        console.log(`➕ Created new logo record for token ${tokenId}`);
      }
    } catch (dbError) {
      console.error('❌ Database error saving logo:', dbError);
      // Continue with file upload even if database fails
    }
    
    res.json({
      success: true,
      message: 'Logo uploaded successfully',
      logoUrl,
      tokenId,
      symbol,
      name
    });
  } catch (error) {
    console.error('❌ Logo upload error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to upload logo',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get token logo by token ID
router.get('/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;
    
    if (!tokenId) {
      return res.status(400).json({ success: false, error: 'Token ID is required' });
    }

    // 🆕 FIRST TRY DATABASE
    try {
      const result = await pool.query(
        'SELECT token_id, symbol, name, logo_url FROM token_logos WHERE token_id = $1',
        [tokenId]
      );

      if (result.rows.length > 0) {
        const logoData = result.rows[0];
        console.log(`✅ Found logo in database for ${tokenId}: ${logoData.logo_url}`);
        return res.json({
          success: true,
          logoUrl: logoData.logo_url,
          tokenId: logoData.token_id,
          symbol: logoData.symbol,
          name: logoData.name
        });
      }
    } catch (dbError) {
      console.warn('⚠️ Database query failed, falling back to file system:', dbError);
    }

    // 🆕 FALLBACK TO FILE SYSTEM
    const uploadDir = path.join(__dirname, '../../uploads/token-logos');
    const possibleExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg'];
    
    let logoPath = null;
    let logoUrl = null;
    
    // Check for uploaded logo with different extensions
    for (const ext of possibleExtensions) {
      const testPath = path.join(uploadDir, `${tokenId}${ext}`);
      if (fs.existsSync(testPath)) {
        logoPath = testPath;
        logoUrl = `/uploads/token-logos/${tokenId}${ext}`;
        console.log(`✅ Found logo file for ${tokenId}: ${logoUrl}`);
        break;
      }
    }
    
    if (logoPath) {
      res.json({
        success: true,
        logoUrl,
        tokenId
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Logo not found',
        tokenId
      });
    }
  } catch (error) {
    console.error('❌ Logo get error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get logo',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all token logos
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, token_id, symbol, name, logo_url, created_at
      FROM token_logos
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      tokens: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching token logos:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch token logos'
    });
  }
});

// Remove a token logo
router.delete('/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;

    // Get logo info before deletion
    const logoResult = await pool.query(
      'SELECT logo_url FROM token_logos WHERE token_id = $1',
      [tokenId]
    );

    if (logoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Logo not found'
      });
    }

    // Delete from database
    await pool.query(
      'DELETE FROM token_logos WHERE token_id = $1',
      [tokenId]
    );

    // Delete file from filesystem
    const logoUrl = logoResult.rows[0].logo_url;
    const filePath = path.join(__dirname, '../../', logoUrl);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Deleted logo file: ${filePath}`);
    }

    res.json({
      success: true,
      message: 'Logo removed successfully',
      tokenId
    });
  } catch (error) {
    console.error('Error removing token logo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove logo'
    });
  }
});

// Serve uploaded logo files
router.get('/uploads/token-logos/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../uploads/token-logos', filename);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ success: false, error: 'Logo file not found' });
    }
  } catch (error) {
    console.error('❌ Logo file serve error:', error);
    res.status(500).json({ success: false, error: 'Failed to serve logo file' });
  }
});

// Proxy endpoint to fetch token logos from external APIs
router.get('/proxy/:provider/:tokenId', async (req, res) => {
  try {
    const { provider, tokenId } = req.params;
    const { symbol, address } = req.query;

    let logoUrl = '';

    switch (provider) {
      case 'coingecko':
        // CoinGecko logo URL
        const coinGeckoImageIds: { [key: string]: string } = {
          'bitcoin': '1', 'btc': '1', 'ethereum': '279', 'eth': '279',
          'tether': '325', 'usdt': '325', 'binancecoin': '825', 'bnb': '825',
          'solana': '4128', 'sol': '4128', 'usd-coin': '3408', 'usdc': '3408',
          'cardano': '975', 'ada': '975', 'avalanche-2': '5805', 'avax': '5805',
          'dogecoin': '5', 'doge': '5', 'polkadot': '6636', 'dot': '6636',
          'polygon': '3890', 'matic': '3890', 'chainlink': '197', 'link': '197',
          'tron': '1958', 'trx': '1958', 'bitcoin-cash': '1831', 'bch': '1831',
          'near': '6535', 'litecoin': '2', 'ltc': '2', 'uniswap': '12504', 'uni': '12504',
          'cosmos': '3794', 'atom': '3794', 'ethereum-classic': '1321', 'etc': '1321',
          'stellar': '100', 'xlm': '100', 'monero': '502', 'xmr': '502',
          'algorand': '4030', 'algo': '4030', 'vechain': '1160', 'vet': '1160',
          'filecoin': '2280', 'fil': '2280', 'internet-computer': '8916', 'icp': '8916',
          'theta-token': '2416', 'theta': '2416', 'xrp': '44', 'fantom': '3513', 'ftm': '3513',
          'decentraland': '1966', 'mana': '1966', 'the-sandbox': '6210', 'sand': '6210',
          'axie-infinity': '6783', 'axs': '6783', 'aave': '7278', 'eos': '1765',
          'tezos': '2011', 'xtz': '2011', 'klaytn': '4256', 'klay': '4256',
          'flow': '4558', 'helium': '5665', 'hnt': '5665', 'iota': '1720', 'miota': '1720',
          'neo': '1376', 'kusama': '5034', 'ksm': '5034', 'harmony': '3945', 'one': '3945',
          'waves': '1274', 'dash': '131', 'zilliqa': '2469', 'zil': '2469',
          'chiliz': '4066', 'chz': '4066', 'enjin-coin': '2130', 'enj': '2130',
          'quant-network': '3155', 'qnt': '3155', 'pancakeswap-token': '7192', 'cake': '7192',
          'compound-governance-token': '5692', 'comp': '5692', 'synthetix-network-token': '2586', 'snx': '2586',
          'maker': '1518', 'mkr': '1518', 'dai': '4943', 'havven': '2586',
          'yearn-finance': '5864', 'yfi': '5864', 'curve-dao-token': '6538', 'crv': '6538',
          'sushi': '6758', '1inch': '8104', 'wrapped-bitcoin': '1', 'wbtc': '1',
          'weth': '279', 'blox-myrc': 'custom'
        };
        const imageId = coinGeckoImageIds[tokenId.toLowerCase()] || '1';
        logoUrl = `https://coin-images.coingecko.com/coins/images/${imageId}/thumb/${tokenId.toLowerCase()}.png`;
        break;

      case 'trustwallet':
        // TrustWallet logo URL - only for valid contract addresses
        if (address && typeof address === 'string' && address.startsWith('0x') && address.length === 42) {
          logoUrl = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`;
        } else {
          return res.status(404).json({ success: false, error: 'Invalid contract address for TrustWallet' });
        }
        break;

      case 'tokenicons':
        // TokenIcons logo URL
        if (symbol && typeof symbol === 'string') {
          logoUrl = `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${symbol.toLowerCase()}.png`;
        } else {
          return res.status(404).json({ success: false, error: 'Symbol required for TokenIcons' });
        }
        break;

      default:
        return res.status(400).json({ success: false, error: 'Invalid provider' });
    }

    // Fetch the image from the external URL
    const response = await axios.get(logoUrl, {
      responseType: 'arraybuffer',
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    // Set appropriate headers
    res.set('Content-Type', response.headers['content-type'] || 'image/png');
    res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    // Send the image data
    res.send(response.data);

  } catch (error) {
    console.error(`❌ Logo proxy error for ${req.params.provider}/${req.params.tokenId}:`, error);
    res.status(404).json({ 
      success: false, 
      error: 'Logo not found or failed to fetch',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
