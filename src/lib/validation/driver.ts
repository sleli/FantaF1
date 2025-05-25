import { Driver } from '@prisma/client'

export interface DriverValidationErrors {
  name?: string
  team?: string
  number?: string
  general?: string
}

export function validateDriver(
  driver: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>,
  existingDrivers: Driver[] = [],
  editingDriverId?: string
): DriverValidationErrors {
  const errors: DriverValidationErrors = {}

  // Name validation
  if (!driver.name || driver.name.trim().length === 0) {
    errors.name = 'Il nome del pilota è obbligatorio'
  } else if (driver.name.trim().length < 2) {
    errors.name = 'Il nome deve essere di almeno 2 caratteri'
  } else if (driver.name.trim().length > 50) {
    errors.name = 'Il nome non può superare i 50 caratteri'
  }

  // Team validation
  if (!driver.team || driver.team.trim().length === 0) {
    errors.team = 'Il team è obbligatorio'
  } else if (driver.team.trim().length < 2) {
    errors.team = 'Il nome del team deve essere di almeno 2 caratteri'
  } else if (driver.team.trim().length > 50) {
    errors.team = 'Il nome del team non può superare i 50 caratteri'
  }

  // Number validation
  if (!driver.number || driver.number <= 0) {
    errors.number = 'Il numero del pilota è obbligatorio e deve essere maggiore di 0'
  } else if (driver.number > 99) {
    errors.number = 'Il numero del pilota non può essere maggiore di 99'
  } else {
    // Check if number is already used by another driver
    const existingDriverWithNumber = existingDrivers.find(
      d => d.number === driver.number && d.id !== editingDriverId
    )
    if (existingDriverWithNumber) {
      errors.number = `Il numero ${driver.number} è già utilizzato da ${existingDriverWithNumber.name}`
    }
  }

  return errors
}

export function hasValidationErrors(errors: DriverValidationErrors): boolean {
  return Object.keys(errors).length > 0
}

// F1 2025 teams for validation/suggestions
export const F1_2025_TEAMS = [
  'Red Bull Racing',
  'Mercedes',
  'Ferrari',
  'McLaren',
  'Aston Martin',
  'Alpine',
  'Williams',
  'AlphaTauri',
  'Alfa Romeo',
  'Haas'
] as const

export type F1Team = typeof F1_2025_TEAMS[number]

export function isValidF1Team(team: string): team is F1Team {
  return F1_2025_TEAMS.includes(team as F1Team)
}
