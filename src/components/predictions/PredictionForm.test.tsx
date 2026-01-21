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

  it('renders Top 3 mode by default', () => {
    render(
      <PredictionForm 
        event={mockEvent} 
        drivers={mockDrivers} 
        onSubmit={jest.fn()} 
        isLoading={false} 
      />
    )
    
    expect(screen.getByText('Top 3')).toHaveClass('bg-white')
    expect(screen.getByText('🥇 1° Posto (25 punti)')).toBeInTheDocument()
    expect(screen.queryByTestId('sortable-list')).not.toBeInTheDocument()
  })

  it('switches to Grid mode', () => {
    render(
      <PredictionForm 
        event={mockEvent} 
        drivers={mockDrivers} 
        onSubmit={jest.fn()} 
        isLoading={false} 
      />
    )
    
    fireEvent.click(screen.getByText('Griglia Completa'))
    
    expect(screen.getByText('Griglia Completa')).toHaveClass('bg-white')
    expect(screen.getByTestId('sortable-list')).toBeInTheDocument()
    expect(screen.queryByText('🥇 1° Posto (25 punti)')).not.toBeInTheDocument()
  })

  it('syncs Top 3 selection to Grid', () => {
    render(
      <PredictionForm 
        event={mockEvent} 
        drivers={mockDrivers} 
        onSubmit={jest.fn()} 
        isLoading={false} 
      />
    )
    
    // Select Driver 1 for 1st place
    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[0], { target: { value: 'd1' } })
    
    // Switch to Grid
    fireEvent.click(screen.getByText('Griglia Completa'))
    
    // Check if d1 is first in the list
    const listItems = screen.getByTestId('sortable-list').children
    expect(listItems[0]).toHaveTextContent('d1')
  })

  it('syncs Grid order to Top 3', () => {
    render(
      <PredictionForm 
        event={mockEvent} 
        drivers={mockDrivers} 
        onSubmit={jest.fn()} 
        isLoading={false} 
      />
    )
    
    // Switch to Grid
    fireEvent.click(screen.getByText('Griglia Completa'))
    
    // Default order is randomized or sorted. 
    // In our component getInitialOrder sorts by number if no history.
    // Driver 1 (d1) is number 1, so it should be first.
    // Let's click d2 (number 2) to move it to top (as per our mock).
    
    fireEvent.click(screen.getByText('d2'))
    
    // Switch back to Top 3
    fireEvent.click(screen.getByText('Top 3'))
    
    // Check if 1st place select has d2 selected
    const selects = screen.getAllByRole('combobox')
    expect(selects[0]).toHaveValue('d2')
  })
})
