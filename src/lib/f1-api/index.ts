import { OpenF1Client, openF1Client, F1APIError } from './openf1';
import { ErgastClient, ergastClient } from './ergast';
import type {
  ImportableEvent,
  ImportableDriver,
  FetchedResult,
  OpenF1Driver
} from './types';

export { F1APIError } from './openf1';
export type {
  ImportableEvent,
  ImportableDriver,
  FetchedResult,
  OpenF1Meeting,
  OpenF1Session,
  OpenF1Driver,
  OpenF1Position,
  ErgastDriver
} from './types';

export class F1ImportService {
  private openf1: OpenF1Client;
  private ergast: ErgastClient;

  constructor() {
    this.openf1 = openF1Client;
    this.ergast = ergastClient;
  }

  /**
   * Import all events (Races and Sprints) for a year
   * Optimized: only 2 API calls (meetings + all sessions for the year)
   */
  async importEventsForYear(year: number): Promise<ImportableEvent[]> {
    // Fetch meetings and all sessions in parallel (2 API calls total)
    const [meetings, allSessions] = await Promise.all([
      this.openf1.getMeetings(year),
      this.openf1.getSessionsForYear(year)
    ]);

    // Group sessions by meeting_key for fast lookup
    const sessionsByMeeting = new Map<number, typeof allSessions>();
    for (const session of allSessions) {
      const existing = sessionsByMeeting.get(session.meeting_key) || [];
      existing.push(session);
      sessionsByMeeting.set(session.meeting_key, existing);
    }

    const events: ImportableEvent[] = [];

    for (const meeting of meetings) {
      const sessions = sessionsByMeeting.get(meeting.meeting_key) || [];

      // Find Race and Sprint sessions
      const raceSession = sessions.find(s => s.session_name === 'Race');
      const sprintSession = sessions.find(s => s.session_name === 'Sprint');

      if (raceSession) {
        const raceDate = new Date(raceSession.date_start);
        events.push({
          name: `GP ${meeting.country_name}`,
          type: 'RACE',
          date: raceDate,
          closingDate: new Date(raceDate.getTime() - 60 * 60 * 1000), // 1 hour before
          sessionKey: raceSession.session_key,
          meetingKey: meeting.meeting_key,
          circuitName: meeting.circuit_short_name,
          countryName: meeting.country_name,
          countryFlag: meeting.country_flag,
          circuitImage: meeting.circuit_image
        });
      }

      if (sprintSession) {
        const sprintDate = new Date(sprintSession.date_start);
        events.push({
          name: `Sprint ${meeting.country_name}`,
          type: 'SPRINT',
          date: sprintDate,
          closingDate: new Date(sprintDate.getTime() - 60 * 60 * 1000), // 1 hour before
          sessionKey: sprintSession.session_key,
          meetingKey: meeting.meeting_key,
          circuitName: meeting.circuit_short_name,
          countryName: meeting.country_name,
          countryFlag: meeting.country_flag,
          circuitImage: meeting.circuit_image
        });
      }
    }

    // Sort by date
    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Import all drivers for a year with headshots from OpenF1
   */
  async importDriversForYear(year: number): Promise<ImportableDriver[]> {
    // Get basic driver info from Ergast
    const ergastDrivers = await this.ergast.getDrivers(year);

    let openf1Drivers: OpenF1Driver[] = [];
    try {
      openf1Drivers = await this.openf1.getDrivers('latest');
    } catch (error) {
      console.warn('Failed to fetch OpenF1 drivers for headshots:', error);
    }

    const openf1ByAcronym = new Map<string, OpenF1Driver>();
    for (const d of openf1Drivers) {
      if (d.name_acronym) {
        openf1ByAcronym.set(d.name_acronym.toUpperCase(), d);
      }
    }

    // Assign numbers ≥ 100 to drivers without permanentNumber
    let nextFallbackNumber = 100;

    return ergastDrivers
      .map(driver => {
        let driverNumber = parseInt(driver.permanentNumber);

        // Assign fallback number ≥ 100 for drivers without permanent number
        if (!driverNumber || isNaN(driverNumber) || driverNumber <= 0) {
          driverNumber = nextFallbackNumber++;
        }

        const code = (driver.code || '').toUpperCase();
        const openf1Data = code ? openf1ByAcronym.get(code) : undefined;

        return {
          name: `${driver.givenName} ${driver.familyName}`,
          team: openf1Data?.team_name || 'Unknown',
          number: driverNumber,
          driverCode: code || openf1Data?.name_acronym || '',
          imageUrl: openf1Data?.headshot_url || null
        };
      });
  }

  /**
   * Import drivers with fallback (Ergast only, no headshots)
   */
  async importDriversWithFallback(year: number): Promise<ImportableDriver[]> {
    try {
      return await this.importDriversForYear(year);
    } catch (error) {
      console.warn('Full driver import failed, trying basic import:', error);

      // Fallback: Just get driver names from Ergast without headshots
      const ergastDrivers = await this.ergast.getDrivers(year);
      let nextFallbackNumber = 100;

      return ergastDrivers
        .map(d => {
          let driverNumber = parseInt(d.permanentNumber);

          // Assign fallback number ≥ 100 for drivers without permanent number
          if (!driverNumber || isNaN(driverNumber) || driverNumber <= 0) {
            driverNumber = nextFallbackNumber++;
          }

          return {
            name: `${d.givenName} ${d.familyName}`,
            team: 'Unknown',
            number: driverNumber,
            driverCode: d.code || '',
            imageUrl: null
          };
        });
    }
  }

  /**
   * Get event results from OpenF1 using session key
   */
  async getEventResults(sessionKey: number): Promise<FetchedResult[]> {
    const results = await this.openf1.getFinalResults(sessionKey);
    return results.map(r => ({
      position: r.position,
      driverNumber: r.driver_number
    }));
  }
}

// Export singleton instance
export const f1ImportService = new F1ImportService();
