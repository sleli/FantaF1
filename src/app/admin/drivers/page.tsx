'use client'

import { useState, useEffect } from 'react'
import { Driver } from '@prisma/client'
import { DriverForm } from '@/components/admin/DriverForm'
import { DriverList } from '@/components/admin/DriverList'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function DriversAdminPage() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Fetch drivers on component mount
  useEffect(() => {
    fetchDrivers()
  }, [])

  const fetchDrivers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/drivers')
      
      if (!response.ok) {
        throw new Error('Failed to fetch drivers')
      }
      
      const data = await response.json()
      setDrivers(data.drivers || [])
    } catch (error) {
      console.error('Error fetching drivers:', error)
      setError('Errore nel caricamento dei piloti')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateDriver = async (driverData: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(driverData)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create driver')
      }
      
      setSuccess('Pilota creato con successo')
      setShowForm(false)
      await fetchDrivers()
    } catch (error: any) {
      console.error('Error creating driver:', error)
      setError(error.message || 'Errore nella creazione del pilota')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateDriver = async (driverData: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingDriver) return
    
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/admin/drivers/${editingDriver.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(driverData)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update driver')
      }
      
      setSuccess('Pilota aggiornato con successo')
      setEditingDriver(null)
      await fetchDrivers()
    } catch (error: any) {
      console.error('Error updating driver:', error)
      setError(error.message || 'Errore nell\'aggiornamento del pilota')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteDriver = async (driver: Driver) => {
    if (!confirm(`Sei sicuro di voler eliminare il pilota ${driver.name}?`)) {
      return
    }
    
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/admin/drivers/${driver.id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete driver')
      }
      
      if (data.message?.includes('inactive')) {
        setSuccess(`Il pilota ${driver.name} è stato disattivato perché utilizzato in pronostici o risultati`)
      } else {
        setSuccess(`Pilota ${driver.name} eliminato con successo`)
      }
      
      await fetchDrivers()
    } catch (error: any) {
      console.error('Error deleting driver:', error)
      setError(error.message || 'Errore nell\'eliminazione del pilota')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditDriver = (driver: Driver) => {
    setEditingDriver(driver)
    setShowForm(false)
  }

  const handleCancelEdit = () => {
    setEditingDriver(null)
    setShowForm(false)
  }

  const handleShowForm = () => {
    setEditingDriver(null)
    setShowForm(true)
  }

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null)
        setSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestione Piloti</h1>
          <p className="text-muted-foreground mt-1">
            Gestisci i piloti di Formula 1 per la stagione corrente
          </p>
        </div>
        <Button
          onClick={handleShowForm}
          disabled={isLoading || showForm || !!editingDriver}
        >
          + Aggiungi Pilota
        </Button>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-md">
          {success}
        </div>
      )}

      {/* Form Section */}
      {(showForm || editingDriver) && (
        <Card className="mb-6">
          <div className="p-6">
          <h2 className="text-lg font-semibold mb-4 text-foreground">
            {editingDriver ? `Modifica Pilota: ${editingDriver.name}` : 'Nuovo Pilota'}
          </h2>
          <DriverForm
            driver={editingDriver || undefined}
            onSubmit={editingDriver ? handleUpdateDriver : handleCreateDriver}
            onCancel={handleCancelEdit}
            isLoading={isLoading}
            existingDrivers={drivers}
          />
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Totale Piloti</h3>
          <p className="text-2xl font-bold text-foreground">{drivers.length}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Piloti Attivi</h3>
          <p className="text-2xl font-bold text-green-500">
            {drivers.filter(d => d.active).length}
          </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Piloti Inattivi</h3>
          <p className="text-2xl font-bold text-destructive">
            {drivers.filter(d => !d.active).length}
          </p>
          </div>
        </Card>
      </div>

      {/* Drivers List */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-foreground">
          Lista Piloti ({drivers.length})
        </h2>
        {isLoading && !showForm && !editingDriver ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-muted-foreground">Caricamento piloti...</p>
          </div>
        ) : (
          <DriverList
            drivers={drivers}
            onEdit={handleEditDriver}
            onDelete={handleDeleteDriver}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  )
}
