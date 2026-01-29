/**
 * Script per abilitare tutti gli utenti esistenti alla stagione attiva.
 * Eseguire dopo la migrazione che aggiunge UserSeason.
 *
 * Uso: npx tsx scripts/enable-existing-users.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Cercando stagione attiva...')

  const activeSeason = await prisma.season.findFirst({
    where: { isActive: true }
  })

  if (!activeSeason) {
    console.log('Nessuna stagione attiva trovata. Uscita.')
    return
  }

  console.log(`Stagione attiva: ${activeSeason.name} (${activeSeason.id})`)

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true }
  })

  console.log(`Trovati ${users.length} utenti`)

  let created = 0
  let skipped = 0

  for (const user of users) {
    const existing = await prisma.userSeason.findUnique({
      where: {
        userId_seasonId: {
          userId: user.id,
          seasonId: activeSeason.id
        }
      }
    })

    if (existing) {
      skipped++
      continue
    }

    await prisma.userSeason.create({
      data: {
        userId: user.id,
        seasonId: activeSeason.id,
        isEnabled: true
      }
    })

    created++
    console.log(`Abilitato: ${user.name || user.email}`)
  }

  console.log(`\nCompletato: ${created} creati, ${skipped} già esistenti`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
