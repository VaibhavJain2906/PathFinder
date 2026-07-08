import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireRole, type AuthRequest } from '../middleware/auth';

const router = Router();

// Create Opportunity (Organizations only)
router.post('/', authenticate, requireRole('ORGANIZATION'), async (req: AuthRequest, res) => {
  try {
    const { title, description, category, deadline, eligibility, status, location, stipend, duration } = req.body;
    const orgProfile = await prisma.organizationProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!orgProfile) return res.status(404).json({ error: 'Organization profile not found' });

    const opportunity = await prisma.opportunity.create({
      data: {
        orgId: orgProfile.id, title, description, category,
        deadline: deadline ? new Date(deadline) : null,
        eligibility,
        status: status || 'PUBLISHED',
        location, stipend, duration,
      }
    });
    res.status(201).json(opportunity);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create opportunity' });
  }
});

// Update Opportunity
router.put('/:id', authenticate, requireRole('ORGANIZATION'), async (req: AuthRequest, res) => {
  try {
    const orgProfile = await prisma.organizationProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!orgProfile) return res.status(404).json({ error: 'Organization profile not found' });

    // Verify ownership
    const existing = await prisma.opportunity.findFirst({ where: { id: req.params.id as string, orgId: orgProfile.id } });
    if (!existing) return res.status(403).json({ error: 'Forbidden' });

    const { title, description, category, deadline, eligibility, status, isFeatured, location, stipend, duration } = req.body;
    const opportunity = await prisma.opportunity.update({
      where: { id: req.params.id as string },
      data: {
        title, description, category,
        deadline: deadline ? new Date(deadline) : null,
        eligibility, status, isFeatured, location, stipend, duration,
      }
    });
    res.json(opportunity);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update opportunity' });
  }
});

// Delete Opportunity
router.delete('/:id', authenticate, requireRole('ORGANIZATION'), async (req: AuthRequest, res) => {
  try {
    const orgProfile = await prisma.organizationProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!orgProfile) return res.status(404).json({ error: 'Organization profile not found' });

    // Verify ownership
    const existing = await prisma.opportunity.findFirst({ where: { id: req.params.id as string, orgId: orgProfile.id } });
    if (!existing) return res.status(403).json({ error: 'Forbidden' });

    await prisma.opportunity.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Opportunity deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete opportunity' });
  }
});

// Duplicate Opportunity
router.post('/:id/duplicate', authenticate, requireRole('ORGANIZATION'), async (req: AuthRequest, res) => {
  try {
    const orgProfile = await prisma.organizationProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!orgProfile) return res.status(404).json({ error: 'Organization profile not found' });

    const original = await prisma.opportunity.findFirst({ where: { id: req.params.id as string, orgId: orgProfile.id } });
    if (!original) return res.status(403).json({ error: 'Forbidden' });

    const duplicate = await prisma.opportunity.create({
      data: {
        orgId: orgProfile.id,
        title: `${original.title} (Copy)`,
        description: original.description,
        category: original.category,
        eligibility: original.eligibility,
        location: original.location,
        stipend: original.stipend,
        duration: original.duration,
        status: 'DRAFT',
      }
    });
    res.status(201).json(duplicate);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to duplicate opportunity' });
  }
});

// Get single Opportunity
router.get('/:id', async (req, res) => {
  try {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: req.params.id as string },
      include: {
        organization: { select: { companyName: true, logoUrl: true, website: true, industry: true } },
        _count: { select: { applications: true } }
      }
    });
    if (!opportunity) return res.status(404).json({ error: 'Opportunity not found' });
    res.json(opportunity);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch opportunity' });
  }
});

// Get all Opportunities for a specific Organization (includes drafts)
router.get('/org/mine', authenticate, requireRole('ORGANIZATION'), async (req: AuthRequest, res) => {
  try {
    const orgProfile = await prisma.organizationProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!orgProfile) return res.status(404).json({ error: 'Organization profile not found' });

    const statusFilter = req.query.status as string;
    const where: any = { orgId: orgProfile.id };
    if (statusFilter) where.status = statusFilter;

    const opportunities = await prisma.opportunity.findMany({
      where,
      include: { _count: { select: { applications: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(opportunities);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch opportunities' });
  }
});

// Get all Published Opportunities (Public / Students) with advanced filters
router.get('/', async (req, res) => {
  try {
    const { search, category, sort, featured, deadline } = req.query;

    const where: any = { status: 'PUBLISHED' };
    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { description: { contains: search as string } },
      ];
    }
    if (category) where.category = category as string;
    if (featured === 'true') where.isFeatured = true;
    if (deadline === 'upcoming') {
      where.deadline = { gte: new Date(), lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) };
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'deadline') orderBy = { deadline: 'asc' };
    if (sort === 'title') orderBy = { title: 'asc' };

    const opportunities = await prisma.opportunity.findMany({
      where,
      include: {
        organization: { select: { companyName: true, logoUrl: true } },
        _count: { select: { applications: true } }
      },
      orderBy
    });
    res.json(opportunities);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch opportunities' });
  }
});

// ----- BOOKMARK ROUTES -----

// Toggle bookmark
router.post('/:opportunityId/bookmark', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const opportunityId = req.params.opportunityId as string;

    const existing = await prisma.bookmark.findUnique({
      where: { userId_opportunityId: { userId, opportunityId } }
    });

    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      res.json({ bookmarked: false });
    } else {
      await prisma.bookmark.create({ data: { userId, opportunityId } });
      res.json({ bookmarked: true });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to toggle bookmark' });
  }
});

// Get user's bookmarks
router.get('/user/bookmarks', authenticate, async (req: AuthRequest, res) => {
  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: req.user!.userId },
      include: {
        opportunity: {
          include: {
            organization: { select: { companyName: true, logoUrl: true } },
            _count: { select: { applications: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(bookmarks.map(b => ({ ...b.opportunity, bookmarkId: b.id, bookmarkedAt: b.createdAt })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch bookmarks' });
  }
});

// Get bookmark status for current user (batch)
router.get('/user/bookmark-ids', authenticate, async (req: AuthRequest, res) => {
  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: req.user!.userId },
      select: { opportunityId: true }
    });
    res.json(bookmarks.map(b => b.opportunityId));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookmark IDs' });
  }
});

export default router;
