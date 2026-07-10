import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireRole, type AuthRequest } from '../middleware/auth';
import multer from 'multer';
const { PDFParse } = require('pdf-parse');
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Parse Resume (PDF) to Profile JSON
router.post('/parse-resume', authenticate, requireRole('STUDENT'), upload.single('resume'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    // Parse PDF
    const parser = new PDFParse({ data: req.file.buffer });
    const pdfData = await parser.getText();
    const text = pdfData.text;

    // Use Gemini if available
    if (genAI) {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        Extract the following information from the provided resume text and return ONLY a valid JSON object.
        If a field is missing, set its value to null or empty string appropriately.
        JSON format:
        {
          "firstName": "string",
          "lastName": "string",
          "bio": "string (1-2 sentences summarizing their professional profile)",
          "major": "string",
          "university": "string",
          "graduationYear": number,
          "skills": ["string", "string"]
        }

        Resume Text:
        ${text}
      `;
      const result = await model.generateContent(prompt);
      let responseText = result.response.text();
      responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(responseText);
      return res.json(parsedData);
    } else {
      // Mock fallback if no API key
      await new Promise(r => setTimeout(r, 1500));
      return res.json({
        firstName: "Parsed",
        lastName: "User",
        bio: "This is a mock bio generated from the PDF parsing fallback.",
        major: "Computer Science",
        university: "Mock University",
        graduationYear: 2027,
        skills: ["JavaScript", "React", "Mocking"]
      });
    }
  } catch (error: any) {
    console.error('Error parsing resume:', error);
    res.status(500).json({ error: 'Failed to parse resume', details: error?.message || String(error) });
  }
});


// Helper: get student profile with all related data
async function getFullStudentProfile(userId: string) {
  return prisma.studentProfile.findUnique({
    where: { userId },
    include: { skills: true, certifications: true, portfolioLinks: true, documents: true }
  });
}

// ----- AI GENERATORS -----

// Generate SOP
router.post('/generate-sop', authenticate, requireRole('STUDENT'), async (req: AuthRequest, res) => {
  try {
    const { opportunityId, additionalContext } = req.body;
    const profile = await getFullStudentProfile(req.user!.userId);
    const opp = await prisma.opportunity.findUnique({ where: { id: opportunityId }, include: { organization: true } });
    if (!profile || !opp) return res.status(404).json({ error: 'Profile or Opportunity not found' });

    await new Promise(r => setTimeout(r, 1500));

    const skillsList = profile.skills.map(s => s.name).join(', ') || 'various technical and soft skills';
    const certsList = profile.certifications.map(c => `${c.name} (${c.issuer})`).join(', ');

    const output = `STATEMENT OF PURPOSE

${opp.title} — ${opp.organization.companyName}

Dear Selection Committee,

I am writing to express my enthusiastic interest in the ${opp.title} opportunity at ${opp.organization.companyName}. As a ${profile.major || 'dedicated'} student at ${profile.university || 'my university'}${profile.graduationYear ? `, graduating in ${profile.graduationYear}` : ''}, I have cultivated a strong foundation that aligns perfectly with this program's objectives.

Throughout my academic journey, I have developed expertise in ${skillsList}, which has prepared me to contribute meaningfully to your organization.${certsList ? ` My commitment to continuous learning is reflected in my certifications: ${certsList}.` : ''}

${profile.bio ? `${profile.bio}\n` : ''}${additionalContext ? `Furthermore, ${additionalContext}, which reinforces my dedication to this field and my suitability for this opportunity.\n` : ''}
What draws me most to ${opp.organization.companyName} is the opportunity to ${opp.description.substring(0, 120)}. I am confident that my background, combined with my passion for growth, makes me a strong candidate.

I am eager to bring my skills, dedication, and fresh perspective to your esteemed program. Thank you for considering my application.

Sincerely,
${profile.firstName} ${profile.lastName}`;

    // Save generation
    await prisma.aIGeneration.create({
      data: { userId: req.user!.userId, type: 'SOP', prompt: `SOP for ${opp.title}`, output, oppId: opportunityId }
    });

    res.json({ sop: output });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate SOP' });
  }
});

// Generate Cover Letter
router.post('/generate-cover-letter', authenticate, requireRole('STUDENT'), async (req: AuthRequest, res) => {
  try {
    const { opportunityId, additionalContext } = req.body;
    const profile = await getFullStudentProfile(req.user!.userId);
    const opp = await prisma.opportunity.findUnique({ where: { id: opportunityId }, include: { organization: true } });
    if (!profile || !opp) return res.status(404).json({ error: 'Profile or Opportunity not found' });

    await new Promise(r => setTimeout(r, 1500));
    const skillsList = profile.skills.map(s => s.name).join(', ') || 'relevant skills';

    const output = `Dear Hiring Manager at ${opp.organization.companyName},

I am writing to express my interest in the ${opp.title} position. As a ${profile.major || 'motivated'} student at ${profile.university || 'my university'} with a strong background in ${skillsList}, I am excited about the opportunity to contribute to your team.

${opp.eligibility ? `I meet the stated eligibility requirements: ${opp.eligibility}. ` : ''}My academic training and hands-on project experience have equipped me with the analytical thinking and technical proficiency needed for this role.

${additionalContext ? `${additionalContext}\n\n` : ''}I would welcome the opportunity to discuss how my background, skills, and enthusiasm align with ${opp.organization.companyName}'s mission. Thank you for your time and consideration.

Best regards,
${profile.firstName} ${profile.lastName}`;

    await prisma.aIGeneration.create({
      data: { userId: req.user!.userId, type: 'COVER_LETTER', prompt: `Cover Letter for ${opp.title}`, output, oppId: opportunityId }
    });

    res.json({ coverLetter: output });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate cover letter' });
  }
});

// Generate Essay
router.post('/generate-essay', authenticate, requireRole('STUDENT'), async (req: AuthRequest, res) => {
  try {
    const { opportunityId, essayPrompt, additionalContext } = req.body;
    const profile = await getFullStudentProfile(req.user!.userId);
    const opp = opportunityId ? await prisma.opportunity.findUnique({ where: { id: opportunityId }, include: { organization: true } }) : null;
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    await new Promise(r => setTimeout(r, 1500));

    const topic = essayPrompt || (opp ? `Why I am the ideal candidate for ${opp.title}` : 'My academic journey and aspirations');

    const output = `${topic}

The intersection of passion and purpose defines the most impactful moments in a student's journey. As a ${profile.major || 'dedicated'} student at ${profile.university || 'my university'}, I have experienced these defining moments firsthand.

My academic foundation in ${profile.skills.map(s => s.name).slice(0, 3).join(', ') || 'my field'} has been complemented by real-world applications that deepened my understanding.${profile.certifications.length > 0 ? ` Earning certifications like ${profile.certifications[0]?.name} demonstrated my commitment to mastery beyond the classroom.` : ''}

${additionalContext ? `${additionalContext}\n\n` : ''}${opp ? `The ${opp.title} opportunity at ${opp.organization.companyName} represents the next chapter in this journey. ${opp.description.substring(0, 150)}...\n\n` : ''}Looking forward, I aim to leverage my skills and experiences to make a meaningful contribution. The challenges ahead excite me, and I am prepared to meet them with the same dedication that has defined my journey so far.

— ${profile.firstName} ${profile.lastName}`;

    await prisma.aIGeneration.create({
      data: { userId: req.user!.userId, type: 'ESSAY', prompt: topic, output, oppId: opportunityId || null }
    });

    res.json({ essay: output });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate essay' });
  }
});

// Generate Personal Statement
router.post('/generate-personal-statement', authenticate, requireRole('STUDENT'), async (req: AuthRequest, res) => {
  try {
    const { additionalContext } = req.body;
    const profile = await getFullStudentProfile(req.user!.userId);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    await new Promise(r => setTimeout(r, 1500));

    const output = `PERSONAL STATEMENT — ${profile.firstName} ${profile.lastName}

From an early age, curiosity has been the driving force behind every decision I have made. Today, as a ${profile.major || 'university'} student at ${profile.university || 'my institution'}, that curiosity has evolved into a purposeful pursuit of knowledge and impact.

My academic journey has been marked by a deliberate effort to build both depth and breadth. My expertise in ${profile.skills.map(s => s.name).join(', ') || 'my chosen field'} reflects the depth, while ${profile.certifications.length > 0 ? `my certifications — including ${profile.certifications.map(c => c.name).join(', ')} — ` : 'my diverse learning experiences '}demonstrate the breadth of my intellectual interests.

${profile.bio ? `${profile.bio}\n\n` : ''}${additionalContext ? `${additionalContext}\n\n` : ''}What sets me apart is not just what I know, but how I apply it. I thrive at the intersection of theory and practice, constantly seeking ways to translate academic concepts into real-world solutions.

As I look to the future, I am driven by a vision of using my skills to create meaningful change. I believe in lifelong learning, collaboration, and the transformative power of education.

— ${profile.firstName} ${profile.lastName}`;

    await prisma.aIGeneration.create({
      data: { userId: req.user!.userId, type: 'PERSONAL_STATEMENT', prompt: 'Personal Statement', output }
    });

    res.json({ personalStatement: output });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate personal statement' });
  }
});

// ----- RESUME INTELLIGENCE -----

// Profile Strength / Completeness
router.get('/profile-strength', authenticate, requireRole('STUDENT'), async (req: AuthRequest, res) => {
  try {
    const profile = await getFullStudentProfile(req.user!.userId);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const checks = [
      { item: 'First Name', done: !!profile.firstName, category: 'basic' },
      { item: 'Last Name', done: !!profile.lastName, category: 'basic' },
      { item: 'University', done: !!profile.university, category: 'basic' },
      { item: 'Major', done: !!profile.major, category: 'basic' },
      { item: 'Bio', done: !!profile.bio, category: 'basic' },
      { item: 'Graduation Year', done: !!profile.graduationYear, category: 'basic' },
      { item: 'At least 3 skills', done: profile.skills.length >= 3, category: 'skills' },
      { item: 'At least 5 skills', done: profile.skills.length >= 5, category: 'skills' },
      { item: 'Resume uploaded', done: profile.documents.some(d => d.type === 'RESUME'), category: 'documents' },
      { item: 'At least 1 certification', done: profile.certifications.length >= 1, category: 'certifications' },
      { item: 'At least 1 portfolio link', done: profile.portfolioLinks.length >= 1, category: 'links' },
    ];

    const completed = checks.filter(c => c.done).length;
    const score = Math.round((completed / checks.length) * 100);

    res.json({ score, total: checks.length, completed, checks });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate profile strength' });
  }
});

// ----- AI MATCHING -----

// Opportunity Recommendations
router.get('/recommendations', authenticate, requireRole('STUDENT'), async (req: AuthRequest, res) => {
  try {
    const profile = await getFullStudentProfile(req.user!.userId);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const studentSkills = profile.skills.map(s => s.name.toLowerCase());

    const opportunities = await prisma.opportunity.findMany({
      where: { status: 'PUBLISHED' },
      include: { organization: { select: { companyName: true, logoUrl: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Simple keyword matching algorithm
    const scored = opportunities.map(opp => {
      let score = 0;
      const text = `${opp.title} ${opp.description} ${opp.eligibility || ''} ${opp.category}`.toLowerCase();

      // Skill match
      for (const skill of studentSkills) {
        if (text.includes(skill)) score += 20;
      }
      // Major match
      if (profile.major && text.includes(profile.major.toLowerCase())) score += 15;
      // Featured bonus
      if (opp.isFeatured) score += 10;
      // Active deadline bonus
      if (opp.deadline && new Date(opp.deadline) > new Date()) score += 5;

      score = Math.min(score, 98); // cap
      if (score < 10) score = Math.floor(Math.random() * 25) + 15; // minimum random score

      return { ...opp, matchScore: score };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);
    res.json(scored.slice(0, 10));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// Match Score for specific opportunity
router.get('/match-score/:opportunityId', authenticate, requireRole('STUDENT'), async (req: AuthRequest, res) => {
  try {
    const profile = await getFullStudentProfile(req.user!.userId);
    const opp = await prisma.opportunity.findUnique({ where: { id: req.params.opportunityId as string } });
    if (!profile || !opp) return res.status(404).json({ error: 'Not found' });

    const studentSkills = profile.skills.map(s => s.name.toLowerCase());
    const text = `${opp.title} ${opp.description} ${opp.eligibility || ''}`.toLowerCase();

    let score = 0;
    const matchedSkills: string[] = [];
    for (const skill of studentSkills) {
      if (text.includes(skill)) { score += 20; matchedSkills.push(skill); }
    }
    if (profile.major && text.includes(profile.major.toLowerCase())) score += 15;
    score = Math.min(score, 98);
    if (score < 10) score = Math.floor(Math.random() * 25) + 15;

    res.json({ score, matchedSkills, totalSkills: studentSkills.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate match score' });
  }
});

// ----- ORG AI -----

// Candidate Summary
router.get('/candidate-summary/:applicationId', authenticate, requireRole('ORGANIZATION'), async (req: AuthRequest, res) => {
  try {
    const application = await prisma.application.findUnique({
      where: { id: req.params.applicationId as string },
      include: {
        student: { include: { skills: true, certifications: true, portfolioLinks: true, documents: true } },
        opportunity: true
      }
    });
    if (!application) return res.status(404).json({ error: 'Application not found' });

    const s = application.student;
    const o = application.opportunity;

    await new Promise(r => setTimeout(r, 1000));

    const summary = `📋 CANDIDATE SUMMARY

Name: ${s.firstName} ${s.lastName}
University: ${s.university || 'Not specified'}
Major: ${s.major || 'Not specified'}
Graduation: ${s.graduationYear || 'N/A'}

🎯 Match Analysis for "${o.title}":
• Skills: ${s.skills.map(sk => sk.name).join(', ') || 'None listed'}
• Certifications: ${s.certifications.length > 0 ? s.certifications.map(c => `${c.name} (${c.issuer})`).join(', ') : 'None'}
• Documents: ${s.documents.length} uploaded (${s.documents.map(d => d.type).join(', ') || 'none'})
• Portfolio: ${s.portfolioLinks.length > 0 ? s.portfolioLinks.map(l => l.title).join(', ') : 'No links'}

💡 Assessment:
${s.skills.length >= 3 ? '✅ Strong skill profile' : '⚠️ Limited skills listed'}
${s.documents.some(d => d.type === 'RESUME') ? '✅ Resume uploaded' : '⚠️ No resume on file'}
${s.certifications.length > 0 ? '✅ Has relevant certifications' : '⚠️ No certifications'}
${s.bio ? '✅ Bio provided' : '⚠️ No bio'}
${application.coverLetter ? '✅ Cover letter submitted' : '⚠️ No cover letter'}

${s.bio ? `\nBio: "${s.bio}"` : ''}`;

    res.json({ summary });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// Get Generation History
router.get('/history', authenticate, async (req: AuthRequest, res) => {
  try {
    const generations = await prisma.aIGeneration.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json(generations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch AI history' });
  }
});

export default router;
