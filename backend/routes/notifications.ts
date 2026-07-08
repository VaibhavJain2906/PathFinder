import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate, type AuthRequest } from '../middleware/auth';

const router = Router();

// Get user's notifications (paginated)
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.user!.userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId: req.user!.userId } })
    ]);

    res.json({ notifications, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Unread count
router.get('/unread-count', authenticate, async (req: AuthRequest, res) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user!.userId, read: false }
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// Mark as read
router.put('/:id/read', authenticate, async (req: AuthRequest, res) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id as string },
      data: { read: true }
    });
    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// Mark all as read
router.put('/read-all', authenticate, async (req: AuthRequest, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.userId, read: false },
      data: { read: true }
    });
    res.json({ message: 'All marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

export default router;
