import { NextRequest } from 'next/server';
import { withAuthAPI, apiResponse } from '@/lib/auth/api-auth';
import { f1ImportService, F1APIError } from '@/lib/f1-api';

/**
 * GET: Preview drivers available to import for a year
 * Query params: ?year=2026
 */
async function getHandler(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const yearParam = searchParams.get('year');
  const year = yearParam ? parseInt(yearParam) : null;

  if (!year || isNaN(year) || year < 2023 || year > 2030) {
    return apiResponse(
      { error: 'Anno non valido. Inserire un anno tra 2023 e 2030.' },
      400
    );
  }

  try {
    const drivers = await f1ImportService.importDriversWithFallback(year);

    return apiResponse({
      drivers,
      count: drivers.length,
      year
    });
  } catch (error) {
    console.error('Error fetching F1 drivers:', error);

    if (error instanceof F1APIError) {
      return apiResponse(
        { error: `Errore API F1: ${error.message}` },
        error.statusCode || 500
      );
    }

    return apiResponse(
      { error: 'Impossibile recuperare i piloti F1. Riprova più tardi.' },
      500
    );
  }
}

export const GET = withAuthAPI(getHandler, { requiredRole: 'ADMIN' });
