
'use client'

import { useState, useEffect } from 'react'
import { Season, ScoringType } from '@prisma/client'
import { PencilSquareIcon, UserGroupIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import SeasonDriverSelector from '@/components/admin/SeasonDriverSelector'

export default function SeasonsPage() {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [processing, setProcessing] = useState(false)
  
  // Driver Selector State
  const [showDriverSelector, setShowDriverSelector] = useState(false)
  const [selectedSeasonForDrivers, setSelectedSeasonForDrivers] = useState<Season | null>(null)

  // Edit Mode State
  const [editingSeason, setEditingSeason] = useState<Season | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    scoringType: 'LEGACY_TOP3' as ScoringType,
    driverCount: 20,
    isActive: false
  })

  const fetchSeasons = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/seasons')
      const data = await res.json()
      if (data.seasons) setSeasons(data.seasons)
    } catch (error) {
      console.error('Error fetching seasons:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSeasons()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)
    
    try {
      const url = editingSeason ? `/api/seasons/${editingSeason.id}` : '/api/seasons'
      const method = editingSeason ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (res.ok) {
        closeForm()
        fetchSeasons()
      } else {
        const error = await res.json()
        alert(error.error || 'Errore durante l\'operazione')
      }
    } catch (error) {
      console.error('Error saving season:', error)
      alert('Errore di connessione')
    } finally {
      setProcessing(false)
    }
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingSeason(null)
    setFormData({
        name: '',
        startDate: '',
        endDate: '',
        scoringType: 'LEGACY_TOP3',
        driverCount: 20,
        isActive: false
    })
  }

  const handleEdit = (season: Season) => {
    setEditingSeason(season)
    setFormData({
        name: season.name,
        startDate: new Date(season.startDate).toISOString().split('T')[0],
        endDate: new Date(season.endDate).toISOString().split('T')[0],
        scoringType: season.scoringType,
        driverCount: season.driverCount,
        isActive: season.isActive
    })
    setShowForm(true)
  }

  const handleSetActive = async (seasonId: string) => {
    if (!confirm('Sei sicuro di voler attivare questa stagione? Le altre verranno disattivate.')) return

    setProcessing(true)
    try {
      const res = await fetch(`/api/seasons/${seasonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true })
      })

      if (res.ok) {
        fetchSeasons()
      } else {
        const error = await res.json()
        alert(error.error || 'Errore durante l\'aggiornamento')
      }
    } catch (error) {
      console.error('Error updating season:', error)
      alert('Errore di connessione')
    } finally {
      setProcessing(false)
    }
  }

  const openDriverSelector = (season: Season) => {
    setSelectedSeasonForDrivers(season)
    setShowDriverSelector(true)
  }

  const handleSaveDrivers = async (driverIds: string[]) => {
    if (!selectedSeasonForDrivers) return

    try {
      const res = await fetch(`/api/seasons/${selectedSeasonForDrivers.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverIds })
      })

      if (res.ok) {
        // Optional: Show success message
        fetchSeasons()
      } else {
        alert('Errore durante il salvataggio dei piloti')
      }
    } catch (error) {
      console.error('Error saving drivers:', error)
      alert('Errore di connessione')
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestione Stagioni</h1>
        <button 
            className="bg-f1-red text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            onClick={() => {
                setEditingSeason(null)
                setShowForm(!showForm)
            }}
        >
            <span>{showForm ? 'Chiudi' : '+ Nuova Stagione'}</span>
        </button>
      </div>
      
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">{editingSeason ? 'Modifica Stagione' : 'Nuova Stagione'}</h2>
            <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome Stagione</label>
                        <input 
                            type="text" 
                            required
                            className="w-full border rounded-md p-2"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            placeholder="es. 2025"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Numero Piloti</label>
                        <input 
                            type="number" 
                            required
                            min="1"
                            max="30"
                            className="w-full border rounded-md p-2"
                            value={formData.driverCount}
                            onChange={e => setFormData({...formData, driverCount: parseInt(e.target.value)})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data Inizio</label>
                        <input 
                            type="date" 
                            required
                            className="w-full border rounded-md p-2"
                            value={formData.startDate}
                            onChange={e => setFormData({...formData, startDate: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data Fine</label>
                        <input 
                            type="date" 
                            required
                            className="w-full border rounded-md p-2"
                            value={formData.endDate}
                            onChange={e => setFormData({...formData, endDate: e.target.value})}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Modalità di Gioco</label>
                        <select 
                            className="w-full border rounded-md p-2"
                            value={formData.scoringType}
                            onChange={e => setFormData({...formData, scoringType: e.target.value as ScoringType})}
                        >
                            <option value="LEGACY_TOP3">TOP 3 (Classico)</option>
                            <option value="FULL_GRID_DIFF">Differenza Punti (Griglia Completa)</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            {formData.scoringType === 'LEGACY_TOP3' 
                                ? 'I partecipanti pronosticano i primi 3 classificati. Punteggio basato su accuratezza.' 
                                : 'Pronostico intera griglia. Punteggio basato sulla differenza assoluta tra posizione pronosticata e reale.'}
                        </p>
                    </div>
                </div>
                <div className="flex justify-end pt-4 gap-2">
                    <button 
                        type="button"
                        onClick={closeForm}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                    >
                        Annulla
                    </button>
                    <button 
                        type="submit" 
                        disabled={processing}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {processing ? 'Salvataggio...' : (editingSeason ? 'Aggiorna' : 'Crea Stagione')}
                    </button>
                </div>
            </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-f1-red"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Regole</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stato</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {seasons.map((season) => (
                <tr key={season.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{season.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(season.startDate).toLocaleDateString()} - {new Date(season.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {season.scoringType === 'FULL_GRID_DIFF' ? 'Differenza Griglia' : 'Legacy Top 3'} 
                    <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                        {season.driverCount} piloti
                    </span>
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {season.isActive ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Attiva</span>
                    ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Archiviata</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => openDriverSelector(season)}
                            className="text-gray-600 hover:text-blue-600 p-1 rounded-full hover:bg-blue-50 transition-colors"
                            title="Gestisci Piloti"
                        >
                            <UserGroupIcon className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => handleEdit(season)}
                            className="text-gray-600 hover:text-blue-600 p-1 rounded-full hover:bg-blue-50 transition-colors"
                            title="Modifica Stagione"
                        >
                            <PencilSquareIcon className="h-5 w-5" />
                        </button>
                        {!season.isActive && (
                            <button 
                                onClick={() => handleSetActive(season.id)}
                                disabled={processing}
                                className="text-gray-400 hover:text-green-600 p-1 rounded-full hover:bg-green-50 transition-colors"
                                title="Imposta come Attiva"
                            >
                                <CheckCircleIcon className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
              {seasons.length === 0 && (
                <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">Nessuna stagione trovata</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Driver Selector Modal */}
      {selectedSeasonForDrivers && (
        <SeasonDriverSelector
            isOpen={showDriverSelector}
            onClose={() => setShowDriverSelector(false)}
            onSave={handleSaveDrivers}
            seasonId={selectedSeasonForDrivers.id}
            seasonName={selectedSeasonForDrivers.name}
        />
      )}
    </div>
  )
}
