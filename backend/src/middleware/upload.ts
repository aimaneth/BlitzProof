import multer from 'multer'
import path from 'path'
import fs from 'fs'

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads')
const tokenLogosDir = path.join(uploadsDir, 'token-logos')

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

if (!fs.existsSync(tokenLogosDir)) {
  fs.mkdirSync(tokenLogosDir, { recursive: true })
}

// Configure multer for token logo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tokenLogosDir)
  },
  filename: (req, file, cb) => {
    // Use tokenId as filename to ensure consistent naming
    const tokenId = req.body.tokenId || 'unknown'
    const ext = path.extname(file.originalname)
    const filename = `${tokenId}${ext}`
    cb(null, filename)
  }
})

// File filter for images only
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp']
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only image files are allowed'))
  }
}

// Configure multer
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
    files: 1
  }
}) 