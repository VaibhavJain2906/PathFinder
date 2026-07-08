import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Update John Student's application for Software Engineering Intern to PENDING
  await prisma.application.updateMany({
    where: {
      status: 'SHORTLISTED',
      student: { firstName: 'John', lastName: 'Student' }
    },
    data: {
      status: 'PENDING'
    }
  });
  console.log('Reset John Student to PENDING');
}

main();
