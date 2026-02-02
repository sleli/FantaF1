'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Driver, Event } from '@prisma/client'
import MyPredictionsView from './MyPredictionsView'
import AllPredictionsView from './AllPredictionsView'
import { UserIcon, GlobeAltIcon } from '@heroicons/react/24/outline'

export default function PredictionsDashboard() {
  const { status } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()

  const tabParam = searchParams.get('tab')
  const eventParam = searchParams.get('event')

  const [activeTab, setActiveTab] = useState<'mine' | 'all'>('mine')

  // Shared data
  const [events, setEvents] = useState<Event[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [seasonStatus, setSeasonStatus] = useState<{
    hasActiveSeason: boolean
    isEnabled: boolean
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Sync tab from URL
  useEffect(() => {
    if (tabParam === 'all' || tabParam === 'mine') {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  // Redirect if unauthenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Load shared data once
  useEffect(() => {
    if (status === 'authenticated') {
      loadSharedData()
    }
  }, [status])

  const loadSharedData = async () => {
    try {
      setIsLoading(true)
      const [seasonStatusRes, eventsRes, driversRes] = await Promise.all([
        fetch('/api/user/season-status'),
        fetch('/api/events'),
        fetch('/api/drivers')
      ])

      if (seasonStatusRes.ok) {
        const statusData = await seasonStatusRes.json()
        setSeasonStatus(statusData)
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json()
        setEvents(eventsData.events || [])
      }

      if (driversRes.ok) {
        const driversData = await driversRes.json()
        setDrivers(driversData.drivers?.filter((d: Driver) => d.active) || [])
      }
    } catch (error) {
      console.error('Errore nel caricamento dati:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTabChange = (tab: 'mine' | 'all') => {
    setActiveTab(tab)
    router.push(`/predictions?tab=${tab}`, { scroll: false })
  }

  if (status === 'loading' || (status === 'authenticated' && isLoading)) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-f1-red"></div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-foreground">Pronostici</h1>
        <p className="mt-2 text-muted-foreground">
          Gestisci i tuoi pronostici e confrontali con gli altri giocatori
        </p>
      </div>

      {/* Tab Navigation - Animated Pill */}
      <div className="flex justify-center mb-2">
        <div className="bg-muted/30 p-1 rounded-full border border-border inline-flex relative w-full max-w-[380px]">
          {/* Sliding pill indicator */}
          <div
            className="absolute top-1 bottom-1 rounded-full bg-card shadow-sm transition-all duration-300 ease-in-out"
            style={{
              left: activeTab === 'mine' ? '4px' : '50%',
              width: 'calc(50% - 4px)',
            }}
          />

          <button
            onClick={() => handleTabChange('mine')}
            className={`relative z-10 flex-1 px-4 py-2.5 rounded-full text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'mine'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground/80'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            I miei Pronostici
          </button>

          <button
            onClick={() => handleTabChange('all')}
            className={`relative z-10 flex-1 px-4 py-2.5 rounded-full text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'all'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground/80'
            }`}
          >
            <GlobeAltIcon className="w-4 h-4" />
            Tutti i Pronostici
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === 'mine' ? (
          <MyPredictionsView
            events={events}
            drivers={drivers}
            seasonStatus={seasonStatus}
            initialEventId={eventParam || undefined}
          />
        ) : (
          <AllPredictionsView
            events={events}
            drivers={drivers}
            initialEventId={eventParam || undefined}
          />
        )}
      </div>
    </div>
  )
}
