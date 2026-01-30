import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';
import { Season } from '@prisma/client';

export const getActiveSeason = unstable_cache(
  async (): Promise<Season | null> => {
    return await prisma.season.findFirst({
      where: { isActive: true },
    });
  },
  ['active-season'],
  {
    revalidate: process.env.NODE_ENV === 'development' ? 1 : 3600, // 1 second in dev, 1 hour in prod
    tags: ['active-season'],
  }
);

/**
 * Returns the active season or throws if none exists.
 * Useful for operations that strictly require an active season.
 */
export async function getRequiredActiveSeason(): Promise<Season> {
    const season = await getActiveSeason();
    if (!season) {
        throw new Error("Nessuna stagione attiva trovata");
    }
    return season;
}
