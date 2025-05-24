import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const drivers2025 = [
  // Red Bull Racing
  { name: "Max Verstappen", team: "Red Bull Racing", number: 1 },
  { name: "Sergio Perez", team: "Red Bull Racing", number: 11 },
  
  // Mercedes
  { name: "Lewis Hamilton", team: "Mercedes", number: 44 },
  { name: "George Russell", team: "Mercedes", number: 63 },
  
  // Ferrari
  { name: "Charles Leclerc", team: "Ferrari", number: 16 },
  { name: "Carlos Sainz Jr.", team: "Ferrari", number: 55 },
  
  // McLaren
  { name: "Lando Norris", team: "McLaren", number: 4 },
  { name: "Oscar Piastri", team: "McLaren", number: 81 },
  
  // Aston Martin
  { name: "Fernando Alonso", team: "Aston Martin", number: 14 },
  { name: "Lance Stroll", team: "Aston Martin", number: 18 },
  
  // Alpine
  { name: "Esteban Ocon", team: "Alpine", number: 31 },
  { name: "Pierre Gasly", team: "Alpine", number: 10 },
  
  // Williams
  { name: "Alex Albon", team: "Williams", number: 23 },
  { name: "Logan Sargeant", team: "Williams", number: 2 },
  
  // AlphaTauri
  { name: "Yuki Tsunoda", team: "AlphaTauri", number: 22 },
  { name: "Nyck de Vries", team: "AlphaTauri", number: 21 },
  
  // Alfa Romeo
  { name: "Valtteri Bottas", team: "Alfa Romeo", number: 77 },
  { name: "Zhou Guanyu", team: "Alfa Romeo", number: 24 },
  
  // Haas
  { name: "Kevin Magnussen", team: "Haas", number: 20 },
  { name: "Nico Hulkenberg", team: "Haas", number: 27 }
]

async function main() {
  console.log('🏎️  Seeding FantaF1 database...')
  
  // Create drivers
  console.log('📝 Creating drivers...')
  for (const driver of drivers2025) {
    await prisma.driver.upsert({
      where: { number: driver.number },
      update: {
        name: driver.name,
        team: driver.team,
        active: true
      },
      create: {
        name: driver.name,
        team: driver.team,
        number: driver.number,
        active: true
      }
    })
    console.log(`   ✅ Created/Updated: ${driver.name} (#${driver.number})`)
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
