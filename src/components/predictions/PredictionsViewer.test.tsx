/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import PredictionsViewer from './PredictionsViewer'
import { ScoringType } from '@prisma/client'

const drivers = [
  { id: 'd1', name: 'Driver 1', number: 1, team: 'Team A', active: true },
  { id: 'd2', name: 'Driver 2', number: 2, team: 'Team B', active: true },
  { id: 'd3', name: 'Driver 3', number: 3, team: 'Team C', active: true },
] as any

function makeCompletedEvent(overrides: Partial<any> = {}) {
  return {
    id: 'e1',
    name: "Gran Premio di Monaco 2025",
    type: 'RACE',
    date: new Date('2025-05-25T15:00:00Z'),
    closingDate: new Date('2025-05-23T23:59:59Z'),
    status: 'COMPLETED',
    firstPlaceId: 'd1',
    secondPlaceId: 'd2',
    thirdPlaceId: 'd3',
    results: ['d1', 'd2', 'd3'],
    season: { scoringType: ScoringType.LEGACY_TOP3 },
    ...overrides,
  }
}

function makeUpcomingEvent(overrides: Partial<any> = {}) {
  return {
    id: 'e2',
    name: "Gran Premio d'Australia 2025",
    type: 'RACE',
    date: new Date(Date.now() + 1000 * 60 * 60 * 24),
    closingDate: new Date(Date.now() + 1000 * 60 * 60 * 12),
    status: 'UPCOMING',
    season: { scoringType: ScoringType.LEGACY_TOP3 },
    ...overrides,
  }
}

describe('PredictionsViewer', () => {
  it('mostra la colonna punti quando la gara è completata e i risultati sono disponibili', () => {
    const prediction = {
      id: 'p1',
      eventId: 'e1',
      userId: 'u1',
      createdAt: new Date(),
      updatedAt: new Date(),
      firstPlaceId: 'd1',
      secondPlaceId: 'd2',
      thirdPlaceId: 'd3',
      rankings: null,
      points: 25,
      event: makeCompletedEvent(),
      firstPlace: drivers[0],
      secondPlace: drivers[1],
      thirdPlace: drivers[2],
      user: { id: 'u1', name: 'Mario Rossi' },
    } as any

    render(
      <PredictionsViewer
        predictions={[prediction]}
        drivers={drivers}
      />
    )

    expect(screen.getByText('Completata')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Punti' })).toBeInTheDocument()
    expect(screen.getAllByText('25')[0]).toBeInTheDocument()
  })

  it('mostra il bottone Modifica solo per pronostici modificabili', () => {
    const prediction = {
      id: 'p2',
      eventId: 'e2',
      userId: 'u1',
      createdAt: new Date(),
      updatedAt: new Date(),
      firstPlaceId: 'd1',
      secondPlaceId: 'd2',
      thirdPlaceId: 'd3',
      rankings: null,
      points: null,
      event: makeUpcomingEvent(),
      firstPlace: drivers[0],
      secondPlace: drivers[1],
      thirdPlace: drivers[2],
      user: { id: 'u1', name: 'Mario Rossi' },
    } as any

    render(
      <PredictionsViewer
        predictions={[prediction]}
        drivers={drivers}
        onEdit={jest.fn()}
      />
    )

    expect(screen.getByRole('button', { name: 'Modifica' })).toBeInTheDocument()
  })

  it('mostra il nome utente quando showUserName è true', () => {
    const prediction = {
      id: 'p2',
      eventId: 'e2',
      userId: 'u1',
      createdAt: new Date(),
      updatedAt: new Date(),
      firstPlaceId: 'd1',
      secondPlaceId: 'd2',
      thirdPlaceId: 'd3',
      rankings: null,
      points: null,
      event: makeUpcomingEvent(),
      firstPlace: drivers[0],
      secondPlace: drivers[1],
      thirdPlace: drivers[2],
      user: { id: 'u1', name: 'Mario Rossi' },
    } as any

    render(
      <PredictionsViewer
        predictions={[prediction]}
        drivers={drivers}
        showUserName={true}
      />
    )

    expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
  })
})
