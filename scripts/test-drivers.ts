// Questo script di test può essere eseguito per verificare il funzionamento delle API dei piloti

import { PrismaClient } from '@prisma/client'

// Inizializza il client Prisma
const prisma = new PrismaClient()

// Test driver per verificare le operazioni CRUD
const testDriver = {
  name: 'Test Driver',
  team: 'Test Team',
  number: 99,
  active: true
}

async function testDriverOperations() {
  console.log('🧪 Inizio test operazioni piloti')
  let createdDriver
  
  try {
    // Test 1: Creazione pilota
    console.log('\n📝 Test 1: Creazione pilota')
    createdDriver = await prisma.driver.create({
      data: testDriver
    })
    console.log('✅ Pilota creato con successo:', createdDriver)
    
    // Test 2: Lettura pilota
    console.log('\n📝 Test 2: Lettura pilota')
    const foundDriver = await prisma.driver.findUnique({
      where: { id: createdDriver.id }
    })
    console.log('✅ Pilota trovato:', foundDriver)
    
    // Test 3: Aggiornamento pilota
    console.log('\n📝 Test 3: Aggiornamento pilota')
    const updatedDriver = await prisma.driver.update({
      where: { id: createdDriver.id },
      data: { 
        team: 'Updated Team',
        active: false
      }
    })
    console.log('✅ Pilota aggiornato:', updatedDriver)
    
    // Test 4: Lettura tutti i piloti
    console.log('\n📝 Test 4: Lettura tutti i piloti')
    const allDrivers = await prisma.driver.findMany({
      orderBy: { name: 'asc' }
    })
    console.log(`✅ Trovati ${allDrivers.length} piloti`)
    
    // Test 5: Eliminazione pilota
    console.log('\n📝 Test 5: Eliminazione pilota')
    const deletedDriver = await prisma.driver.delete({
      where: { id: createdDriver.id }
    })
    console.log('✅ Pilota eliminato:', deletedDriver)
    
    // Test 6: Verifica eliminazione
    console.log('\n📝 Test 6: Verifica eliminazione')
    const verifyDeleted = await prisma.driver.findUnique({
      where: { id: createdDriver.id }
    })
    if (!verifyDeleted) {
      console.log('✅ Pilota non trovato, eliminazione confermata')
    } else {
      console.log('❌ Errore: il pilota esiste ancora')
    }
    
  } catch (error) {
    console.error('❌ Errore durante i test:', error)
    
    // Pulizia in caso di errore
    if (createdDriver?.id) {
      try {
        await prisma.driver.delete({
          where: { id: createdDriver.id }
        })
        console.log('🧹 Pulizia: pilota di test eliminato')
      } catch (cleanupError) {
        // Ignora errori di pulizia
      }
    }
  } finally {
    await prisma.$disconnect()
    console.log('\n🏁 Test completati')
  }
}

// Esegui i test
testDriverOperations()
