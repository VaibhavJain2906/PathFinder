import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireRole, type AuthRequest } from '../middleware/auth';

const router = Router();

// Enhanced Analytics
router.get('/analytics', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const [totalUsers, totalStudents, totalOrganizations, totalOpportunities, totalApplications] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'ORGANIZATION' } }),
      prisma.opportunity.count(),
      prisma.application.count(),
    ]);

    // Status breakdown
    const [accepted, rejected, pending, shortlisted] = await Promise.all([
      prisma.application.count({ where: { status: 'ACCEPTED' } }),
      prisma.application.count({ where: { status: 'REJECTED' } }),
      prisma.application.count({ where: { status: 'PENDING' } }),
      prisma.application.count({ where: { status: 'SHORTLISTED' } }),
    ]);

    const recentActivity = await prisma.application.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        student: true,
        opportunity: { include: { organization: true } }
      }
    });

    // Recent users
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, role: true, createdAt: true }
    });

    res.json({
      metrics: {
        totalUsers, totalStudents, totalOrganizations, totalOpportunities, totalApplications,
        applicationBreakdown: { accepted, rejected, pending, shortlisted },
      },
      recentActivity,
      recentUsers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Export analytics as CSV
router.get('/analytics/export', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const applications = await prisma.application.findMany({
      include: {
        student: true,
        opportunity: { include: { organization: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    let csv = 'Student,Email,Opportunity,Organization,Status,Applied On\n';
    for (const app of applications) {
      const student = app.student;
      const opp = app.opportunity;
      csv += `"${student.firstName} ${student.lastName}","","${opp.title}","${opp.organization.companyName}","${app.status}","${app.createdAt.toISOString()}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=pathfinder-export.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export' });
  }
});

// User Management
router.get('/users', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const search = (req.query.search as string) || '';
    const roleFilter = req.query.role as string;

    const where: any = {};
    if (search) where.email = { contains: search };
    if (roleFilter) where.role = roleFilter;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, email: true, role: true, createdAt: true, updatedAt: true },
        skip, take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    res.json({ users, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Change User Role
router.put('/users/:id/role', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { role } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id as string },
      data: { role },
      select: { id: true, email: true, role: true }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// Delete User
router.delete('/users/:id', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id as string } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Prevent admin from deleting themselves
    if (user.id === req.user!.userId) {
      return res.status(400).json({ error: 'Cannot delete your own admin account' });
    }

    await prisma.user.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get all opportunities (Admin)
router.get('/opportunities', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const search = (req.query.search as string) || '';
    const opportunities = await prisma.opportunity.findMany({
      where: {
        OR: [
          { title: { contains: search } },
          { organization: { companyName: { contains: search } } }
        ]
      },
      include: {
        organization: { select: { companyName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ opportunities });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch opportunities' });
  }
});

// Delete Opportunity
router.delete('/opportunities/:id', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    await prisma.opportunity.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Opportunity deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete opportunity' });
  }
});

// Audit Log
router.get('/audit-log', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 30;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true } } }
      }),
      prisma.auditLog.count()
    ]);

    res.json({ logs, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

// System Health
router.get('/system-health', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const [users, opps, apps, notifs] = await Promise.all([
      prisma.user.count(),
      prisma.opportunity.count(),
      prisma.application.count(),
      prisma.notification.count(),
    ]);

    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      database: { users, opportunities: opps, applications: apps, notifications: notifs },
      memory: process.memoryUsage(),
      nodeVersion: process.version,
    });
  } catch (error) {
    res.status(500).json({ error: 'Health check failed' });
  }
});

export default router;
