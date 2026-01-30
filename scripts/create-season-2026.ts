import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🏎️  Setting up Season 2026...')

  // 1. Get Season 2025 drivers
  const season2025 = await prisma.season.findUnique({
    where: { name: '2025' },
    include: { drivers: true }
  })

  if (!season2025) {
    console.error('❌ Season 2025 not found. Cannot copy drivers.')
    process.exit(1)
  }

  // 2. Create Season 2026
  console.log('📅 Creating Season 2026...')
  const season2026 = await prisma.season.upsert({
    where: { name: '2026' },
    update: { isActive: true },
    create: {
      name: '2026',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      scoringType: season2025.scoringType,
      isActive: true
    }
  })
  console.log(`   ✅ Season 2026 created/updated: ${season2026.id}`)

  // 3. Copy Drivers
  console.log('👥 Copying drivers from 2025...')
  for (const driver of season2025.drivers) {
    await prisma.driver.upsert({
      where: {
        seasonId_number: {
          seasonId: season2026.id,
          number: driver.number
        }
      },
      update: {
        active: driver.active,
        team: driver.team,
        name: driver.name
      },
      create: {
        name: driver.name,
        team: driver.team,
        number: driver.number,
        active: driver.active,
        seasonId: season2026.id
      }
    })
  }
  console.log(`   ✅ Copied ${season2025.drivers.length} drivers to Season 2026`)

  // 4. Create Events
  console.log('🏁 Creating events...')
  
  const events = [
    {
      name: "Sprint d'Italia",
      type: "SPRINT" as const,
      date: new Date('2026-01-23T14:00:00Z'),
      closingDate: new Date('2026-01-22T23:59:59Z'),
      seasonId: season2026.id,
      status: "UPCOMING" as const
    },
    {
      name: "GP d'Italia",
      type: "RACE" as const,
      date: new Date('2026-01-25T14:00:00Z'),
      closingDate: new Date('2026-01-24T23:59:59Z'),
      seasonId: season2026.id,
      status: "UPCOMING" as const
    }
  ]

  for (const eventData of events) {
    const existingEvent = await prisma.event.findFirst({
      where: { 
        name: eventData.name,
        seasonId: season2026.id 
      }
    })

    if (!existingEvent) {
      await prisma.event.create({
        data: eventData
      })
      console.log(`   ✅ Created ${eventData.name}`)
    } else {
      console.log(`   ⚡ Event ${eventData.name} already exists`)
      // Update dates if needed
      await prisma.event.update({
        where: { id: existingEvent.id },
        data: {
          date: eventData.date,
          closingDate: eventData.closingDate
        }
      })
    }
  }

}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
