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

  // Piloti non più attivi ma che hanno corso nel 2025
  { name: "Sergio Perez", team: "Red Bull Racing", number: 11, active: false },
  { name: "Logan Sargeant", team: "Williams", number: 2, active: false },
  { name: "Kevin Magnussen", team: "Haas", number: 20, active: false },
  { name: "Valtteri Bottas", team: "Kick Sauber", number: 77, active: false },
  { name: "Zhou Guanyu", team: "Kick Sauber", number: 24, active: false },
]

async function main() {
  console.log('🏎️  Seeding FantaF1 database...')
  
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
