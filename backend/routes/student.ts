import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireRole, type AuthRequest } from '../middleware/auth';

const router = Router();

// Get Student Profile
router.get('/profile', authenticate, requireRole('STUDENT'), async (req: AuthRequest, res) => {
  try {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: req.user!.userId },
      include: { skills: true, certifications: true, portfolioLinks: true, documents: true }
    });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update Student Profile
router.put('/profile', authenticate, requireRole('STUDENT'), async (req: AuthRequest, res) => {
  try {
    const { firstName, lastName, bio, major, university, graduationYear } = req.body;
    const profile = await prisma.studentProfile.update({
      where: { userId: req.user!.userId },
      data: { firstName, lastName, bio, major, university, graduationYear }
    });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Add Skill
router.post('/skills', authenticate, requireRole('STUDENT'), async (req: AuthRequest, res) => {
  try {
    const { name } = req.body;
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    const skill = await prisma.skill.create({ data: { name, studentProfileId: profile.id } });
    res.json(skill);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add skill' });
  }
});

// Delete Skill
router.delete('/skills/:id', authenticate, requireRole('STUDENT'), async (req: AuthRequest, res) => {
  try {
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    const skill = await prisma.skill.findFirst({ where: { id: req.params.id as string, studentProfileId: profile.id } });
    if (!skill) return res.status(404).json({ error: 'Skill not found' });
    await prisma.skill.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Skill deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete skill' });
  }
});

// Add Certification
router.post('/certifications', authenticate, requireRole('STUDENT'), async (req: AuthRequest, res) => {
  try {
    const { name, issuer, dateIssued } = req.body;
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    const cert = await prisma.certification.create({ data: { name, issuer, dateIssued, studentProfileId: profile.id } });
    res.json(cert);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add certification' });
  }
});

// Delete Certification
router.delete('/certifications/:id', authenticate, requireRole('STUDENT'), async (req: AuthRequest, res) => {
  try {
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    const cert = await prisma.certification.findFirst({ where: { id: req.params.id as string, studentProfileId: profile.id } });
    if (!cert) return res.status(404).json({ error: 'Certification not found' });
    await prisma.certification.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Certification deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete certification' });
  }
});

// Add Portfolio Link
router.post('/portfolio-links', authenticate, requireRole('STUDENT'), async (req: AuthRequest, res) => {
  try {
    const { title, url } = req.body;
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    const link = await prisma.portfolioLink.create({ data: { title, url, studentProfileId: profile.id } });
    res.json(link);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add portfolio link' });
  }
});

// Delete Portfolio Link
router.delete('/portfolio-links/:id', authenticate, requireRole('STUDENT'), async (req: AuthRequest, res) => {
  try {
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    const link = await prisma.portfolioLink.findFirst({ where: { id: req.params.id as string, studentProfileId: profile.id } });
    if (!link) return res.status(404).json({ error: 'Link not found' });
    await prisma.portfolioLink.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Link deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete portfolio link' });
  }
});

// Add Document
router.post('/documents', authenticate, requireRole('STUDENT'), async (req: AuthRequest, res) => {
  try {
    const { name, type, url } = req.body;
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    const doc = await prisma.document.create({ data: { title: name, type, fileUrl: url, studentId: profile.id } });
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add document' });
  }
});

// Delete Document
router.delete('/documents/:id', authenticate, requireRole('STUDENT'), async (req: AuthRequest, res) => {
  try {
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    const doc = await prisma.document.findFirst({ where: { id: req.params.id as string, studentId: profile.id } });
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    await prisma.document.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;
