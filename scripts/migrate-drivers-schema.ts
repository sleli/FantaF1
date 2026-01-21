
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting driver migration...');

  // 1. Get the active season (or the first one if none active)
  let season = await prisma.season.findFirst({
    where: { isActive: true }
  });

  if (!season) {
    console.log('No active season found. Looking for any season...');
    season = await prisma.season.findFirst();
  }

  if (!season) {
    console.error('No seasons found in database! Cannot migrate drivers.');
    process.exit(1);
  }

  console.log(`Using Season: ${season.name} (${season.id})`);

  // 2. Update all drivers
  const result = await prisma.driver.updateMany({
    where: {
      seasonId: null as any
    },
    data: {
      seasonId: season.id
    }
  });

  console.log(`Migrated ${result.count} drivers to season ${season.name}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
