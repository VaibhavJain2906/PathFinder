import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireRole, type AuthRequest } from '../middleware/auth';

const router = Router();

// Get Organization Profile
router.get('/profile', authenticate, requireRole('ORGANIZATION'), async (req: AuthRequest, res) => {
  try {
    const profile = await prisma.organizationProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!profile) return res.status(404).json({ error: 'Organization profile not found' });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch org profile' });
  }
});

// Update Organization Profile
router.put('/profile', authenticate, requireRole('ORGANIZATION'), async (req: AuthRequest, res) => {
  try {
    const { companyName, description, website, industry, logoUrl } = req.body;
    const profile = await prisma.organizationProfile.update({
      where: { userId: req.user!.userId },
      data: { companyName, description, website, industry, logoUrl }
    });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update org profile' });
  }
});

export default router;
