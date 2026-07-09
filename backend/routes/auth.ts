import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import prisma from '../lib/prisma';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';

// Auto-generate Ethereal test account for dev emails
let transporter = nodemailer.createTransport({ jsonTransport: true });
nodemailer.createTestAccount().then(account => {
  transporter = nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: { user: account.user, pass: account.pass },
  });
  console.log('Nodemailer Ethereal test account created for testing emails.');
}).catch(() => {
  console.log('Failed to create Ethereal account, email sending disabled.');
});

// Register
router.post('/register', async (req, res) => {
  const { email, password, role, ...profileData } = req.body;
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, password: hashedPassword, role } });

    if (role === 'STUDENT') {
      await prisma.studentProfile.create({
        data: { userId: user.id, firstName: profileData.firstName, lastName: profileData.lastName }
      });
    } else if (role === 'ORGANIZATION') {
      await prisma.organizationProfile.create({
        data: { userId: user.id, companyName: profileData.companyName }
      });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.json({ message: 'If an account exists, a reset link was sent.' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000);
    await prisma.user.update({ where: { email }, data: { resetToken, resetTokenExpiry } });

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    // Render blocks outbound SMTP ports, so ethereal will hang. 
    // We log the link to the console so it can be copied during testing.
    console.log('\n----------------------------------------');
    console.log('PASSWORD RESET LINK (Copy this):');
    console.log(resetLink);
    console.log('----------------------------------------\n');

    try {
      // Try to send email, but timeout quickly to prevent hanging
      await Promise.race([
        transporter.sendMail({
          from: '"PathFinder Support" <noreply@pathfinder.com>',
          to: email,
          subject: 'Password Reset Request',
          text: `Reset your password: ${resetLink}`,
          html: `<p>Click to reset: <a href="${resetLink}">${resetLink}</a></p>`,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP timeout')), 5000))
      ]);
    } catch (e) {
      console.log('Note: Email sending skipped/timed out (expected on free Render tier). Use the link logged above.');
    }

    res.json({ message: 'If an account exists, a reset link was sent.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExpiry: { gt: new Date() } }
    });
    if (!user) return res.status(400).json({ error: 'Invalid or expired reset token' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, resetToken: null, resetTokenExpiry: null }
    });
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default router;
