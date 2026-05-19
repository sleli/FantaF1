/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import SeasonsPage from './page'

function jsonResponse(data: unknown, ok = true) {
  return {
    ok,
    json: async () => data,
  } as Response
}

describe('SeasonsPage scoring config', () => {
  const originalFetch = global.fetch
  const originalAlert = window.alert

  beforeEach(() => {
    window.alert = jest.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    window.alert = originalAlert
    jest.restoreAllMocks()
  })

  it('loads default full-grid constants and submits custom scoringConfig JSON', async () => {
    const fetchMock = jest.fn(async (url: string | URL | Request, init?: RequestInit) => {
      if (init?.method === 'POST') {
        return jsonResponse({ season: { id: 'season-2027' } }, true)
      }

      return jsonResponse({ seasons: [] }, true)
    })
    global.fetch = fetchMock as typeof fetch

    const { container } = render(<SeasonsPage />)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/seasons'))

    fireEvent.click(screen.getByRole('button', { name: /Nuova Stagione|Nuova/i }))

    fireEvent.change(screen.getByPlaceholderText('es. 2025'), {
      target: { value: '2027' },
    })

    const dateInputs = container.querySelectorAll<HTMLInputElement>('input[type="date"]')
    fireEvent.change(dateInputs[0], { target: { value: '2027-01-01' } })
    fireEvent.change(dateInputs[1], { target: { value: '2027-12-31' } })

    const scoringSelect = screen.getByText('Modalità di Gioco').parentElement?.querySelector('select')
    expect(scoringSelect).toBeTruthy()
    fireEvent.change(scoringSelect!, { target: { value: 'FULL_GRID_DIFF' } })

    expect(screen.getAllByDisplayValue('0.8').length).toBeGreaterThan(0)
    const topGridWeightInput = screen.getByText('Peso top grid').parentElement?.querySelector('input')
    expect(topGridWeightInput).toBeTruthy()
    fireEvent.change(topGridWeightInput!, { target: { value: '0.7' } })

    fireEvent.click(screen.getByRole('button', { name: /Crea Stagione/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/seasons',
        expect.objectContaining({ method: 'POST' })
      )
    })

    const postCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')
    const body = JSON.parse(postCall?.[1]?.body as string)

    expect(body.scoringType).toBe('FULL_GRID_DIFF')
    expect(body.scoringConfig).toMatchObject({
      topGridThreshold: 10,
      topGridWeight: 0.7,
      lowerGridWeight: 1.2,
      podiumBonusExact: {
        first: -10,
        firstSecond: -30,
        topThree: -50,
      },
      catchup: {
        gapThreshold: 50,
        multiplier: 0.8,
      },
    })
  })
})
