import { prisma } from '@/lib/prisma';
import { getEnabledUsersForSeason } from '@/lib/user-season';

/**
 * Auto-compila i pronostici mancanti per gli utenti abilitati nella stagione.
 * Per ogni utente senza pronostico: copia l'ultimo pronostico precedente,
 * oppure crea un pronostico vuoto se non ne esiste uno precedente.
 *
 * @returns Il numero di pronostici auto-compilati creati
 */
export async function autoFillMissingPredictions(
  eventId: string,
  seasonId: string,
  eventDate: Date
): Promise<number> {
  const users = await getEnabledUsersForSeason(seasonId);

  const existingPreds = await prisma.prediction.findMany({
    where: { eventId },
    select: { userId: true }
  });
  const hasPred = new Set(existingPreds.map(p => p.userId));
  const missingUsers = users.filter(u => !hasPred.has(u.id));

  if (missingUsers.length === 0) return 0;

  console.log(`Auto-fill: ${missingUsers.length} utenti senza pronostico per evento ${eventId}`);

  let created = 0;

  for (const user of missingUsers) {
    const lastPred = await prisma.prediction.findFirst({
      where: {
        userId: user.id,
        event: {
          seasonId,
          date: { lt: eventDate }
        }
      },
      orderBy: { event: { date: 'desc' } }
    });

    if (lastPred) {
      console.log(`Auto-fill: copio ultimo pronostico per ${user.name} da evento ${lastPred.eventId}`);
      await prisma.prediction.create({
        data: {
          userId: user.id,
          eventId,
          firstPlaceId: lastPred.firstPlaceId,
          secondPlaceId: lastPred.secondPlaceId,
          thirdPlaceId: lastPred.thirdPlaceId,
          rankings: lastPred.rankings ?? undefined
        }
      });
    } else {
      console.log(`Auto-fill: creo pronostico vuoto per ${user.name} (nessun pronostico precedente)`);
      await prisma.prediction.create({
        data: {
          userId: user.id,
          eventId,
        }
      });
    }

    created++;
  }

  return created;
}
