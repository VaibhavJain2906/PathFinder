import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Admin
  await prisma.user.upsert({
    where: { email: 'admin@pathfinder.com' },
    update: {},
    create: {
      email: 'admin@pathfinder.com',
      password: passwordHash,
      role: 'ADMIN',
    },
  });

  // 2. Organizations
  const orgs = [
    { email: 'acme.corp@example.com', name: 'Acme Corp', industry: 'Technology', desc: 'A leading technology company innovating in AI and cloud computing.' },
    { email: 'global.health@example.com', name: 'Global Health Initiative', industry: 'Healthcare', desc: 'Non-profit dedicated to improving healthcare access globally.' },
    { email: 'green.energy@example.com', name: 'GreenEnergy Solutions', industry: 'Renewable Energy', desc: 'Pioneering sustainable energy solutions for a better tomorrow.' },
    { email: 'fintech.innovators@example.com', name: 'FinTech Innovators', industry: 'Finance', desc: 'Disrupting traditional banking with decentralized finance.' }
  ];

  const createdOrgs = [];
  for (const org of orgs) {
    const user = await prisma.user.upsert({
      where: { email: org.email },
      update: {},
      create: { email: org.email, password: passwordHash, role: 'ORGANIZATION' }
    });
    const profile = await prisma.organizationProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, companyName: org.name, industry: org.industry, description: org.desc, website: `https://${org.name.replace(/\s+/g, '').toLowerCase()}.com` }
    });
    createdOrgs.push(profile);
  }

  // 3. Opportunities
  const oppsData = [
    { orgId: createdOrgs[0].id, title: 'Software Engineering Intern', category: 'INTERNSHIP', location: 'San Francisco, CA', stipend: '$45/hr', status: 'PUBLISHED', isFeatured: true, desc: 'Join our core engineering team to build scalable cloud infrastructure.' },
    { orgId: createdOrgs[0].id, title: 'AI Research Fellowship', category: 'FELLOWSHIP', location: 'Remote', stipend: '$50,000 grant', status: 'PUBLISHED', isFeatured: false, desc: 'A 6-month fellowship focusing on generative AI models.' },
    { orgId: createdOrgs[1].id, title: 'Global Health Data Analyst', category: 'INTERNSHIP', location: 'Geneva, Switzerland', stipend: 'Paid', status: 'PUBLISHED', isFeatured: true, desc: 'Analyze healthcare trends and epidemiology data to inform policy.' },
    { orgId: createdOrgs[1].id, title: 'Medical Research Grant', category: 'GRANT', location: 'Global', stipend: '$100,000', status: 'PUBLISHED', isFeatured: false, desc: 'Funding for innovative medical research projects.' },
    { orgId: createdOrgs[2].id, title: 'Sustainable Engineering Co-op', category: 'INTERNSHIP', location: 'Austin, TX', stipend: '$30/hr', status: 'PUBLISHED', isFeatured: false, desc: 'Work on solar panel efficiency optimization.' },
    { orgId: createdOrgs[3].id, title: 'Quantitative Trading Intern', category: 'INTERNSHIP', location: 'New York, NY', stipend: '$12,000/mo', status: 'PUBLISHED', isFeatured: true, desc: 'Build low-latency trading algorithms.' },
    { orgId: createdOrgs[3].id, title: 'Blockchain Developer (Draft)', category: 'INTERNSHIP', location: 'Remote', stipend: '', status: 'DRAFT', isFeatured: false, desc: 'Draft for upcoming blockchain role.' },
  ];

  const createdOpps = [];
  for (const opp of oppsData) {
    const o = await prisma.opportunity.create({
      data: {
        orgId: opp.orgId, title: opp.title, category: opp.category, location: opp.location, stipend: opp.stipend, status: opp.status, isFeatured: opp.isFeatured, description: opp.desc,
        deadline: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000)
      }
    });
    createdOpps.push(o);
  }

  // 4. Students
  const students = [
    { email: 'john.student@example.com', first: 'John', last: 'Student', major: 'Computer Science', uni: 'State University', skills: ['React', 'Node.js', 'Python'], certs: ['AWS Certified Developer'] },
    { email: 'alice.smith@example.com', first: 'Alice', last: 'Smith', major: 'Data Science', uni: 'Tech Institute', skills: ['Python', 'SQL', 'Machine Learning'], certs: ['Google Data Analytics'] },
    { email: 'bob.jones@example.com', first: 'Bob', last: 'Jones', major: 'Biomedical Engineering', uni: 'Global University', skills: ['Data Analysis', 'Lab Research', 'MATLAB'], certs: [] },
    { email: 'clara.davis@example.com', first: 'Clara', last: 'Davis', major: 'Finance', uni: 'Business School', skills: ['Financial Modeling', 'Excel', 'C++'], certs: ['Bloomberg Market Concepts'] },
    { email: 'david.wilson@example.com', first: 'David', last: 'Wilson', major: 'Environmental Science', uni: 'Green College', skills: ['GIS', 'Sustainability Analysis'], certs: ['LEED Green Associate'] }
  ];

  const createdStudents = [];
  for (const stu of students) {
    const user = await prisma.user.upsert({
      where: { email: stu.email },
      update: {},
      create: { email: stu.email, password: passwordHash, role: 'STUDENT' }
    });
    
    const profile = await prisma.studentProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id, firstName: stu.first, lastName: stu.last, university: stu.uni, major: stu.major, graduationYear: 2025,
        bio: `I am a passionate ${stu.major} student looking for exciting opportunities to grow and make an impact.`
      }
    });
    
    for (const skill of stu.skills) {
      await prisma.skill.create({ data: { name: skill, studentProfileId: profile.id } });
    }
    for (const cert of stu.certs) {
      await prisma.certification.create({ data: { name: cert, issuer: 'Various', studentProfileId: profile.id } });
    }
    
    createdStudents.push(profile);
  }

  // 5. Applications & Events
  const applicationScenarios = [
    { oppIdx: 0, stuIdx: 0, status: 'SHORTLISTED', coverLetter: 'I am highly interested in joining Acme Corp as a Software Engineer. My background in React and Node.js aligns perfectly with your requirements.' },
    { oppIdx: 0, stuIdx: 1, status: 'PENDING', coverLetter: 'I bring strong Python skills to the table and would love to contribute to your core team.' },
    { oppIdx: 2, stuIdx: 2, status: 'REVIEWING', coverLetter: 'With my biomedical background, I am eager to analyze health data at the Global Health Initiative.' },
    { oppIdx: 5, stuIdx: 3, status: 'ACCEPTED', coverLetter: 'My financial modeling and C++ skills make me an ideal candidate for your quantitative trading desk.' },
    { oppIdx: 4, stuIdx: 4, status: 'REJECTED', coverLetter: 'I am passionate about sustainability and want to work on solar panels.' },
    { oppIdx: 1, stuIdx: 0, status: 'PENDING', coverLetter: 'I want to delve deep into generative AI models.' }
  ];

  for (const app of applicationScenarios) {
    const application = await prisma.application.create({
      data: {
        opportunityId: createdOpps[app.oppIdx].id,
        studentId: createdStudents[app.stuIdx].id,
        status: app.status,
        coverLetter: app.coverLetter,
        notes: app.status === 'SHORTLISTED' ? 'Strong candidate, schedule interview.' : null
      }
    });

    // Create an initial SUBMITTED event
    await prisma.applicationEvent.create({
      data: { applicationId: application.id, type: 'SUBMITTED', details: 'Application submitted', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }
    });

    // Create a status change event if it's not pending
    if (app.status !== 'PENDING') {
      await prisma.applicationEvent.create({
        data: { applicationId: application.id, type: 'STATUS_CHANGED', details: `Status changed to ${app.status}`, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }
      });
    }
  }

  // 6. Bookmarks
  await prisma.bookmark.create({ data: { userId: createdStudents[0].userId, opportunityId: createdOpps[5].id } });
  await prisma.bookmark.create({ data: { userId: createdStudents[0].userId, opportunityId: createdOpps[4].id } });

  console.log('Database seeded with robust dummy data successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
