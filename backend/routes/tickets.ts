import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireRole, type AuthRequest } from '../middleware/auth';

const router = Router();

// Create a new ticket (Students and Organizations)
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { subject, description, type, priority } = req.body;
    const ticket = await prisma.ticket.create({
      data: {
        subject,
        description,
        type: type || 'OTHER',
        priority: priority || 'MEDIUM',
        creatorId: req.user!.userId
      }
    });
    res.status(201).json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// Get user's own tickets
router.get('/mine', authenticate, async (req: AuthRequest, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { creatorId: req.user!.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tickets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Admin: Get all tickets
router.get('/admin', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      include: {
        creator: { select: { email: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tickets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch all tickets' });
  }
});

// Get a specific ticket with messages
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: {
        creator: { select: { email: true, role: true } },
        messages: {
          include: { sender: { select: { email: true, role: true } } },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Ensure the user has access to view this ticket
    if (req.user!.role !== 'ADMIN' && ticket.creatorId !== req.user!.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch ticket details' });
  }
});

// Admin: Update ticket status
router.put('/:id/status', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { status } = req.body;
    const ticket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update ticket status' });
  }
});

// Add a message to a ticket
router.post('/:id/messages', authenticate, async (req: AuthRequest, res) => {
  try {
    const ticketId = req.params.id;
    const { message } = req.body;

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    if (req.user!.role !== 'ADMIN' && ticket.creatorId !== req.user!.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const newMessage = await prisma.ticketMessage.create({
      data: {
        ticketId,
        senderId: req.user!.userId,
        message
      },
      include: {
        sender: { select: { email: true, role: true } }
      }
    });

    // Optionally update ticket's updatedAt timestamp
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() }
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add message' });
  }
});

export default router;
