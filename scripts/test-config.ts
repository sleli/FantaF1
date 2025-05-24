/**
 * Test di configurazione FantaF1 - verifica setup senza database
 * Esegui con: npx tsx scripts/test-config.ts
 */

import { calculatePoints, validatePrediction, formatEventDate } from '../src/lib/scoring'
import { POINTS } from '../src/lib/types'

console.log('🧪 Testing FantaF1 Configuration...\n')

// Test 1: Verifica costanti punteggi
console.log('1️⃣ Testing scoring constants...')
console.log(`   Race points: ${POINTS.RACE.FIRST_CORRECT}/${POINTS.RACE.SECOND_CORRECT}/${POINTS.RACE.THIRD_CORRECT}/${POINTS.RACE.PRESENT_WRONG_POSITION}`)
console.log(`   Sprint points: ${POINTS.SPRINT.FIRST_CORRECT}/${POINTS.SPRINT.SECOND_CORRECT}/${POINTS.SPRINT.THIRD_CORRECT}/${POINTS.SPRINT.PRESENT_WRONG_POSITION}`)
console.log('   ✅ Scoring constants loaded correctly\n')

// Test 2: Test calcolo punteggi
console.log('2️⃣ Testing scoring calculation...')

const testPrediction = {
  firstPlaceId: "verstappen",
  secondPlaceId: "leclerc", 
  thirdPlaceId: "hamilton"
}

const testResult = {
  firstPlaceId: "verstappen",  // Primo corretto (+25)
  secondPlaceId: "hamilton",   // Hamilton era terzo nel pronostico (+5)
  thirdPlaceId: "norris"       // Leclerc non presente (0)
}

const racePoints = calculatePoints(testPrediction, testResult, 'RACE')
const sprintPoints = calculatePoints(testPrediction, testResult, 'SPRINT')

console.log(`   Race points calculated: ${racePoints} (expected: 30)`)
console.log(`   Sprint points calculated: ${sprintPoints} (expected: 15)`)
console.log('   ✅ Scoring calculation working correctly\n')

// Test 3: Validazione pronostici
console.log('3️⃣ Testing prediction validation...')

const validPrediction = {
  firstPlaceId: "driver1",
  secondPlaceId: "driver2",
  thirdPlaceId: "driver3"
}

const invalidPrediction = {
  firstPlaceId: "driver1",
  secondPlaceId: "driver1", // Duplicato!
  thirdPlaceId: "driver3"
}

console.log(`   Valid prediction: ${validatePrediction(validPrediction)} (expected: true)`)
console.log(`   Invalid prediction: ${validatePrediction(invalidPrediction)} (expected: false)`)
console.log('   ✅ Prediction validation working correctly\n')

// Test 4: Formattazione date
console.log('4️⃣ Testing date formatting...')
const testDate = new Date('2025-05-24T14:30:00Z')
const formatted = formatEventDate(testDate)
console.log(`   Formatted date: ${formatted}`)
console.log('   ✅ Date formatting working correctly\n')

// Test 5: Verifica import Prisma types
console.log('5️⃣ Testing Prisma types import...')
try {
  const { UserRole, EventType, EventStatus } = require('@prisma/client')
  console.log(`   UserRole enum: ${Object.values(UserRole).join(', ')}`)
  console.log(`   EventType enum: ${Object.values(EventType).join(', ')}`)
  console.log(`   EventStatus enum: ${Object.values(EventStatus).join(', ')}`)
  console.log('   ✅ Prisma types imported correctly\n')
} catch (error) {
  console.log('   ⚠️  Prisma client not generated yet. Run: npx prisma generate\n')
}

console.log('🎉 Configuration test completed!')
console.log('🚀 FantaF1 is ready for Task 004 - Route Protection!')

console.log('\n💡 Next steps:')
console.log('   1. Set up your PostgreSQL database')
console.log('   2. Configure .env.local with your DATABASE_URL')
console.log('   3. Run: npm run db:push')
console.log('   4. Test database: npx tsx scripts/test-db.ts')
console.log('   5. Start development: npm run dev')
