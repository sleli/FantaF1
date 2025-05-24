import { User, Driver, Event, Prediction, UserRole, EventType, EventStatus } from '@prisma/client'

// Tipi estesi per le query con relazioni
export type UserWithPredictions = User & {
  predictions: Prediction[]
}

export type PredictionWithDetails = Prediction & {
  user: User
  event: Event
  firstPlace: Driver
  secondPlace: Driver
  thirdPlace: Driver
}

export type EventWithPredictions = Event & {
  predictions: PredictionWithDetails[]
  firstPlace?: Driver
  secondPlace?: Driver
  thirdPlace?: Driver
}

export type EventWithResults = Event & {
  firstPlace?: Driver
  secondPlace?: Driver
  thirdPlace?: Driver
}

// Tipi per form e API
export type CreateEventData = {
  name: string
  type: EventType
  date: string
  closingDate: string
}

export type CreatePredictionData = {
  eventId: string
  firstPlaceId: string
  secondPlaceId: string
  thirdPlaceId: string
}

export type UpdateEventResultsData = {
  firstPlaceId: string
  secondPlaceId: string
  thirdPlaceId: string
}

// Tipi per classifiche
export type LeaderboardEntry = {
  user: User
  totalPoints: number
  eventCount: number
  averagePoints: number
}

export type EventLeaderboardEntry = {
  user: User
  prediction: PredictionWithDetails | null
  points: number | null
}

// Utility types
export { UserRole, EventType, EventStatus } from '@prisma/client'

// Costanti per punteggi
export const POINTS = {
  RACE: {
    FIRST_CORRECT: 25,
    SECOND_CORRECT: 15,
    THIRD_CORRECT: 10,
    PRESENT_WRONG_POSITION: 5
  },
  SPRINT: {
    FIRST_CORRECT: 12.5,
    SECOND_CORRECT: 7.5,
    THIRD_CORRECT: 5,
    PRESENT_WRONG_POSITION: 2.5
  }
} as const
