'use client'

import { useState, useEffect } from 'react'
import { Driver } from '@prisma/client'
import Link from 'next/link'

interface SeasonDriverSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (driverIds: string[]) => void // Kept for compatibility but unused
  seasonId: string
  seasonName: string
}

export default function SeasonDriverSelector({ isOpen, onClose, seasonId, seasonName }: SeasonDriverSelectorProps) {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch all drivers (which are now strictly scoped to active season)
  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen, seasonId])

  const loadData = async () => {
    setLoading(true)
    try {
      const driversRes = await fetch('/api/admin/drivers')
      const driversData = await driversRes.json()
      
      const allDrivers = driversData.drivers || []
      setDrivers(allDrivers)
      
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">
            Piloti Stagione {seasonName}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <span className="text-2xl">×</span>
          </button>
        </div>

        <div className="p-4 bg-blue-50 border-b border-blue-100 text-blue-800 text-sm">
          <p>
            I piloti sono ora gestiti specificamente per ogni stagione. 
            Per aggiungere, modificare o rimuovere piloti, utilizza la pagina <Link href="/admin/drivers" className="underline font-semibold hover:text-blue-900">Gestione Piloti</Link>.
          </p>
        </div>

        <div className="p-6 flex-grow overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {drivers.length > 0 ? (
                drivers.map((driver) => (
                  <div 
                    key={driver.id}
                    className="flex items-center p-3 rounded-lg border border-gray-200 bg-white"
                  >
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 text-sm font-bold text-gray-600">
                      {driver.number}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{driver.name}</div>
                      <div className="text-sm text-gray-500">
                        {driver.team}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-8 text-gray-500">
                  Nessun pilota trovato in questa stagione.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-between items-center bg-gray-50 rounded-b-lg">
          <div className="text-sm text-gray-600">
            {drivers.length} piloti presenti
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Chiudi
            </button>
            <Link
                href="/admin/drivers"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
                Gestisci Piloti
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
