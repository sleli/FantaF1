'use client'

import { useState, useEffect } from 'react'
import { Driver } from '@prisma/client'
import { validateDriver, hasValidationErrors, F1_2025_TEAMS, type DriverValidationErrors } from '@/lib/validation/driver'

interface DriverFormProps {
  driver?: Driver
  onSubmit: (data: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
  isLoading?: boolean
  existingDrivers?: Driver[]
}

export function DriverForm({ 
  driver, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  existingDrivers = []
}: DriverFormProps) {
  const [formData, setFormData] = useState({
    name: driver?.name || '',
    team: driver?.team || '',
    number: driver?.number || 0,
    active: driver?.active !== undefined ? driver.active : true,
    seasonId: driver?.seasonId || ''
  })

  const [errors, setErrors] = useState<DriverValidationErrors>({})
  const [showTeamSuggestions, setShowTeamSuggestions] = useState(false)
  const [teamSuggestions, setTeamSuggestions] = useState<string[]>([...F1_2025_TEAMS])

  // Filter team suggestions based on input
  useEffect(() => {
    if (formData.team.trim() === '') {
      setTeamSuggestions([...F1_2025_TEAMS])
    } else {
      const filtered = F1_2025_TEAMS.filter(team => 
        team.toLowerCase().includes(formData.team.toLowerCase())
      )
      setTeamSuggestions(filtered)
    }
  }, [formData.team])

  const validateForm = () => {
    const validationErrors = validateDriver(formData, existingDrivers, driver?.id)
    setErrors(validationErrors)
    return !hasValidationErrors(validationErrors)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    onSubmit(formData)
  }

  const handleTeamSelect = (team: string) => {
    setFormData(prev => ({ ...prev, team }))
    setShowTeamSuggestions(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
          Nome Pilota *
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={`w-full px-4 py-3 sm:px-3 sm:py-2 text-base sm:text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-button ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Es. Max Verstappen"
          disabled={isLoading}
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>
      
      <div className="relative">
        <label htmlFor="team" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
          Team *
        </label>
        <input
          type="text"
          id="team"
          value={formData.team}
          onChange={(e) => {
            setFormData({ ...formData, team: e.target.value })
            setShowTeamSuggestions(true)
          }}
          onFocus={() => setShowTeamSuggestions(true)}
          className={`w-full px-4 py-3 sm:px-3 sm:py-2 text-base sm:text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-button ${
            errors.team ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Es. Red Bull Racing"
          disabled={isLoading}
        />
        {errors.team && <p className="text-red-500 text-sm mt-1">{errors.team}</p>}
        
        {/* Team suggestions dropdown */}
        {showTeamSuggestions && teamSuggestions.length > 0 && (
          <div 
            className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto"
          >
            <ul>
              {teamSuggestions.map((team) => (
                <li 
                  key={team} 
                  className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
                  onClick={() => handleTeamSelect(team)}
                >
                  {team}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <div>
        <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-1">
          Numero *
        </label>
        <input
          type="number"
          id="number"
          min="1"
          max="99"
          value={formData.number}
          onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) || 0 })}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.number ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Es. 1"
          disabled={isLoading}
        />
        {errors.number && <p className="text-red-500 text-sm mt-1">{errors.number}</p>}
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="active"
          checked={formData.active}
          onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          disabled={isLoading}
        />
        <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
          Pilota attivo
        </label>
      </div>
      
      {errors.general && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-4">
          <p className="text-red-700">{errors.general}</p>
        </div>
      )}
      
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Salvando...' : (driver ? 'Aggiorna Pilota' : 'Crea Pilota')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Annulla
        </button>
      </div>
    </form>
  )
}
