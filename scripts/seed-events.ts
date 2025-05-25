import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🏁 Seeding eventi F1 2025...');

  // Lista eventi della stagione F1 2025 (sample)
  const events = [
    {
      name: 'Gran Premio del Bahrain',
      type: 'RACE',
      date: new Date('2025-03-02T15:00:00.000Z'),
      closingDate: new Date('2025-03-02T14:00:00.000Z'),
      status: 'UPCOMING'
    },
    {
      name: 'Sprint Bahrain',
      type: 'SPRINT',
      date: new Date('2025-03-01T11:00:00.000Z'),
      closingDate: new Date('2025-03-01T10:00:00.000Z'),
      status: 'UPCOMING'
    },
    {
      name: 'Gran Premio dell\'Arabia Saudita',
      type: 'RACE',
      date: new Date('2025-03-09T17:00:00.000Z'),
      closingDate: new Date('2025-03-09T16:00:00.000Z'),
      status: 'UPCOMING'
    },
    {
      name: 'Gran Premio dell\'Australia',
      type: 'RACE',
      date: new Date('2025-03-16T06:00:00.000Z'),
      closingDate: new Date('2025-03-16T05:00:00.000Z'),
      status: 'UPCOMING'
    },
    {
      name: 'Gran Premio del Giappone',
      type: 'RACE',
      date: new Date('2025-04-06T07:00:00.000Z'),
      closingDate: new Date('2025-04-06T06:00:00.000Z'),
      status: 'UPCOMING'
    },
    {
      name: 'Gran Premio della Cina',
      type: 'RACE',
      date: new Date('2025-04-20T08:00:00.000Z'),
      closingDate: new Date('2025-04-20T07:00:00.000Z'),
      status: 'UPCOMING'
    },
    {
      name: 'Sprint Shanghai',
      type: 'SPRINT',
      date: new Date('2025-04-19T04:00:00.000Z'),
      closingDate: new Date('2025-04-19T03:00:00.000Z'),
      status: 'UPCOMING'
    },
    {
      name: 'Gran Premio di Miami',
      type: 'RACE',
      date: new Date('2025-05-04T19:30:00.000Z'),
      closingDate: new Date('2025-05-04T18:30:00.000Z'),
      status: 'UPCOMING'
    },
    {
      name: 'Sprint Miami',
      type: 'SPRINT',
      date: new Date('2025-05-03T15:00:00.000Z'),
      closingDate: new Date('2025-05-03T14:00:00.000Z'),
      status: 'UPCOMING'
    },
    {
      name: 'Gran Premio dell\'Emilia-Romagna',
      type: 'RACE',
      date: new Date('2025-05-18T15:00:00.000Z'),
      closingDate: new Date('2025-05-18T14:00:00.000Z'),
      status: 'UPCOMING'
    },
    {
      name: 'Gran Premio di Monaco',
      type: 'RACE',
      date: new Date('2025-05-25T15:00:00.000Z'),
      closingDate: new Date('2025-05-25T14:00:00.000Z'),
      status: 'UPCOMING'
    },
    {
      name: 'Gran Premio del Canada',
      type: 'RACE',
      date: new Date('2025-06-15T20:00:00.000Z'),
      closingDate: new Date('2025-06-15T19:00:00.000Z'),
      status: 'UPCOMING'
    }
  ];

  // Controlla se ci sono già eventi
  const existingEventsCount = await prisma.event.count();
  
  if (existingEventsCount > 0) {
    console.log(`⚠️  Trovati ${existingEventsCount} eventi esistenti. Vuoi continuare? (y/n)`);
    // Per automazione, procediamo comunque
  }

  let createdCount = 0;
  let skippedCount = 0;

  for (const eventData of events) {
    try {
      // Controlla se l'evento esiste già
      const existingEvent = await prisma.event.findFirst({
        where: { name: eventData.name }
      });

      if (existingEvent) {
        console.log(`⏭️  Saltato: ${eventData.name} (già esistente)`);
        skippedCount++;
        continue;
      }

      const event = await prisma.event.create({
        data: eventData as any
      });

      console.log(`✅ Creato: ${event.name} (${event.type}) - ${event.date.toLocaleDateString('it-IT')}`);
      createdCount++;
    } catch (error) {
      console.error(`❌ Errore nella creazione di ${eventData.name}:`, error);
    }
  }

  console.log(`\n🏁 Seeding completato!`);
  console.log(`✅ Eventi creati: ${createdCount}`);
  console.log(`⏭️  Eventi saltati: ${skippedCount}`);
  console.log(`📊 Totale eventi nel database: ${await prisma.event.count()}`);

  // Mostra riassunto eventi per tipo e status
  const summary = await prisma.event.groupBy({
    by: ['type', 'status'],
    _count: true
  });

  console.log('\n📈 Riassunto eventi:');
  summary.forEach(group => {
    console.log(`  ${group.type} - ${group.status}: ${group._count} eventi`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Errore durante il seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
