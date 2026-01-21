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
    revalidate: 3600, // 1 hour default
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
