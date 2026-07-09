import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { authenticate, type AuthRequest } from './middleware/auth';

// Route modules
import authRoutes from './routes/auth';
import studentRoutes from './routes/student';
import organizationRoutes from './routes/organization';
import opportunityRoutes from './routes/opportunities';
import applicationRoutes from './routes/applications';
import aiRoutes from './routes/ai';
import searchRoutes from './routes/search';
import notificationRoutes from './routes/notifications';
import adminRoutes from './routes/admin';
import statsRoutes from './routes/stats';
import ticketRoutes from './routes/tickets';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure static folder for uploads (removed direct express.static access)
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Apply rate limiting to auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/auth', authLimiter);

// File upload endpoint
app.post('/api/upload', authenticate, upload.single('file'), (req: AuthRequest, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const fileUrl = `http://localhost:5000/api/files/${req.file.filename}`;
  res.json({ url: fileUrl, filename: req.file.filename });
});

// Secure file access endpoint
app.get('/api/files/:filename', (req, res, next) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadDir, filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  // If it's an image (logo), allow public access. If document (resume), require auth.
  const ext = path.extname(filename).toLowerCase();
  if (['.png', '.jpg', '.jpeg'].includes(ext)) {
    return res.sendFile(filePath);
  } else {
    // Manually run authenticate middleware for documents
    authenticate(req as AuthRequest, res, () => {
      res.sendFile(filePath);
    });
  }
});

// Mount route modules
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/org', organizationRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/tickets', ticketRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
