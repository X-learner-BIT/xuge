import 'dotenv/config';
import { prisma } from '../src/lib/prisma.js';

async function updateNickname() {
  const user = await prisma.user.update({
    where: { phone: '18962574183' },
    data: { nickname: '学习达人' },
  });
  console.log(`昵称已更新为: ${user.nickname}`);
  await prisma.$disconnect();
}

updateNickname();