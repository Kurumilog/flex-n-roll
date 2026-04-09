/**
 * Временно обновить workEnd до 23:59 для всех сотрудников (для тестирования)
 * Запуск: npx tsx scripts/temp-extend-workhours.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.employee.updateMany({
    data: { workEnd: '23:59' },
  });
  console.log(`✅ Updated workEnd to 23:59 for ${result.count} employees`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
