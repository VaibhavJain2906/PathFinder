import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireRole, type AuthRequest } from '../middleware/auth';
import { notifyStatusChange, notifyNewApplication } from '../lib/notifications';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Submit Application (Students only) — enhanced with cover letter + timeline
router.post('/', authenticate, requireRole('STUDENT'), async (req: AuthRequest, res) => {
  try {
    const { opportunityId, coverLetter, answers } = req.body;
    const studentProfile = await prisma.studentProfile.findUnique({ 
      where: { userId: req.user!.userId },
      include: { skills: true }
    });
    if (!studentProfile) return res.status(404).json({ error: 'Student profile not found' });

    const existing = await prisma.application.findFirst({ where: { opportunityId, studentId: studentProfile.id } });
    if (existing) return res.status(400).json({ error: 'Already applied to this opportunity' });

    const application = await prisma.application.create({
      data: {
        opportunityId,
        studentId: studentProfile.id,
        coverLetter,
        answers: answers ? JSON.stringify(answers) : null,
      }
    });

    // Create timeline event
    await prisma.applicationEvent.create({
      data: { applicationId: application.id, type: 'SUBMITTED', details: 'Application submitted' }
    });

    // Notify organization
    const opp = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
      include: { organization: { include: { user: true } } }
    });
    if (opp) {
      await notifyNewApplication(
        opp.organization.userId,
        `${studentProfile.firstName} ${studentProfile.lastName}`,
        opp.title
      );
    }
    
    // Background async AI Match Scoring
    if (opp) {
      (async () => {
        try {
          let score = 0;
          let reason = "Fallback score assigned";
          
          if (genAI) {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `
              Evaluate the candidate for this opportunity out of 100 based on their profile and cover letter.
              Return ONLY a valid JSON object.
              JSON format: { "matchScore": number, "matchReason": "string (1 short sentence explaining why)" }
              
              Opportunity: ${opp.title}
              Requirements/Description: ${opp.description}
              
              Candidate Profile: ${studentProfile.bio || 'No bio'}
              Skills: ${studentProfile.skills.map(s => s.name).join(', ')}
              Cover Letter: ${coverLetter || 'None provided'}
            `;
            const result = await model.generateContent(prompt);
            let responseText = result.response.text();
            responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsedData = JSON.parse(responseText);
            score = parsedData.matchScore || 0;
            reason = parsedData.matchReason || "AI generated fit score based on profile and opportunity requirements.";
          } else {
            // Mock random score between 60 and 95
            await new Promise(r => setTimeout(r, 2000));
            score = Math.floor(Math.random() * 36) + 60;
            const skillList = studentProfile.skills.map(s => s.name).slice(0, 2).join(' and ');
            if (score >= 85) {
              reason = `${studentProfile.firstName} is an excellent match! Their background${skillList ? ` in ${skillList}` : ''} aligns perfectly with the core requirements of this role.`;
            } else if (score >= 70) {
              reason = `${studentProfile.firstName} is a solid candidate. They have relevant experience${skillList ? `, particularly with ${skillList},` : ''} though some minor upskilling may be needed.`;
            } else {
              reason = `While ${studentProfile.firstName} shows potential, their current skill set${skillList ? ` (${skillList})` : ''} may not fully meet the advanced requirements of this position.`;
            }
          }
          
          await prisma.application.update({
            where: { id: application.id },
            data: { matchScore: score, matchReason: reason }
          });
        } catch (err) {
          console.error("Failed to generate AI match score:", err);
        }
      })();
    }

    res.status(201).json(application);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// Get Student's Applications
router.get('/student', authenticate, requireRole('STUDENT'), async (req: AuthRequest, res) => {
  try {
    const studentProfile = await prisma.studentProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!studentProfile) return res.status(404).json({ error: 'Student profile not found' });

    const statusFilter = req.query.status as string;
    const where: any = { studentId: studentProfile.id };
    if (statusFilter && statusFilter !== 'ALL') where.status = statusFilter;

    const applications = await prisma.application.findMany({
      where,
      include: {
        opportunity: { include: { organization: true } },
        events: { orderBy: { createdAt: 'desc' }, take: 5 }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(applications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Withdraw Application (Students only)
router.put('/:id/withdraw', authenticate, requireRole('STUDENT'), async (req: AuthRequest, res) => {
  try {
    const studentProfile = await prisma.studentProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!studentProfile) return res.status(404).json({ error: 'Student profile not found' });

    const application = await prisma.application.findFirst({
      where: { id: req.params.id as string, studentId: studentProfile.id }
    });
    if (!application) return res.status(404).json({ error: 'Application not found' });
    if (application.status === 'WITHDRAWN') return res.status(400).json({ error: 'Already withdrawn' });
    if (application.status === 'ACCEPTED') return res.status(400).json({ error: 'Cannot withdraw an accepted application' });

    const updated = await prisma.application.update({
      where: { id: req.params.id as string },
      data: { status: 'WITHDRAWN', withdrawnAt: new Date() }
    });

    await prisma.applicationEvent.create({
      data: { applicationId: updated.id, type: 'WITHDRAWN', details: 'Application withdrawn by student' }
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to withdraw application' });
  }
});

// Get Application Timeline
router.get('/:id/timeline', authenticate, async (req: AuthRequest, res) => {
  try {
    const application = await prisma.application.findUnique({
      where: { id: req.params.id as string },
      include: {
        student: true,
        opportunity: { include: { organization: true } }
      }
    });

    if (!application) return res.status(404).json({ error: 'Application not found' });

    // Verify ownership
    const isOwnerStudent = application.student.userId === req.user!.userId;
    const isOwnerOrg = application.opportunity.organization.userId === req.user!.userId;
    
    if (!isOwnerStudent && !isOwnerOrg && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const events = await prisma.applicationEvent.findMany({
      where: { applicationId: req.params.id as string },
      orderBy: { createdAt: 'desc' }
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});

// Get Applications for an Opportunity (Organization only)
router.get('/org/:opportunityId', authenticate, requireRole('ORGANIZATION'), async (req: AuthRequest, res) => {
  try {
    const orgProfile = await prisma.organizationProfile.findUnique({ where: { userId: req.user!.userId } });
    const opp = await prisma.opportunity.findFirst({
      where: { id: req.params.opportunityId as string, orgId: orgProfile?.id }
    });
    if (!opp) return res.status(403).json({ error: 'Forbidden' });

    const statusFilter = req.query.status as string;
    const where: any = { opportunityId: req.params.opportunityId as string };
    if (statusFilter && statusFilter !== 'ALL') where.status = statusFilter;

    const applications = await prisma.application.findMany({
      where,
      include: {
        student: {
          include: { 
            skills: true, 
            documents: true,
            certifications: true,
            user: { select: { email: true } } 
          }
        },
        events: { orderBy: { createdAt: 'desc' }, take: 3 }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(applications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Update Application Status (Organization only) — enhanced with timeline + notification
router.put('/:id/status', authenticate, requireRole('ORGANIZATION'), async (req: AuthRequest, res) => {
  try {
    const { status, notes } = req.body;

    // Verify ownership
    const orgProfile = await prisma.organizationProfile.findUnique({ where: { userId: req.user!.userId } });
    const targetApp = await prisma.application.findUnique({ where: { id: req.params.id as string }, include: { opportunity: true } });
    
    if (!targetApp || targetApp.opportunity.orgId !== orgProfile?.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const application = await prisma.application.update({
      where: { id: req.params.id as string },
      data: { status, notes: notes || undefined },
      include: {
        student: { include: { user: true } },
        opportunity: true
      }
    });

    // Create timeline event
    await prisma.applicationEvent.create({
      data: {
        applicationId: application.id,
        type: 'STATUS_CHANGED',
        details: `Status changed to ${status}${notes ? `: ${notes}` : ''}`
      }
    });

    // Notify student
    await notifyStatusChange(application.student.userId, application.opportunity.title, status);

    res.json(application);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update application status' });
  }
});

// Batch Update Application Statuses (Organization only)
router.put('/batch/status', authenticate, requireRole('ORGANIZATION'), async (req: AuthRequest, res) => {
  try {
    const { applicationIds, status } = req.body;
    if (!Array.isArray(applicationIds) || !status) {
      return res.status(400).json({ error: 'applicationIds array and status required' });
    }

    const orgProfile = await prisma.organizationProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!orgProfile) return res.status(403).json({ error: 'Forbidden' });

    // Verify all applications belong to this organization
    const appsToUpdate = await prisma.application.findMany({
      where: { id: { in: applicationIds } },
      include: { opportunity: true }
    });
    
    if (appsToUpdate.length !== applicationIds.length || appsToUpdate.some(app => app.opportunity.orgId !== orgProfile.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const results = [];
    for (const appId of applicationIds) {
      const application = await prisma.application.update({
        where: { id: appId },
        data: { status },
        include: { student: { include: { user: true } }, opportunity: true }
      });
      await prisma.applicationEvent.create({
        data: { applicationId: appId, type: 'STATUS_CHANGED', details: `Batch status change to ${status}` }
      });
      await notifyStatusChange(application.student.userId, application.opportunity.title, status);
      results.push(application);
    }

    res.json({ updated: results.length, results });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to batch update' });
  }
});

export default router;
