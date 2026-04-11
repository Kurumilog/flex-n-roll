import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Fetching employees...');
  const galina = await prisma.employee.findFirst({
    where: { name: 'Галина', lastName: 'Зиневич' }
  });
  
  if (!galina) {
    console.log('Галина Зиневич не найдена в БД!');
    return;
  }
  
  console.log('Found:', galina);
  console.log('Updating KPI to 90...');
  
  const updated = await prisma.employee.update({
    where: { id: galina.id },
    data: { kpiScore: 90 }
  });
  
  console.log('Success! Updated employee:', updated);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
