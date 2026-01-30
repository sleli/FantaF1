
import { PrismaClient, ScoringType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting driver migration to Season 2025...')

  // 1. Find or Create Season 2025
  let season2025 = await prisma.season.findUnique({ where: { name: '2025' } })
  
  if (!season2025) {
    console.log('Season 2025 not found, creating it...')
    season2025 = await prisma.season.create({
      data: {
        name: '2025',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        scoringType: ScoringType.FULL_GRID_DIFF, // Defaulting to the new system as it seems to be the target
        isActive: true
      }
    })
    console.log(`Created Season 2025 (ID: ${season2025.id})`)
  } else {
    console.log(`Season 2025 already exists (ID: ${season2025.id})`)
    // Ensure it is active
    if (!season2025.isActive) {
        await prisma.season.update({
            where: { id: season2025.id },
            data: { isActive: true }
        })
        console.log('Set Season 2025 as active')
    }
  }

  // 2. Get all drivers
  const drivers = await prisma.driver.findMany()
  console.log(`Found ${drivers.length} drivers in database`)

  // 3. Associate drivers with Season 2025
  let updatedCount = 0
  for (const driver of drivers) {
    // Check if already associated
    const count = await prisma.season.count({
        where: {
            id: season2025.id,
            drivers: {
                some: {
                    id: driver.id
                }
            }
        }
    })

    if (count === 0) {
        await prisma.season.update({
            where: { id: season2025.id },
            data: {
                drivers: {
                    connect: { id: driver.id }
                }
            }
        })
        updatedCount++
    }
  }

  console.log(`Associated ${updatedCount} drivers to Season 2025`)
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
