
'use client'

import { useState, useEffect } from 'react'
import { Driver } from '@prisma/client'

interface SeasonDriverSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (driverIds: string[]) => void
  seasonId: string
  seasonName: string
}

export default function SeasonDriverSelector({ isOpen, onClose, onSave, seasonId, seasonName }: SeasonDriverSelectorProps) {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [selectedDriverIds, setSelectedDriverIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Fetch all drivers and current season drivers
  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen, seasonId])

  const loadData = async () => {
    setLoading(true)
    try {
      // 1. Fetch all drivers
      const driversRes = await fetch('/api/admin/drivers')
      const driversData = await driversRes.json()
      
      // 2. Fetch season details (to get associated drivers)
      // Note: We need an endpoint that returns season with drivers. 
      // Assuming /api/seasons returns list, we might need a specific get or just filter.
      // Actually, let's use the list endpoint and find the season, or assume we pass selected IDs?
      // Better: Fetch season details including drivers.
      // Since we don't have a specific GET /api/seasons/[id] that returns full details easily accessible yet (or do we?),
      // let's try to fetch all seasons and find ours, as it includes drivers count but maybe not IDs?
      // Wait, the API GET /api/seasons only includes _count.
      // We need to fetch the specific season with drivers.
      
      // Let's rely on the user passing the initial state or fetch it. 
      // Since we modified the GET /api/seasons to be lightweight, we should probably add a way to get season drivers.
      // Let's create a specialized fetch here.
      
      // Workaround: We will use the /api/admin/drivers endpoint which returns ALL drivers.
      // And we need to know which ones are in the season.
      // We haven't implemented a "get season drivers" endpoint.
      // Let's check if we can add ?seasonId to drivers endpoint?
      
      // For now, let's fetch all drivers, and we need to know which ones are linked.
      // I'll update the component to fetch season details if possible, or just all drivers and assume none selected initially? No that's bad.
      // Let's use the `drivers` relation. 
      // I'll implement a quick check in this component: fetch drivers, and iterate to check their seasons?
      // No, `Driver` model has `seasons`. The GET /api/admin/drivers returns drivers.
      // Does it return the `seasons` relation? Let's check the API code.
      // api/admin/drivers/route.ts:
      // const drivers = await prisma.driver.findMany({ orderBy: { name: 'asc' } });
      // It does NOT include relations by default.
      
      // FIX: I will update `api/admin/drivers/route.ts` to include seasons relation optionally or always.
      // Or better, fetch `/api/seasons` and update it to return drivers if requested?
      // Let's update `api/admin/drivers/route.ts` to include `seasons: { select: { id: true } }`.
      
      const allDrivers = driversData.drivers || []
      setDrivers(allDrivers)
      
      // Now we need to know which are selected.
      // Since we can't easily get that from the current API without modification, 
      // I will update the API first (next step in plan, but I can do it now via another tool call).
      // For this file creation, I'll assume the API returns `seasons` array for each driver.
      
      const selected = new Set<string>()
      allDrivers.forEach((d: any) => {
        if (d.seasons && d.seasons.some((s: any) => s.id === seasonId)) {
          selected.add(d.id)
        }
      })
      setSelectedDriverIds(selected)

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleDriver = (id: string) => {
    const newSelected = new Set(selectedDriverIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedDriverIds(newSelected)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(Array.from(selectedDriverIds))
      onClose()
    } catch (error) {
      console.error('Error saving:', error)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">
            Gestisci Piloti - {seasonName}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <span className="text-2xl">×</span>
          </button>
        </div>

        <div className="p-6 flex-grow overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {drivers.map((driver) => (
                <div 
                  key={driver.id}
                  className={`
                    flex items-center p-3 rounded-lg border cursor-pointer transition-colors
                    ${selectedDriverIds.has(driver.id) 
                      ? 'bg-blue-50 border-blue-500' 
                      : 'bg-white border-gray-200 hover:border-blue-300'}
                  `}
                  onClick={() => toggleDriver(driver.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedDriverIds.has(driver.id)}
                    onChange={() => {}} // Handled by div click
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{driver.name}</div>
                    <div className="text-sm text-gray-500">
                      #{driver.number} • {driver.team}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-between items-center bg-gray-50 rounded-b-lg">
          <div className="text-sm text-gray-600">
            {selectedDriverIds.size} piloti selezionati
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              disabled={saving}
            >
              Annulla
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Salvataggio...' : 'Salva Modifiche'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
