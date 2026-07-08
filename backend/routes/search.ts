import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate, type AuthRequest } from '../middleware/auth';

const router = Router();

// Global Search
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const q = (req.query.q as string || '').trim();
    if (!q) return res.json({ opportunities: [], organizations: [] });

    const opportunities = await prisma.opportunity.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
          { category: { contains: q } },
        ]
      },
      include: { organization: { select: { companyName: true, logoUrl: true } } },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    const organizations = await prisma.organizationProfile.findMany({
      where: {
        OR: [
          { companyName: { contains: q } },
          { industry: { contains: q } },
          { description: { contains: q } },
        ]
      },
      take: 10,
      orderBy: { companyName: 'asc' }
    });

    res.json({ opportunities, organizations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Saved Searches
router.post('/saved', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, query } = req.body;
    const saved = await prisma.savedSearch.create({
      data: { userId: req.user!.userId, name, query: JSON.stringify(query) }
    });
    res.json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save search' });
  }
});

router.get('/saved', authenticate, async (req: AuthRequest, res) => {
  try {
    const saved = await prisma.savedSearch.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch saved searches' });
  }
});

router.delete('/saved/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    await prisma.savedSearch.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Saved search deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete saved search' });
  }
});

export default router;
