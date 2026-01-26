import type {
  OpenF1Meeting,
  OpenF1Session,
  OpenF1Driver,
  OpenF1Position
} from './types';

const OPENF1_BASE_URL = 'https://api.openf1.org/v1';
const FETCH_TIMEOUT = 10000; // 10 seconds
const REQUEST_DELAY_MS = 500; // Minimum delay between requests
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class F1APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public source?: 'openf1' | 'ergast'
  ) {
    super(message);
    this.name = 'F1APIError';
  }
}

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

export class OpenF1Client {
  private lastRequestTime = 0;

  private async throttle(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < REQUEST_DELAY_MS) {
      await sleep(REQUEST_DELAY_MS - timeSinceLastRequest);
    }
    this.lastRequestTime = Date.now();
  }

  private async fetch<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${OPENF1_BASE_URL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        // Throttle requests to avoid rate limiting
        await this.throttle();

        const response = await fetchWithTimeout(url.toString(), FETCH_TIMEOUT);

        if (response.status === 429) {
          // Rate limited - wait with exponential backoff
          const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
          console.warn(`OpenF1 rate limited, retrying in ${backoffMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
          await sleep(backoffMs);
          continue;
        }

        if (!response.ok) {
          throw new F1APIError(
            `OpenF1 API error: ${response.status} ${response.statusText}`,
            response.status,
            'openf1'
          );
        }

        return response.json();
      } catch (error) {
        if (error instanceof F1APIError && error.statusCode !== 429) throw error;
        if (error instanceof Error && error.name === 'AbortError') {
          throw new F1APIError('OpenF1 API timeout', 408, 'openf1');
        }
        lastError = error instanceof Error ? error : new Error('Unknown error');

        // If not a rate limit error from our check, throw immediately
        if (!(error instanceof F1APIError) && error instanceof Error && error.name !== 'AbortError') {
          throw new F1APIError(
            `OpenF1 API request failed: ${error.message}`,
            undefined,
            'openf1'
          );
        }
      }
    }

    throw new F1APIError(
      `OpenF1 API request failed after ${MAX_RETRIES} retries: ${lastError?.message || 'Rate limited'}`,
      429,
      'openf1'
    );
  }

  /**
   * Get all meetings (Grand Prix events) for a year
   */
  async getMeetings(year: number): Promise<OpenF1Meeting[]> {
    return this.fetch<OpenF1Meeting[]>('/meetings', { year: year.toString() });
  }

  /**
   * Get all sessions for a specific meeting
   */
  async getSessions(meetingKey: number): Promise<OpenF1Session[]> {
    return this.fetch<OpenF1Session[]>('/sessions', { meeting_key: meetingKey.toString() });
  }

  /**
   * Get all sessions for a year (single API call)
   */
  async getSessionsForYear(year: number): Promise<OpenF1Session[]> {
    return this.fetch<OpenF1Session[]>('/sessions', { year: year.toString() });
  }

  /**
   * Get drivers for a session
   */
  async getDrivers(sessionKey: number | 'latest'): Promise<OpenF1Driver[]> {
    return this.fetch<OpenF1Driver[]>('/drivers', { session_key: sessionKey.toString() });
  }

  /**
   * Get driver data by acronym for a session
   */
  async getDriverByAcronym(
    nameAcronym: string,
    sessionKey: number | 'latest' = 'latest'
  ): Promise<OpenF1Driver | null> {
    if (!nameAcronym) return null;
    try {
      const drivers = await this.fetch<OpenF1Driver[]>('/drivers', {
        session_key: sessionKey.toString(),
        name_acronym: nameAcronym
      });
      return drivers[0] || null;
    } catch {
      return null;
    }
  }

  /**
   * Get headshot URL for a specific driver
   */
  async getDriverHeadshot(driverCode: string): Promise<string | null> {
    try {
      const driver = await this.getDriverByAcronym(driverCode, 'latest');
      return driver?.headshot_url || null;
    } catch {
      return null;
    }
  }

  /**
   * Get position data for a session
   */
  async getPositions(sessionKey: number): Promise<OpenF1Position[]> {
    return this.fetch<OpenF1Position[]>('/position', { session_key: sessionKey.toString() });
  }

  /**
   * Get final race results (last position for each driver)
   */
  async getFinalResults(sessionKey: number): Promise<OpenF1Position[]> {
    const positions = await this.getPositions(sessionKey);

    // Get the latest position for each driver (final classification)
    const finalPositions = new Map<number, OpenF1Position>();

    for (const pos of positions) {
      const existing = finalPositions.get(pos.driver_number);
      if (!existing || new Date(pos.date) > new Date(existing.date)) {
        finalPositions.set(pos.driver_number, pos);
      }
    }

    return Array.from(finalPositions.values()).sort((a, b) => a.position - b.position);
  }
}

// Export singleton instance
export const openF1Client = new OpenF1Client();
