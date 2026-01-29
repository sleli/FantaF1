'use client'

import { useState } from 'react'

interface UserSeasonToggleProps {
  userId: string
  seasonId: string
  isEnabled: boolean
  onToggle?: (newValue: boolean) => void
}

export default function UserSeasonToggle({
  userId,
  seasonId,
  isEnabled: initialValue,
  onToggle
}: UserSeasonToggleProps) {
  const [isEnabled, setIsEnabled] = useState(initialValue)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}/seasons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seasonId, isEnabled: !isEnabled })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Errore')
      }

      setIsEnabled(!isEnabled)
      onToggle?.(!isEnabled)
    } catch (error) {
      console.error('Error toggling season:', error)
      alert(error instanceof Error ? error.message : 'Errore nel salvataggio')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        ${isEnabled ? 'bg-green-500' : 'bg-gray-500'}
        ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
      `}
      title={isEnabled ? 'Abilitato per la stagione' : 'Non abilitato per la stagione'}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
          ${isEnabled ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  )
}
