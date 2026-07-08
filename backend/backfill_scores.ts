import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const apps = await prisma.application.findMany({
    include: { student: { include: { skills: true } } }
  });

  for (const app of apps) {
    const score = Math.floor(Math.random() * 36) + 60; // 60-95
    const skillList = app.student.skills.map(s => s.name).slice(0, 2).join(' and ');
    let reason = '';
    
    if (score >= 85) {
      reason = `${app.student.firstName} is an excellent match! Their background${skillList ? ` in ${skillList}` : ''} aligns perfectly with the core requirements of this role.`;
    } else if (score >= 70) {
      reason = `${app.student.firstName} is a solid candidate. They have relevant experience${skillList ? `, particularly with ${skillList},` : ''} though some minor upskilling may be needed.`;
    } else {
      reason = `While ${app.student.firstName} shows potential, their current skill set${skillList ? ` (${skillList})` : ''} may not fully meet the advanced requirements of this position.`;
    }

    await prisma.application.update({
      where: { id: app.id },
      data: {
        matchScore: score,
        matchReason: reason
      }
    });
  }
  console.log(`Backfilled ${apps.length} applications with dynamic mock reasons.`);
}

main();
