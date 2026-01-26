'use client'

import { useState, useEffect } from 'react'
import { Driver } from '@prisma/client'
import { validateDriver, hasValidationErrors, F1_2025_TEAMS, type DriverValidationErrors } from '@/lib/validation/driver'
import Button from '@/components/ui/Button'

// Form data type with optional API fields
type DriverFormData = {
  name: string;
  team: string;
  number: number;
  active: boolean;
  seasonId: string;
  imageUrl?: string | null;
  driverCode?: string | null;
};

interface DriverFormProps {
  driver?: Driver
  onSubmit: (data: DriverFormData) => void
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
  const [formData, setFormData] = useState<DriverFormData>({
    name: driver?.name || '',
    team: driver?.team || '',
    number: driver?.number || 0,
    active: driver?.active !== undefined ? driver.active : true,
    seasonId: driver?.seasonId || '',
    imageUrl: driver?.imageUrl || null,
    driverCode: driver?.driverCode || null
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
        <label htmlFor="name" className="block text-sm sm:text-base font-medium text-muted-foreground mb-2">
          Nome Pilota *
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={`w-full px-4 py-3 sm:px-3 sm:py-2 text-base sm:text-sm border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary touch-button ${
            errors.name ? 'border-destructive' : 'border-border'
          }`}
          placeholder="Es. Max Verstappen"
          disabled={isLoading}
        />
        {errors.name && <p className="text-destructive text-sm mt-1">{errors.name}</p>}
      </div>
      
      <div className="relative">
        <label htmlFor="team" className="block text-sm sm:text-base font-medium text-muted-foreground mb-2">
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
          className={`w-full px-4 py-3 sm:px-3 sm:py-2 text-base sm:text-sm border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary touch-button ${
            errors.team ? 'border-destructive' : 'border-border'
          }`}
          placeholder="Es. Red Bull Racing"
          disabled={isLoading}
        />
        {errors.team && <p className="text-destructive text-sm mt-1">{errors.team}</p>}
        
        {/* Team suggestions dropdown */}
        {showTeamSuggestions && teamSuggestions.length > 0 && (
          <div 
            className="absolute z-10 mt-1 w-full bg-card text-card-foreground shadow-lg rounded-md border border-border max-h-60 overflow-auto"
          >
            <ul>
              {teamSuggestions.map((team) => (
                <li 
                  key={team} 
                  className="px-4 py-2 hover:bg-primary/10 cursor-pointer"
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
        <label htmlFor="number" className="block text-sm font-medium text-muted-foreground mb-1">
          Numero *
        </label>
        <input
          type="number"
          id="number"
          min="1"
          max="99"
          value={formData.number}
          onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) || 0 })}
          className={`w-full px-3 py-2 border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
            errors.number ? 'border-destructive' : 'border-border'
          }`}
          placeholder="Es. 1"
          disabled={isLoading}
        />
        {errors.number && <p className="text-destructive text-sm mt-1">{errors.number}</p>}
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="active"
          checked={formData.active}
          onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
          className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
          disabled={isLoading}
        />
        <label htmlFor="active" className="ml-2 block text-sm text-muted-foreground">
          Pilota attivo
        </label>
      </div>
      
      {errors.general && (
        <div className="bg-destructive/10 border-l-4 border-destructive p-4 mt-4">
          <p className="text-destructive">{errors.general}</p>
        </div>
      )}
      
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          isLoading={isLoading}
        >
          {driver ? 'Aggiorna Pilota' : 'Crea Pilota'}
        </Button>
        <Button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          variant="secondary"
        >
          Annulla
        </Button>
      </div>
    </form>
  )
}
