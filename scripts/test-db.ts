/**
 * Test script per verificare la configurazione del database
 * Esegui con: npx tsx scripts/test-db.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testDatabase() {
  console.log('🧪 Testing FantaF1 Database Connection...\n')

  try {
    // Test connessione
    console.log('1️⃣ Testing database connection...')
    await prisma.$connect()
    console.log('   ✅ Database connected successfully\n')

    // Test query drivers
    console.log('2️⃣ Testing drivers query...')
    const driversCount = await prisma.driver.count()
    console.log(`   ✅ Found ${driversCount} drivers in database`)
    
    if (driversCount > 0) {
      const sampleDriver = await prisma.driver.findFirst()
      console.log(`   📝 Sample driver: ${sampleDriver?.name} (#${sampleDriver?.number}) - ${sampleDriver?.team}`)
    }
    console.log('')

    // Test query users
    console.log('3️⃣ Testing users query...')
    const usersCount = await prisma.user.count()
    console.log(`   ✅ Found ${usersCount} users in database`)
    
    if (usersCount > 0) {
      const adminUser = await prisma.user.findFirst({ 
        where: { role: 'ADMIN' } 
      })
      if (adminUser) {
        console.log(`   👤 Admin user: ${adminUser.name || adminUser.email}`)
      }
    }
    console.log('')

    // Test query events
    console.log('4️⃣ Testing events query...')
    const eventsCount = await prisma.event.count()
    console.log(`   ✅ Found ${eventsCount} events in database\n`)

    // Test schema validation
    console.log('5️⃣ Testing schema relationships...')
    
    // Test che i modelli siano definiti correttamente
    const modelTest = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `
    
    console.log('   📊 Database tables:')
    console.log(modelTest)
    console.log('')

    console.log('🎉 All database tests passed!')
    console.log('🚀 Database is ready for FantaF1!')

  } catch (error) {
    console.error('❌ Database test failed:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('database') && error.message.includes('does not exist')) {
        console.log('\n💡 Suggestion: Create the database first:')
        console.log('   createdb fantaf1')
        console.log('   # or using psql: CREATE DATABASE fantaf1;')
      }
      
      if (error.message.includes('connect')) {
        console.log('\n💡 Suggestions:')
        console.log('   1. Check if PostgreSQL is running')
        console.log('   2. Verify DATABASE_URL in .env.local')
        console.log('   3. Ensure database exists and is accessible')
      }

      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('\n💡 Suggestion: Apply database schema:')
        console.log('   npm run db:push')
        console.log('   # or: npx prisma migrate dev --name init')
      }
    }

    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()
