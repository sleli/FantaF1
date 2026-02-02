import { useEffect, useMemo, useState } from 'react'
import { Driver, EventStatus, EventType, ScoringType } from '@prisma/client'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

import DriverAvatar from '@/components/ui/DriverAvatar'
import { POINTS, PredictionWithDetails } from '@/lib/types'
import { MAX_PENALTY } from '@/lib/scoring'

type ViewerScope = 'personal' | 'all'

export type PredictionsViewerProps = {
  personalPredictions?: PredictionWithDetails[]
  allPredictions?: PredictionWithDetails[]
  drivers: Driver[]
  isLoading?: boolean
  defaultScope?: ViewerScope
  onEdit?: (prediction: PredictionWithDetails) => void
  onDelete?: (predictionId: string) => void
}

function formatDateTime(value: string | Date) {
  const d = typeof value === 'string' ? new Date(value) : value
  return d.toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function deriveCircuitFromName(name: string) {
  let n = name.trim()
  n = n.replace(/^Gran Premio\s+/i, '').replace(/^Sprint\s+/i, '')
  n = n.replace(/\s+\d{4}\s*$/i, '')
  n = n.replace(/^d[’']?/i, '')
  n = n.replace(/^(di|del|della|dell[’']|degli|delle)\s+/i, '')
  n = n.replace(/^[’']+/, '')
  return n.trim()
}

function getDerivedStatus(event: { status: EventStatus; date: Date | string; closingDate: Date | string }) {
  const now = new Date()
  const start = new Date(event.date)
  const closing = new Date(event.closingDate)

  if (event.status === 'COMPLETED') return 'completed'
  if (now >= start) return 'in_progress'
  if (now >= closing || event.status === 'CLOSED') return 'closed'
  return 'future'
}

function StatusBadge({ event }: { event: { status: EventStatus; date: Date | string; closingDate: Date | string } }) {
  const derived = getDerivedStatus(event)
  if (derived === 'completed') return <Badge variant="success">Completata</Badge>
  if (derived === 'in_progress') return <Badge variant="warning">In corso</Badge>
  if (derived === 'closed') return <Badge variant="warning">Chiusa</Badge>
  return <Badge variant="info">Non iniziata</Badge>
}

function canModify(event: { status: EventStatus; closingDate: Date | string }) {
  const now = new Date()
  const closing = new Date(event.closingDate)
  return event.status === 'UPCOMING' && now < closing
}

function getScoringType(prediction: PredictionWithDetails) {
  return (prediction.event as any).season?.scoringType || ScoringType.LEGACY_TOP3
}

function getEventResults(prediction: PredictionWithDetails) {
  const event = prediction.event as any
  const scoringType = getScoringType(prediction)

  if (event.status !== 'COMPLETED') return null

  if (scoringType === ScoringType.FULL_GRID_DIFF) {
    const res = event.results
    if (!Array.isArray(res)) return null
    return { scoringType, results: res as string[] }
  }

  if (!event.firstPlaceId || !event.secondPlaceId || !event.thirdPlaceId) return null
  return {
    scoringType,
    results: [event.firstPlaceId, event.secondPlaceId, event.thirdPlaceId] as string[],
  }
}

function formatPoints(value: number) {
  if (Number.isInteger(value)) return `${value}`
  return value.toFixed(1)
}

function PredictionTable({
  prediction,
  driversById,
}: {
  prediction: PredictionWithDetails
  driversById: Map<string, Driver>
}) {
  if ((prediction as any).isHidden) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/40 p-4 text-center">
        <div className="text-sm font-medium text-muted-foreground">Pronostico nascosto</div>
        <div className="mt-1 text-xs text-muted-foreground">Visibile al termine dell’evento</div>
      </div>
    )
  }

  const scoringType = getScoringType(prediction)
  const eventResult = getEventResults(prediction)
  const eventType = prediction.event.type as EventType

  const predictedIdsRaw =
    scoringType === ScoringType.FULL_GRID_DIFF
      ? (((prediction.rankings as any) as unknown[]) || [])
      : [prediction.firstPlaceId, prediction.secondPlaceId, prediction.thirdPlaceId]

  const predictedIds = predictedIdsRaw.filter((id): id is string => typeof id === 'string' && id.length > 0)

  const actualRankings = eventResult?.results || null

  const pointsConfig = eventType === 'RACE' ? POINTS.RACE : POINTS.SPRINT
  const sprintMultiplier = eventType === 'SPRINT' ? 0.5 : 1

  const rows = predictedIds.map((driverId, index) => {
    const driver =
      driversById.get(driverId) ||
      (prediction.firstPlace?.id === driverId
        ? prediction.firstPlace
        : prediction.secondPlace?.id === driverId
          ? prediction.secondPlace
          : prediction.thirdPlace?.id === driverId
            ? prediction.thirdPlace
            : undefined)
    let points: number | null = null

    if (actualRankings && eventResult) {
      if (eventResult.scoringType === ScoringType.FULL_GRID_DIFF) {
        const actualIndex = actualRankings.indexOf(driverId)
        const penalty = actualIndex === -1 ? MAX_PENALTY : Math.abs(index - actualIndex)
        points = penalty * sprintMultiplier
      } else {
        const actualIndex = actualRankings.indexOf(driverId)
        if (actualIndex === index) {
          points =
            index === 0
              ? pointsConfig.FIRST_CORRECT
              : index === 1
                ? pointsConfig.SECOND_CORRECT
                : pointsConfig.THIRD_CORRECT
        } else if (actualIndex !== -1) {
          points = pointsConfig.PRESENT_WRONG_POSITION
        } else {
          points = 0
        }
      }
    }

    return {
      position: index + 1,
      driver,
      driverName: driver?.name || '—',
      team: driver?.team || '—',
      imageUrl: driver?.imageUrl || null,
      points,
    }
  })

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th scope="col" className="px-3 py-2 text-left w-14">Pos</th>
            <th scope="col" className="px-3 py-2 text-left">Pilota</th>
            <th scope="col" className="px-3 py-2 text-left hidden sm:table-cell">Squadra</th>
            {eventResult && (
              <th scope="col" className="px-3 py-2 text-right w-20">Punti</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={`${prediction.id}-${row.position}`} className="bg-card">
              <td className="px-3 py-2 tabular-nums text-muted-foreground">{row.position}</td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  {row.driver && (
                    <DriverAvatar imageUrl={row.imageUrl} name={row.driverName} size="xs" />
                  )}
                  <span className="font-medium text-foreground">{row.driverName}</span>
                </div>
              </td>
              <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell">{row.team}</td>
              {eventResult && (
                <td className="px-3 py-2 tabular-nums text-right text-foreground">
                  {row.points === null ? '—' : formatPoints(row.points)}
                </td>
              )}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr className="bg-card">
              <td colSpan={eventResult ? 4 : 3} className="px-3 py-4 text-center text-muted-foreground">
                Nessun pilota disponibile
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default function PredictionsViewer({
  personalPredictions = [],
  allPredictions = [],
  drivers,
  isLoading = false,
  defaultScope = 'personal',
  onEdit,
  onDelete,
}: PredictionsViewerProps) {
  const hasPersonal = personalPredictions.length > 0
  const hasAll = allPredictions.length > 0
  const initialScope: ViewerScope = defaultScope === 'all' && hasAll ? 'all' : 'personal'
  const [scope, setScope] = useState<ViewerScope>(initialScope)

  // Sincronizza scope quando cambiano i dati (fix: allPredictions è vuoto al mount iniziale)
  useEffect(() => {
    if (defaultScope === 'all' && allPredictions.length > 0) {
      setScope('all')
    }
  }, [defaultScope, allPredictions.length])

  const driversById = useMemo(() => {
    const map = new Map<string, Driver>()
    for (const d of drivers) map.set(d.id, d)
    return map
  }, [drivers])

  const activePredictions = scope === 'all' ? allPredictions : personalPredictions

  const groupedByEvent = useMemo(() => {
    const groups = new Map<string, { event: any; predictions: PredictionWithDetails[] }>()
    for (const p of activePredictions) {
      const eventId = p.event.id
      const existing = groups.get(eventId)
      if (existing) {
        existing.predictions.push(p)
      } else {
        groups.set(eventId, { event: p.event, predictions: [p] })
      }
    }
    return Array.from(groups.values()).sort((a, b) => new Date(b.event.date).getTime() - new Date(a.event.date).getTime())
  }, [activePredictions])

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-border">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-foreground">Pronostici</h2>
            <p className="mt-1 text-sm text-muted-foreground">Visualizza i dettagli per gara.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-end">
            {(hasPersonal && hasAll) && (
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setScope('personal')}
                  className={`px-4 py-2 text-sm font-semibold ${
                    scope === 'personal'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  I miei
                </button>
                <button
                  type="button"
                  onClick={() => setScope('all')}
                  className={`px-4 py-2 text-sm font-semibold border-l border-border ${
                    scope === 'all'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Tutti
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-6">
          <div className="space-y-3">
            <div className="h-4 w-48 bg-muted rounded" />
            <div className="h-24 bg-muted rounded" />
            <div className="h-24 bg-muted rounded" />
          </div>
        </div>
      ) : groupedByEvent.length === 0 ? (
        <div className="p-10 text-center">
          <div className="text-sm font-medium text-foreground">Nessun pronostico</div>
          <div className="mt-1 text-sm text-muted-foreground">Nessun pronostico disponibile.</div>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {groupedByEvent.map(({ event, predictions }) => {
            const circuit = deriveCircuitFromName(event.name)
            return (
              <div key={event.id} className="px-4 sm:px-6 py-5 sm:py-6">
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {event.countryFlag && (
                          <img src={event.countryFlag} alt="" className="w-6 h-4 object-cover rounded-sm" />
                        )}
                        <h3 className="text-lg font-semibold text-foreground truncate">{event.name}</h3>
                        <StatusBadge event={event} />
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground/80">{circuit}</span>
                        <span className="mx-2">•</span>
                        <span>{formatDateTime(event.date)}</span>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">{event.type === 'RACE' ? 'Gran Premio' : 'Sprint'}</div>
                  </div>

                  <div className="divide-y divide-border">
                    {predictions.map((prediction) => {
                      const isPersonalMode = scope === 'personal'
                      const showEdit = isPersonalMode && canModify(prediction.event) && !!onEdit
                      const showDelete = isPersonalMode && canModify(prediction.event) && !!onDelete

                      return (
                        <div key={prediction.id} className="py-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              {scope === 'all' ? (
                                <div className="text-sm text-muted-foreground">
                                  <span className="font-semibold text-foreground">{(prediction as any).user?.name || 'Utente'}</span>
                                  {(prediction as any).points !== null && typeof (prediction as any).points !== 'undefined' && (
                                    <span className="ml-2 tabular-nums">• {formatPoints((prediction as any).points)} pt</span>
                                  )}
                                </div>
                              ) : (
                                <div className="text-sm text-muted-foreground">
                                  {(prediction as any).points !== null && typeof (prediction as any).points !== 'undefined'
                                    ? <span className="tabular-nums">Punti: {formatPoints((prediction as any).points)} </span>
                                    : <span>In attesa dei risultati</span>
                                  }
                                </div>
                              )}
                            </div>

                            {(showEdit || showDelete) && (
                              <div className="flex gap-2">
                                {showEdit && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onEdit?.(prediction)}
                                  >
                                    Modifica
                                  </Button>
                                )}
                                {showDelete && (
                                  <Button
                                    type="button"
                                    variant="danger"
                                    size="sm"
                                    onClick={() => onDelete?.(prediction.id)}
                                  >
                                    Elimina
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="mt-3">
                            <PredictionTable prediction={prediction} driversById={driversById} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
