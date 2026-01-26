// OpenF1 API Types

export interface OpenF1Meeting {
  meeting_key: number;
  meeting_name: string;
  meeting_official_name: string;
  location: string;
  country_key: number;
  country_code: string;
  country_name: string;
  circuit_key: number;
  circuit_short_name: string;
  date_start: string;
  gmt_offset: string;
  year: number;
}

export interface OpenF1Session {
  session_key: number;
  session_name: string; // "Race", "Sprint", "Qualifying", etc.
  session_type: string;
  meeting_key: number;
  date_start: string;
  date_end: string;
}

export interface OpenF1Driver {
  driver_number: number;
  broadcast_name: string;
  full_name: string;
  name_acronym: string; // 3-letter code (VER, HAM, etc.)
  team_name: string;
  team_colour: string;
  headshot_url: string | null;
  country_code: string;
}

export interface OpenF1Position {
  driver_number: number;
  position: number;
  meeting_key: number;
  session_key: number;
  date: string;
}

// Ergast API Types

export interface ErgastDriver {
  driverId: string;
  permanentNumber: string;
  code: string;
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  nationality: string;
}

export interface ErgastResponse {
  MRData: {
    DriverTable?: {
      Drivers: ErgastDriver[];
    };
  };
}

// Internal transformed types

export interface ImportableEvent {
  name: string;
  type: 'RACE' | 'SPRINT';
  date: Date;
  closingDate: Date;
  sessionKey: number;
  meetingKey: number;
  circuitName: string;
  countryName: string;
}

export interface ImportableDriver {
  name: string;
  team: string;
  number: number;
  driverCode: string;
  imageUrl: string | null;
}

export interface FetchedResult {
  position: number;
  driverNumber: number;
}
