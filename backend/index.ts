import express from 'express';
import cors from 'cors';
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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure static folder for uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static(uploadDir));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json());

// File upload endpoint
app.post('/api/upload', authenticate, upload.single('file'), (req: AuthRequest, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;
  res.json({ url: fileUrl, filename: req.file.filename });
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
