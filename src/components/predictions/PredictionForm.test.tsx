/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import PredictionForm from './PredictionForm'
import { ScoringType } from '@prisma/client'

// Mock DndContext because it uses APIs not available in jsdom
jest.mock('@dnd-kit/core', () => ({
  ...jest.requireActual('@dnd-kit/core'),
  DndContext: ({ children }: any) => <div>{children}</div>,
  useSensor: () => null,
  useSensors: () => null,
}))

// Mock SortableDriverList to simplify testing interactions
jest.mock('./SortableDriverList', () => {
  return function MockSortableDriverList({ orderedDriverIds, onChange }: any) {
    return (
      <div data-testid="sortable-list">
        {orderedDriverIds.map((id: string, index: number) => (
          <div key={id} onClick={() => {
              // Simulate moving this item to top on click for testing
              const newOrder = [...orderedDriverIds]
              const [removed] = newOrder.splice(index, 1)
              newOrder.unshift(removed)
              onChange(newOrder)
          }}>
            {id}
          </div>
        ))}
      </div>
    )
  }
})

const mockEvent = {
  id: '1',
  name: 'Test GP',
  date: new Date(new Date().getTime() + 86400000), // Tomorrow
  closingDate: new Date(new Date().getTime() + 86400000),
  status: 'UPCOMING',
  type: 'RACE',
  seasonId: 's1',
  season: {
    scoringType: ScoringType.LEGACY_TOP3,
    driverCount: 20
  }
} as any

const mockDrivers = [
  { id: 'd1', name: 'Driver 1', number: 1, team: 'Team A', active: true },
  { id: 'd2', name: 'Driver 2', number: 2, team: 'Team B', active: true },
  { id: 'd3', name: 'Driver 3', number: 3, team: 'Team C', active: true },
  { id: 'd4', name: 'Driver 4', number: 4, team: 'Team D', active: true },
] as any

// Mock LocalStorage
const localStorageMock = (function() {
  let store: any = {}
  return {
    getItem: function(key: string) {
      return store[key] || null
    },
    setItem: function(key: string, value: string) {
      store[key] = value.toString()
    },
    clear: function() {
      store = {}
    },
    removeItem: function(key: string) {
      delete store[key]
    }
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('PredictionForm View Modes', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders Legacy Top 3 mode correctly', () => {
    const legacyEvent = { ...mockEvent, season: { scoringType: ScoringType.LEGACY_TOP3 } }
    render(
      <PredictionForm 
        event={legacyEvent} 
        drivers={mockDrivers} 
        onSubmit={jest.fn()} 
        isLoading={false} 
      />
    )
    
    expect(screen.getByRole('button', { name: /Seleziona vincitore/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Seleziona 2° posto/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Seleziona 3° posto/i })).toBeInTheDocument()
    expect(screen.queryByTestId('sortable-list')).not.toBeInTheDocument()
  })

  it('renders Full Grid Diff mode correctly', () => {
    const gridEvent = { ...mockEvent, season: { scoringType: ScoringType.FULL_GRID_DIFF } }
    render(
      <PredictionForm 
        event={gridEvent} 
        drivers={mockDrivers} 
        onSubmit={jest.fn()} 
        isLoading={false} 
      />
    )
    
    expect(screen.getByTestId('sortable-list')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Seleziona vincitore/i })).not.toBeInTheDocument()
  })

  it('pre-fills Legacy prediction correctly', () => {
    const legacyEvent = { ...mockEvent, season: { scoringType: ScoringType.LEGACY_TOP3 } }
    const initialPrediction = {
      firstPlaceId: 'd1',
      secondPlaceId: 'd2',
      thirdPlaceId: 'd3'
    }
    
    render(
      <PredictionForm 
        event={legacyEvent} 
        drivers={mockDrivers} 
        onSubmit={jest.fn()} 
        isLoading={false} 
        initialPrediction={initialPrediction}
      />
    )

    expect(screen.getByRole('button', { name: /1°.*Driver 1/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /2°.*Driver 2/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /3°.*Driver 3/i })).toBeInTheDocument()
  })

  it('pre-fills Grid prediction correctly', () => {
    const gridEvent = { ...mockEvent, season: { scoringType: ScoringType.FULL_GRID_DIFF } }
    // rankings: d3 first, d1 second...
    const initialPrediction = {
      rankings: ['d3', 'd1', 'd2', 'd4']
    }
    
    render(
      <PredictionForm 
        event={gridEvent} 
        drivers={mockDrivers} 
        onSubmit={jest.fn()} 
        isLoading={false} 
        initialPrediction={initialPrediction}
      />
    )
    
    const listItems = screen.getByTestId('sortable-list').children
    expect(listItems[0]).toHaveTextContent('d3')
    expect(listItems[1]).toHaveTextContent('d1')
  })

  it('disabilita il salvataggio finché la selezione Top 3 non è valida', () => {
    const legacyEvent = { ...mockEvent, season: { scoringType: ScoringType.LEGACY_TOP3 } }
    const onSubmit = jest.fn()
    render(
      <PredictionForm
        event={legacyEvent}
        drivers={mockDrivers}
        onSubmit={onSubmit}
        isLoading={false}
      />
    )

    screen.getAllByRole('button', { name: 'Salva Pronostico' }).forEach((btn) => {
      expect(btn).toBeDisabled()
    })

    fireEvent.click(screen.getByRole('button', { name: /Seleziona vincitore/i }))
    fireEvent.click(screen.getByRole('button', { name: /Driver 1/i }))
    fireEvent.click(screen.getByRole('button', { name: /Seleziona 2° posto/i }))
    fireEvent.click(screen.getByRole('button', { name: /Driver 2/i }))
    fireEvent.click(screen.getByRole('button', { name: /Seleziona 3° posto/i }))
    fireEvent.click(screen.getByRole('button', { name: /Driver 3/i }))

    screen.getAllByRole('button', { name: 'Salva Pronostico' }).forEach((btn) => {
      expect(btn).toBeEnabled()
    })
  })

  it('mostra errori dopo interazione quando ci sono campi mancanti', () => {
    const legacyEvent = { ...mockEvent, season: { scoringType: ScoringType.LEGACY_TOP3 } }
    render(
      <PredictionForm
        event={legacyEvent}
        drivers={mockDrivers}
        onSubmit={jest.fn()}
        isLoading={false}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /Seleziona vincitore/i }))
    fireEvent.click(screen.getByRole('button', { name: /Driver 1/i }))

    expect(screen.getByText('Seleziona il pilota per il 2° posto')).toBeInTheDocument()
    expect(screen.getByText('Seleziona il pilota per il 3° posto')).toBeInTheDocument()
  })

  it('in modalità griglia abilita il salvataggio dopo l’inizializzazione dell’ordine', async () => {
    const gridEvent = { ...mockEvent, season: { scoringType: ScoringType.FULL_GRID_DIFF } }
    render(
      <PredictionForm
        event={gridEvent}
        drivers={mockDrivers}
        onSubmit={jest.fn()}
        isLoading={false}
      />
    )

    await waitFor(() => {
      screen.getAllByRole('button', { name: 'Salva Pronostico' }).forEach((btn) => {
        expect(btn).toBeEnabled()
      })
    })
  })
})
