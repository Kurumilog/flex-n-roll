import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

/**
 * Seed database with employees and initial data
 * Run: npx prisma db seed
 */
async function main() {
  console.log('🌱 Seeding database...');

  // Load employees from JSON
  const employeesPath = path.resolve(
    __dirname,
    '../../../FNR_PRO_Hackathon/data/employees.json',
  );

  let employeesData: any[] = [];
  try {
    employeesData = JSON.parse(fs.readFileSync(employeesPath, 'utf-8'));
    console.log(`📋 Loaded ${employeesData.length} employees from employees.json`);
  } catch (error) {
    console.warn(`⚠️  Could not load employees.json from ${employeesPath}, using default data`);
    employeesData = [];
  }

  // Seed employees
  if (employeesData.length > 0) {
    console.log('👥 Seeding employees...');

    // Начальные KPI-значения (рассчитаны по deals.json)
    const kpiOverrides: Record<number, { kpiScore: number; dealsWon: number; dealsLost: number }> = {
      13: { kpiScore: 72, dealsWon: 5, dealsLost: 2 },   // Марина Бургацкая
      33: { kpiScore: 68, dealsWon: 4, dealsLost: 2 },   // Александр Кипель
    };

    for (const emp of employeesData) {
      const id = parseInt(emp.ID, 10);
      const overrides = kpiOverrides[id];

      await prisma.employee.upsert({
        where: { id },
        update: {
          name: emp.NAME,
          lastName: emp.LAST_NAME,
          email: emp.EMAIL,
          phone: emp.PHONE || null,
          position: emp.POSITION || null,
          department: emp.DEPARTMENT || null,
          ...(overrides && {
            kpiScore: overrides.kpiScore,
            dealsWon: overrides.dealsWon,
            dealsLost: overrides.dealsLost,
          }),
        },
        create: {
          id,
          name: emp.NAME,
          lastName: emp.LAST_NAME,
          email: emp.EMAIL,
          phone: emp.PHONE || null,
          position: emp.POSITION || null,
          department: emp.DEPARTMENT || null,
          ...(overrides && {
            kpiScore: overrides.kpiScore,
            dealsWon: overrides.dealsWon,
            dealsLost: overrides.dealsLost,
          }),
        },
      });
    }

    console.log(`✅ Seeded ${employeesData.length} employees`);
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
