/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
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
    
    expect(screen.getByText('🥇 1° Posto (25 punti)')).toBeInTheDocument()
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
    expect(screen.queryByText('🥇 1° Posto (25 punti)')).not.toBeInTheDocument()
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
    
    const selects = screen.getAllByRole('combobox')
    expect(selects[0]).toHaveValue('d1')
    expect(selects[1]).toHaveValue('d2')
    expect(selects[2]).toHaveValue('d3')
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
})
