import multer from 'multer'
import path from 'path'
import fs from 'fs'

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  console.log('🔍 File upload attempt:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    fieldname: file.fieldname
  })
  
  // Only allow .sol files
  if (file.mimetype === 'text/plain' || file.originalname.endsWith('.sol')) {
    console.log('✅ File accepted:', file.originalname)
    cb(null, true)
  } else {
    console.log('❌ File rejected:', file.originalname, 'mimetype:', file.mimetype)
    cb(new Error('Only .sol files are allowed'))
  }
}

// Add error handling to multer
const multerErrorHandler = (err: any, req: any, res: any, next: any) => {
  console.log('❌ Multer error:', err)
  if (err instanceof multer.MulterError) {
    console.log('📋 Multer error code:', err.code)
    console.log('📋 Multer error field:', err.field)
    console.log('📋 Multer error message:', err.message)
  }
  next(err)
}

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
}) 