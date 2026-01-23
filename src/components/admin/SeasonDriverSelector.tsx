'use client'

import { useState, useEffect } from 'react'
import { Driver } from '@prisma/client'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { XMarkIcon, UserGroupIcon } from '@heroicons/react/24/outline'

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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card variant="default" className="w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <UserGroupIcon className="h-6 w-6 text-primary" />
            Piloti Stagione {seasonName}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4 bg-primary/10 border-b border-primary/20 text-primary text-sm">
          <p>
            I piloti sono ora gestiti specificamente per ogni stagione. 
            Per aggiungere, modificare o rimuovere piloti, utilizza la pagina <Link href="/admin/drivers" className="underline font-bold hover:text-foreground transition-colors">Gestione Piloti</Link>.
          </p>
        </div>

        <div className="p-6 flex-grow overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-f1-red"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {drivers.length > 0 ? (
                drivers.map((driver) => (
                  <div 
                    key={driver.id}
                    className="flex items-center p-3 rounded-lg border border-border bg-muted/40 hover:bg-muted transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary border border-primary/30 flex items-center justify-center mr-3 text-sm font-bold">
                      {driver.number}
                    </div>
                    <div>
                      <div className="font-bold text-foreground">{driver.name}</div>
                      <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                        {driver.team}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  Nessun pilota trovato in questa stagione.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border flex justify-between items-center bg-muted rounded-b-xl">
          <div className="text-sm text-muted-foreground">
            <span className="font-bold text-foreground">{drivers.length}</span> piloti presenti
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
            >
              Chiudi
            </Button>
            <Link href="/admin/drivers">
              <Button variant="primary">
                Gestisci Piloti
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}
