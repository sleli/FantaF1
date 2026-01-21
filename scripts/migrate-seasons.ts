import { PrismaClient, ScoringType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting migration...')

  // 1. Create Legacy Season
  // Check if exists first
  let legacySeason = await prisma.season.findUnique({ where: { name: '2023-2024' } })
  if (!legacySeason) {
      legacySeason = await prisma.season.create({
        data: {
          name: '2023-2024',
          startDate: new Date('2023-01-01'),
          endDate: new Date('2023-12-31'),
          driverCount: 20,
          scoringType: ScoringType.LEGACY_TOP3,
          isActive: false
        }
      })
      console.log(`Created legacy season: ${legacySeason.name}`)
  } else {
      console.log(`Legacy season already exists: ${legacySeason.name}`)
  }

  // 2. Assign existing events to legacy season
  const updateResult = await prisma.event.updateMany({
    where: { seasonId: null },
    data: { seasonId: legacySeason.id }
  })
  console.log(`Updated ${updateResult.count} events to legacy season`)

  // 3. Create New Season
  let newSeason = await prisma.season.findUnique({ where: { name: '2024-2025' } })
  if (!newSeason) {
      newSeason = await prisma.season.create({
        data: {
          name: '2024-2025',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          driverCount: 20,
          scoringType: ScoringType.FULL_GRID_DIFF,
          isActive: true
        }
      })
      console.log(`Created new season: ${newSeason.name}`)
  } else {
       console.log(`New season already exists: ${newSeason.name}`)
       // Ensure it is active
       await prisma.season.update({ where: { id: newSeason.id }, data: { isActive: true } })
  }

  console.log('Migration completed.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
