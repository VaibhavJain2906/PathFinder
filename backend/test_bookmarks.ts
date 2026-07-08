import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findFirst({ where: { email: 'john.student@example.com' }});
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: user!.id },
    include: { opportunity: { include: { organization: true } } }
  });
  console.log(JSON.stringify(bookmarks, null, 2));
}
main();
