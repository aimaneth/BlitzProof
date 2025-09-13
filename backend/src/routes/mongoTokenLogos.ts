import express from 'express';
import axios from 'axios';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getMongoDB } from '../config/mongodb';

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

// Get token logo by token ID
router.get('/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;
    console.log(`🔍 Looking for logo for token: ${tokenId}`);

    const db = await getMongoDB();
    if (!db) {
      console.error('❌ MongoDB not connected');
      return res.status(500).json({ error: 'Database not connected' });
    }

    // First, try to find uploaded logo in MongoDB
    const tokenLogo = await db.collection('token_logos').findOne({ tokenId });
    
    if (tokenLogo && tokenLogo.logoPath) {
      const logoPath = path.join(__dirname, '../../uploads/token-logos', tokenLogo.logoPath);
      
      if (fs.existsSync(logoPath)) {
        console.log(`✅ Found uploaded logo for ${tokenId}: ${tokenLogo.logoPath}`);
        return res.sendFile(logoPath);
      } else {
        console.log(`⚠️ Logo file not found on disk: ${logoPath}`);
      }
    }

    // If no uploaded logo, try to get from external sources
    console.log(`🔄 No uploaded logo found for ${tokenId}, trying external sources...`);
    
    // Try CoinGecko first
    try {
      const coingeckoUrl = `https://assets.coingecko.com/coins/images/1/large/bitcoin.png`;
      const response = await axios.get(coingeckoUrl, { 
        responseType: 'stream',
        timeout: 5000 
      });
      
      if (response.status === 200) {
        console.log(`✅ Found logo from CoinGecko for ${tokenId}`);
        res.set('Content-Type', response.headers['content-type']);
        (response.data as any).pipe(res);
        return;
      }
    } catch (coingeckoError) {
      console.log(`⚠️ CoinGecko failed for ${tokenId}:`, (coingeckoError as Error).message);
    }

    // Try Trust Wallet
    try {
      const trustWalletUrl = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${tokenId}/logo.png`;
      const response = await axios.get(trustWalletUrl, { 
        responseType: 'stream',
        timeout: 5000 
      });
      
      if (response.status === 200) {
        console.log(`✅ Found logo from Trust Wallet for ${tokenId}`);
        res.set('Content-Type', response.headers['content-type']);
        (response.data as any).pipe(res);
        return;
      }
    } catch (trustWalletError) {
      console.log(`⚠️ Trust Wallet failed for ${tokenId}:`, (trustWalletError as Error).message);
    }

    // Try Token Icons
    try {
      const tokenIconsUrl = `https://raw.githubusercontent.com/coinwink/token-logos/main/logos/${tokenId}.png`;
      const response = await axios.get(tokenIconsUrl, { 
        responseType: 'stream',
        timeout: 5000 
      });
      
      if (response.status === 200) {
        console.log(`✅ Found logo from Token Icons for ${tokenId}`);
        res.set('Content-Type', response.headers['content-type']);
        (response.data as any).pipe(res);
        return;
      }
    } catch (tokenIconsError) {
      console.log(`⚠️ Token Icons failed for ${tokenId}:`, (tokenIconsError as Error).message);
    }

    // If all external sources fail, return a default logo or 404
    console.log(`❌ No logo found for ${tokenId} from any source`);
    res.status(404).json({ 
      error: 'Logo not found',
      tokenId,
      message: 'No logo available from uploaded files or external sources'
    });

  } catch (error) {
    console.error('❌ Error getting token logo:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Upload token logo
router.post('/upload/:tokenId', upload.single('logo'), async (req, res) => {
  try {
    const { tokenId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`📤 Uploading logo for token: ${tokenId}`);
    console.log(`📁 Temporary file: ${req.file.filename}`);

    const db = await getMongoDB();
    if (!db) {
      console.error('❌ MongoDB not connected');
      return res.status(500).json({ error: 'Database not connected' });
    }

    // Create final filename
    const ext = path.extname(req.file.originalname);
    const finalFilename = `${tokenId}${ext}`;
    const finalPath = path.join(__dirname, '../../uploads/token-logos', finalFilename);
    const tempPath = req.file.path;

    // Move file from temp to final location
    fs.renameSync(tempPath, finalPath);
    console.log(`✅ Logo saved as: ${finalFilename}`);

    // Save logo info to MongoDB
    await db.collection('token_logos').updateOne(
      { tokenId },
      { 
        $set: { 
          tokenId,
          logoPath: finalFilename,
          originalName: req.file.originalname,
          uploadedAt: new Date(),
          size: req.file.size
        }
      },
      { upsert: true }
    );

    console.log(`✅ Logo info saved to MongoDB for token: ${tokenId}`);

    res.json({
      success: true,
      message: 'Logo uploaded successfully',
      tokenId,
      filename: finalFilename,
      size: req.file.size
    });

  } catch (error) {
    console.error('❌ Error uploading logo:', error);
    
    // Clean up temp file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Upload failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Proxy endpoint for external logo sources
router.get('/proxy/:source/:tokenId', async (req, res) => {
  try {
    const { source, tokenId } = req.params;
    let logoUrl = '';

    switch (source) {
      case 'coingecko':
        logoUrl = `https://assets.coingecko.com/coins/images/1/large/bitcoin.png`;
        break;
      case 'trustwallet':
        logoUrl = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${tokenId}/logo.png`;
        break;
      case 'tokenicons':
        logoUrl = `https://raw.githubusercontent.com/coinwink/token-logos/main/logos/${tokenId}.png`;
        break;
      default:
        return res.status(400).json({ error: 'Invalid source' });
    }

    console.log(`🔄 Proxying logo request: ${source} for ${tokenId}`);
    
    const response = await axios.get(logoUrl, { 
      responseType: 'stream',
      timeout: 10000 
    });

    if (response.status === 200) {
      res.set('Content-Type', response.headers['content-type']);
      res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      (response.data as any).pipe(res);
    } else {
      res.status(404).json({ error: 'Logo not found' });
    }

  } catch (error) {
    console.error('❌ Error proxying logo:', error);
    res.status(500).json({ 
      error: 'Proxy failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all token logos
router.get('/', async (req, res) => {
  try {
    const db = await getMongoDB();
    if (!db) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    const logos = await db.collection('token_logos').find({}).toArray();
    
    res.json({
      success: true,
      logos: logos.map((logo: any) => ({
        tokenId: logo.tokenId,
        logoPath: logo.logoPath,
        uploadedAt: logo.uploadedAt,
        size: logo.size
      }))
    });

  } catch (error) {
    console.error('❌ Error getting token logos:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
