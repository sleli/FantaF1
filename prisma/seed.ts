import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const drivers2025 = [
  // McLaren Formula 1 Team
  { name: "Oscar Piastri", team: "McLaren", number: 81, active: true },
  { name: "Lando Norris", team: "McLaren", number: 4, active: true },
  
  // Scuderia Ferrari HP
  { name: "Charles Leclerc", team: "Ferrari", number: 16, active: true },
  { name: "Lewis Hamilton", team: "Ferrari", number: 44, active: true },
  
  // Oracle Red Bull Racing
  { name: "Max Verstappen", team: "Red Bull Racing", number: 1, active: true },
  { name: "Liam Lawson", team: "Red Bull Racing", number: 30, active: true },
  { name: "Yuki Tsunoda", team: "Red Bull Racing", number: 22, active: true },
  
  // Mercedes-AMG PETRONAS F1 Team
  { name: "George Russell", team: "Mercedes", number: 63, active: true },
  { name: "Andrea Kimi Antonelli", team: "Mercedes", number: 12, active: true },
  
  // Aston Martin Aramco F1 Team
  { name: "Lance Stroll", team: "Aston Martin", number: 18, active: true },
  { name: "Fernando Alonso", team: "Aston Martin", number: 14, active: true },
  
  // BWT Alpine F1 Team
  { name: "Pierre Gasly", team: "Alpine", number: 10, active: true },
  { name: "Jack Doohan", team: "Alpine", number: 7, active: true },
  { name: "Franco Colapinto", team: "Alpine", number: 43, active: true },
  
  // MoneyGram Haas F1 Team
  { name: "Esteban Ocon", team: "Haas", number: 31, active: true },
  { name: "Oliver Bearman", team: "Haas", number: 87, active: true },
  
  // Visa Cash App Racing Bulls F1 Team
  { name: "Isack Hadjar", team: "Racing Bulls", number: 6, active: true },
  
  // Atlassian Williams Racing
  { name: "Alexander Albon", team: "Williams", number: 23, active: true },
  { name: "Carlos Sainz Jr.", team: "Williams", number: 55, active: true },
  
  // Stake F1 Team Kick Sauber
  { name: "Nico Hulkenberg", team: "Kick Sauber", number: 27, active: true },
  { name: "Gabriel Bortoleto", team: "Kick Sauber", number: 5, active: true },

]

const testEvents = [
  // Marzo 2025 
  {
    name: "Gran Premio d'Australia 2025",
    type: "RACE" as const,
    date: new Date('2025-03-16T05:00:00Z'), // Domenica 16 marzo, gara ore 05:00 UTC
    closingDate: new Date('2025-03-14T23:59:59Z'), // Venerdì 14 marzo alle 23:59:59 (giorno prima delle qualifiche)
    status: "COMPLETED" as const
  },
  {
    name: "Gran Premio di Cina 2025",
    type: "RACE" as const,
    date: new Date('2025-03-23T08:00:00Z'), // Domenica 23 marzo, gara ore 08:00 UTC
    closingDate: new Date('2025-03-21T23:59:59Z'), // Venerdì 21 marzo alle 23:59:59 (giorno prima delle qualifiche sprint)
    status: "COMPLETED" as const
  },
  {
    name: "Sprint Cina 2025",
    type: "SPRINT" as const,
    date: new Date('2025-03-22T04:00:00Z'), // Sabato 22 marzo, sprint ore 08:30 UTC
    closingDate: new Date('2025-03-21T23:59:59Z'), // Venerdì 21 marzo alle 23:59:59 (giorno prima delle qualifiche sprint)
    status: "COMPLETED" as const
  },

  // Aprile 2025
  {
    name: "Gran Premio del Giappone 2025",
    type: "RACE" as const,
    date: new Date('2025-04-06T07:00:00Z'), // Domenica 6 aprile, gara ore 07:00 UTC
    closingDate: new Date('2025-04-04T22:59:59Z'), // Venerdì 4 aprile alle 23:59:59 (giorno prima delle qualifiche)
    status: "COMPLETED" as const
  },
  {
    name: "Gran Premio del Bahrain 2025",
    type: "RACE" as const,
    date: new Date('2025-04-13T17:00:00Z'), // Domenica 13 aprile, gara ore 17:00 UTC
    closingDate: new Date('2025-04-11T23:59:59Z'), // Venerdì 11 aprile alle 23:59:59 (giorno prima delle qualifiche)
    status: "COMPLETED" as const
  },
  {
    name: "Gran Premio dell'Arabia Saudita 2025",
    type: "RACE" as const,
    date: new Date('2025-04-20T19:00:00Z'), // Domenica 20 aprile, gara ore 19:00 UTC
    closingDate: new Date('2025-04-17T23:59:59Z'), // Venerdì 18 aprile alle 23:59:59 (giorno prima delle qualifiche)
    status: "COMPLETED" as const
  },

  // Maggio 2025
  {
    name: "Gran Premio di Miami 2025",
    type: "RACE" as const,
    date: new Date('2025-05-04T22:00:00Z'), // Domenica 4 maggio, gara ore 22:00 UTC
    closingDate: new Date('2025-05-02T23:59:59Z'), // Venerdì 2 maggio alle 23:59:59 (giorno prima delle qualifiche sprint)
    status: "COMPLETED" as const
  },
  {
    name: "Sprint Miami 2025",
    type: "SPRINT" as const,
    date: new Date('2025-05-04T22:00:00Z'), // Sabato 3 maggio, sprint ore 22:30 UTC
    closingDate: new Date('2025-05-02T23:59:59Z'), // Venerdì 2 maggio alle 23:59:59 (giorno prima delle qualifiche sprint)
    status: "COMPLETED" as const
  },
  {
    name: "Gran Premio dell'Emilia Romagna 2025",
    type: "RACE" as const,
    date: new Date('2025-05-18T15:00:00Z'), // Domenica 18 maggio, gara ore 15:00 UTC
    closingDate: new Date('2025-05-16T23:59:59Z'), // Venerdì 16 maggio alle 23:59:59 (giorno prima delle qualifiche)
    status: "COMPLETED" as const
  },
  {
    name: "Gran Premio di Monaco 2025",
    type: "RACE" as const,
    date: new Date('2025-05-25T15:00:00Z'), // Domenica 25 maggio, gara ore 15:00 UTC
    closingDate: new Date('2025-05-23T23:59:59Z'), // Venerdì 23 maggio alle 23:59:59 (giorno prima delle qualifiche)
    status: "COMPLETED" as const
  },

  // Giugno 2025 -
  {
    name: "Gran Premio di Spagna 2025",
    type: "RACE" as const,
    date: new Date('2025-06-01T15:00:00Z'), // Domenica 1 giugno, gara ore 15:00 UTC
    closingDate: new Date('2025-05-30T23:59:59Z'), // Venerdì 30 maggio alle 23:59:59 (giorno prima delle qualifiche)
    status: "COMPLETED" as const
  },
  {
    name: "Gran Premio del Canada 2025",
    type: "RACE" as const,
    date: new Date('2025-06-15T20:00:00Z'), // Domenica 15 giugno, gara ore 20:00 UTC (oggi!)
    closingDate: new Date('2025-06-13T23:59:59Z'), // Venerdì 13 giugno alle 23:59:59 (giorno prima delle qualifiche)
    status: "COMPLETED" as const
  },
  {
    name: "Gran Premio d'Austria 2025",
    type: "RACE" as const,
    date: new Date('2025-06-29T15:00:00Z'), // Domenica 29 giugno, gara ore 15:00 UTC
    closingDate: new Date('2025-06-27T23:59:59Z'), // Venerdì 27 giugno alle 23:59:59 (giorno prima delle qualifiche)
    status: "UPCOMING" as const
  },

  // Luglio 2025 
  {
    name: "Gran Premio di Gran Bretagna 2025",
    type: "RACE" as const,
    date: new Date('2025-07-06T16:00:00Z'), // Domenica 6 luglio, gara ore 16:00 UTC
    closingDate: new Date('2025-07-04T23:59:59Z'), // Venerdì 4 luglio alle 23:59:59 (giorno prima delle qualifiche)
    status: "UPCOMING" as const
  },
  {
    name: "Gran Premio del Belgio 2025",
    type: "RACE" as const,
    date: new Date('2025-07-27T15:00:00Z'), // Domenica 27 luglio, gara ore 15:00 UTC
    closingDate: new Date('2025-07-25T23:59:59Z'), // Venerdì 25 luglio alle 23:59:59 (giorno prima delle qualifiche sprint)
    status: "UPCOMING" as const
  },
  {
    name: "Sprint Belgio 2025",
    type: "SPRINT" as const,
    date: new Date('2025-07-26T16:00:00Z'), // Sabato 26 luglio, sprint ore 16:30 UTC
    closingDate: new Date('2025-07-25T23:59:59Z'), // Venerdì 25 luglio alle 23:59:59 (giorno prima delle qualifiche sprint)
    status: "UPCOMING" as const
  },

  // Agosto 2025
  {
    name: "Gran Premio d'Ungheria 2025",
    type: "RACE" as const,
    date: new Date('2025-08-03T15:00:00Z'), // Domenica 3 agosto, gara ore 15:00 UTC
    closingDate: new Date('2025-08-01T23:59:59Z'), // Venerdì 1 agosto alle 23:59:59 (giorno prima delle qualifiche)
    status: "UPCOMING" as const
  },
  {
    name: "Gran Premio d'Olanda 2025",
    type: "RACE" as const,
    date: new Date('2025-08-31T15:00:00Z'), // Domenica 31 agosto, gara ore 15:00 UTC
    closingDate: new Date('2025-08-29T23:59:59Z'), // Venerdì 29 agosto alle 23:59:59 (giorno prima delle qualifiche)
    status: "UPCOMING" as const
  },

  // Settembre 2025
  {
    name: "Gran Premio d'Italia 2025",
    type: "RACE" as const,
    date: new Date('2025-09-07T15:00:00Z'), // Domenica 7 settembre, gara ore 15:00 UTC
    closingDate: new Date('2025-09-05T23:59:59Z'), // Venerdì 5 settembre alle 23:59:59 (giorno prima delle qualifiche)
    status: "UPCOMING" as const
  },
  {
    name: "Gran Premio dell'Azerbaijan 2025",
    type: "RACE" as const,
    date: new Date('2025-09-21T13:00:00Z'), // Domenica 21 settembre, gara ore 13:00 UTC
    closingDate: new Date('2025-09-19T23:59:59Z'), // Venerdì 19 settembre alle 23:59:59 (giorno prima delle qualifiche)
    status: "UPCOMING" as const
  },

  // Ottobre 2025 
  {
    name: "Gran Premio di Singapore 2025",
    type: "RACE" as const,
    date: new Date('2025-10-05T14:00:00Z'), // Domenica 5 ottobre, gara ore 14:00 UTC
    closingDate: new Date('2025-10-03T23:59:59Z'), // Venerdì 3 ottobre alle 23:59:59 (giorno prima delle qualifiche)
    status: "UPCOMING" as const
  },
  {
    name: "Gran Premio degli Stati Uniti 2025",
    type: "RACE" as const,
    date: new Date('2025-10-19T21:00:00Z'), // Domenica 19 ottobre, gara ore 21:00 UTC
    closingDate: new Date('2025-10-17T23:59:59Z'), // Venerdì 17 ottobre alle 23:59:59 (giorno prima delle qualifiche sprint)
    status: "UPCOMING" as const
  },
  {
    name: "Sprint Stati Uniti 2025",
    type: "SPRINT" as const,
    date: new Date('2025-10-18T00:00:00Z'), // Sabato 18 ottobre, sprint ore 23:30 UTC
    closingDate: new Date('2025-10-17T23:59:59Z'), // Venerdì 17 ottobre alle 23:59:59 (giorno prima delle qualifiche sprint)
    status: "UPCOMING" as const
  },
  {
    name: "Gran Premio del Messico 2025",
    type: "RACE" as const,
    date: new Date('2025-10-26T21:00:00Z'), // Domenica 26 ottobre, gara ore 21:00 UTC
    closingDate: new Date('2025-10-24T23:59:59Z'), // Venerdì 24 ottobre alle 23:59:59 (giorno prima delle qualifiche)
    status: "UPCOMING" as const
  },

  // Novembre 2025 
  {
    name: "Gran Premio del Brasile 2025",
    type: "RACE" as const,
    date: new Date('2025-11-09T18:00:00Z'), // Domenica 9 novembre, gara ore 18:00 UTC
    closingDate: new Date('2025-11-07T23:59:59Z'), // Venerdì 7 novembre alle 23:59:59 (giorno prima delle qualifiche sprint)
    status: "UPCOMING" as const
  },
  {
    name: "Sprint Brasile 2025",
    type: "SPRINT" as const,
    date: new Date('2025-11-08T19:00:00Z'), // Sabato 8 novembre, sprint ore 19:30 UTC
    closingDate: new Date('2025-11-07T23:59:59Z'), // Venerdì 7 novembre alle 23:59:59 (giorno prima delle qualifiche sprint)
    status: "UPCOMING" as const
  },
  {
    name: "Gran Premio di Las Vegas 2025",
    type: "RACE" as const,
    date: new Date('2025-11-22T05:00:00Z'), // Domenica 22 novembre, gara ore 05:00 UTC
    closingDate: new Date('2025-11-20T23:59:59Z'), // Venerdì 20 novembre alle 23:59:59 (giorno prima delle qualifiche)
    status: "UPCOMING" as const
  },
  {
    name: "Gran Premio del Qatar 2025",
    type: "RACE" as const,
    date: new Date('2025-11-30T17:00:00Z'), // Domenica 30 novembre, gara ore 17:00 UTC
    closingDate: new Date('2025-11-28T23:59:59Z'), // Venerdì 28 novembre alle 23:59:59 (giorno prima delle qualifiche sprint)
    status: "UPCOMING" as const
  },
  {
    name: "Sprint Qatar 2025",
    type: "SPRINT" as const,
    date: new Date('2025-11-29T19:00:00Z'), // Sabato 29 novembre, sprint ore 18:30 UTC
    closingDate: new Date('2025-11-28T23:59:59Z'), // Venerdì 28 novembre alle 23:59:59 (giorno prima delle qualifiche sprint)
    status: "UPCOMING" as const
  },

  // Dicembre 2025 
  {
    name: "Gran Premio di Abu Dhabi 2025",
    type: "RACE" as const,
    date: new Date('2025-12-07T14:00:00Z'), // Domenica 7 dicembre, gara ore 14:00 UTC
    closingDate: new Date('2025-12-05T23:59:59Z'), // Venerdì 5 dicembre alle 23:59:59 (giorno prima delle qualifiche)
    status: "UPCOMING" as const
  }
]

async function main() {
  console.log('🏎️  Seeding FantaF1 database...')

  // Create Season 2025
  console.log('📅 Creating Season 2025...')
  const season2025 = await prisma.season.upsert({
    where: { name: '2025' },
    update: { isActive: true },
    create: {
      name: '2025',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      driverCount: 20,
      scoringType: 'FULL_GRID_DIFF',
      isActive: true
    }
  })
  console.log(`   ✅ Season 2025 created/updated: ${season2025.id}`)
  
  // Create drivers
  console.log('📝 Creating drivers...')
  
  // First, deactivate all existing drivers
  await prisma.driver.updateMany({
    data: {
      active: false
    }
  })
  
  for (const driver of drivers2025) {
    // Find existing driver by name or number
    const existingDriver = await prisma.driver.findFirst({
      where: { 
        OR: [
          { name: driver.name },
          { number: driver.number }
        ]
      }
    })
    
    if (existingDriver) {
      // Update existing driver
      await prisma.driver.update({
        where: { id: existingDriver.id },
        data: {
          name: driver.name,
          team: driver.team,
          number: driver.number,
          active: driver.active
        }
      })
    } else {
      // Create new driver
      await prisma.driver.create({
        data: {
          name: driver.name,
          team: driver.team,
          number: driver.number,
          active: driver.active
        }
      })
    }
    console.log(`   ✅ Created/Updated: ${driver.name} (#${driver.number}) - ${driver.team} ${driver.active ? '🟢' : '🔴'}`)
  }
  
  // Create admin user (optional - you can create this manually later)
  console.log('👤 Creating admin user...')
  await prisma.user.upsert({
    where: { email: 'admin@fantaf1.com' },
    update: {
      role: 'ADMIN'
    },
    create: {
      email: 'admin@fantaf1.com',
      name: 'Admin FantaF1',
      role: 'ADMIN'
    }
  })
  console.log('   ✅ Admin user created/updated')
  
  // Create test users
  console.log('👥 Creating test users...')
  const testUser1 = await prisma.user.upsert({
    where: { email: 'user1@test.com' },
    update: {},
    create: {
      email: 'user1@test.com',
      name: 'Mario Rossi',
      role: 'PLAYER'
    }
  })
  
  const testUser2 = await prisma.user.upsert({
    where: { email: 'user2@test.com' },
    update: {},
    create: {
      email: 'user2@test.com',
      name: 'Luigi Bianchi',
      role: 'PLAYER'
    }
  })
  console.log('   ✅ Test users created/updated')
  
  // Create test events
  console.log('🏁 Creating test events...')
  for (const event of testEvents) {
    // Check if event already exists
    const existingEvent = await prisma.event.findFirst({
      where: { name: event.name }
    })
    
    if (existingEvent) {
      console.log(`   ⚡ Event already exists: ${event.name}`)
      continue
    }
    
    // Create new event
    const createdEvent = await prisma.event.create({
      data: {
        ...event,
        seasonId: season2025.id
      }
    })
    
    console.log(`   ✅ Created: ${createdEvent.name} (${createdEvent.type}) - ${createdEvent.date.toISOString()}`)  }
  
  // Add results to some completed events for testing
  console.log('🏆 Adding results to completed events...')
  
  // Get some drivers for results
  const maxVerstappen = await prisma.driver.findFirst({ where: { name: 'Max Verstappen' } })
  const charlesLeclerc = await prisma.driver.findFirst({ where: { name: 'Charles Leclerc' } })
  const landoNorris = await prisma.driver.findFirst({ where: { name: 'Lando Norris' } })
  
  if (maxVerstappen && charlesLeclerc && landoNorris) {
    // Add results to Australia GP
    const australiaGP = await prisma.event.findFirst({ where: { name: "Gran Premio d'Australia 2025" } })
    if (australiaGP && !australiaGP.firstPlaceId) {
      await prisma.event.update({
        where: { id: australiaGP.id },
        data: {
          firstPlaceId: maxVerstappen.id,
          secondPlaceId: charlesLeclerc.id,
          thirdPlaceId: landoNorris.id
        }
      })
      console.log('   ✅ Results added to Australia GP')
    }
    
    // Add results to China GP
    const chinaGP = await prisma.event.findFirst({ where: { name: "Gran Premio di Cina 2025" } })
    if (chinaGP && !chinaGP.firstPlaceId) {
      await prisma.event.update({
        where: { id: chinaGP.id },
        data: {
          firstPlaceId: charlesLeclerc.id,
          secondPlaceId: maxVerstappen.id,
          thirdPlaceId: landoNorris.id
        }
      })
      console.log('   ✅ Results added to China GP')
    }
  }
  
  // Create some test predictions for completed events
  console.log('🎯 Creating test predictions...')
  
  if (testUser1 && testUser2 && maxVerstappen && charlesLeclerc && landoNorris) {
    const australiaGP = await prisma.event.findFirst({ where: { name: "Gran Premio d'Australia 2025" } })
    const chinaGP = await prisma.event.findFirst({ where: { name: "Gran Premio di Cina 2025" } })
    
    if (australiaGP) {
      // User1 predictions for Australia - perfect prediction!
      await prisma.prediction.upsert({
        where: {
          userId_eventId: {
            userId: testUser1.id,
            eventId: australiaGP.id
          }
        },
        update: {},
        create: {
          userId: testUser1.id,
          eventId: australiaGP.id,
          firstPlaceId: maxVerstappen.id,
          secondPlaceId: charlesLeclerc.id,
          thirdPlaceId: landoNorris.id
        }
      })
      
      // User2 predictions for Australia - partial correct
      await prisma.prediction.upsert({
        where: {
          userId_eventId: {
            userId: testUser2.id,
            eventId: australiaGP.id
          }
        },
        update: {},
        create: {
          userId: testUser2.id,
          eventId: australiaGP.id,
          firstPlaceId: charlesLeclerc.id, // Wrong position
          secondPlaceId: maxVerstappen.id, // Wrong position
          thirdPlaceId: landoNorris.id     // Correct!
        }
      })
    }
    
    if (chinaGP) {
      // User1 predictions for China - partial correct
      await prisma.prediction.upsert({
        where: {
          userId_eventId: {
            userId: testUser1.id,
            eventId: chinaGP.id
          }
        },
        update: {},
        create: {
          userId: testUser1.id,
          eventId: chinaGP.id,
          firstPlaceId: maxVerstappen.id,  // Wrong position
          secondPlaceId: charlesLeclerc.id, // Wrong position
          thirdPlaceId: landoNorris.id      // Correct!
        }
      })
      
      // User2 predictions for China - better prediction
      await prisma.prediction.upsert({
        where: {
          userId_eventId: {
            userId: testUser2.id,
            eventId: chinaGP.id
          }
        },
        update: {},
        create: {
          userId: testUser2.id,
          eventId: chinaGP.id,
          firstPlaceId: charlesLeclerc.id, // Correct!
          secondPlaceId: maxVerstappen.id, // Correct!
          thirdPlaceId: landoNorris.id     // Correct!
        }
      })
    }
    
    console.log('   ✅ Test predictions created')
  }

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
