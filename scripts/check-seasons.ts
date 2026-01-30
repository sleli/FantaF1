import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const seasons = await prisma.season.findMany()
  console.log('All Seasons:', seasons)
  
  const activeSeason = await prisma.season.findFirst({
    where: { isActive: true }
  })
  console.log('Active Season (Direct DB):', activeSeason)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
