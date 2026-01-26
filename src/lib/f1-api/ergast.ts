import type { ErgastDriver, ErgastResponse } from './types';
import { F1APIError } from './openf1';

const ERGAST_BASE_URL = 'https://api.jolpi.ca/ergast/f1';
const FETCH_TIMEOUT = 10000; // 10 seconds

async function fetchWithTimeout(url: string, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export class ErgastClient {
  private async fetch<T>(endpoint: string): Promise<T> {
    const url = `${ERGAST_BASE_URL}${endpoint}`;

    try {
      const response = await fetchWithTimeout(url, FETCH_TIMEOUT);

      if (!response.ok) {
        throw new F1APIError(
          `Ergast API error: ${response.status} ${response.statusText}`,
          response.status,
          'ergast'
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof F1APIError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new F1APIError('Ergast API timeout', 408, 'ergast');
      }
      throw new F1APIError(
        `Ergast API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        'ergast'
      );
    }
  }

  /**
   * Get all drivers for a season
   */
  async getDrivers(year: number): Promise<ErgastDriver[]> {
    const data = await this.fetch<ErgastResponse>(`/${year}/drivers.json`);
    return data.MRData?.DriverTable?.Drivers || [];
  }
}

// Export singleton instance
export const ergastClient = new ErgastClient();
