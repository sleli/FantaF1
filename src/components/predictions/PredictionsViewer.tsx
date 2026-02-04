import { useMemo, useState } from 'react'
import { Driver, EventStatus, EventType, ScoringType } from '@prisma/client'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import DriverAvatar from '@/components/ui/DriverAvatar'
import { POINTS, PredictionWithDetails } from '@/lib/types'
import { MAX_PENALTY } from '@/lib/scoring'
import { ChevronDownIcon, UserIcon } from '@heroicons/react/24/outline'

export type PredictionsViewerProps = {
  predictions: PredictionWithDetails[]
  drivers: Driver[]
  isLoading?: boolean
  showUserName?: boolean
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
    <div className="overflow-hidden rounded-lg border border-border mt-4">
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

function PredictionRow({
  prediction,
  driversById,
  showUserName,
  onEdit,
  onDelete,
}: {
  prediction: PredictionWithDetails
  driversById: Map<string, Driver>
  showUserName: boolean
  onEdit?: (prediction: PredictionWithDetails) => void
  onDelete?: (predictionId: string) => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isHidden = (prediction as any).isHidden
  const scoringType = getScoringType(prediction)

  const showEdit = canModify(prediction.event) && !!onEdit
  const showDelete = canModify(prediction.event) && !!onDelete

  const top3DriverIds = useMemo(() => {
    if (isHidden) return []
    if (scoringType === ScoringType.FULL_GRID_DIFF) {
      return (((prediction.rankings as any) as unknown[]) || []).slice(0, 3) as string[]
    }
    return [prediction.firstPlaceId, prediction.secondPlaceId, prediction.thirdPlaceId].filter(Boolean) as string[]
  }, [prediction, isHidden, scoringType])

  const top3Drivers = top3DriverIds.map(id => driversById.get(id)).filter(Boolean) as Driver[]

  return (
    <div className={`rounded-lg border transition-all duration-200 ${isExpanded ? 'border-primary/40 bg-muted/20' : 'border-border bg-card hover:border-primary/30'}`}>
      <div 
        className="p-4 cursor-pointer"
        onClick={() => !isHidden && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Left: User Info & Points */}
          <div className="flex items-center gap-3 min-w-0">
            {showUserName && (
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {(prediction as any).user?.name || 'Utente'}
                  </p>
                  {(prediction as any).points !== null && typeof (prediction as any).points !== 'undefined' && (
                     <p className="text-xs text-muted-foreground">
                       {formatPoints((prediction as any).points)} pt
                     </p>
                  )}
                </div>
              </div>
            )}
            
            {!showUserName && (
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">Il tuo pronostico</span>
                {(prediction as any).points !== null && typeof (prediction as any).points !== 'undefined' ? (
                  <span className="text-xs text-muted-foreground font-medium text-primary">
                    {formatPoints((prediction as any).points)} punti
                  </span>
                ) : (
                   <span className="text-xs text-muted-foreground">In attesa</span>
                )}
              </div>
            )}
          </div>

          {/* Right: Preview & Toggle */}
          <div className="flex items-center gap-4">
            {/* Driver Preview (Desktop/Tablet) */}
            <div className="hidden sm:flex items-center -space-x-2">
              {isHidden ? (
                <span className="text-xs text-muted-foreground italic">Nascosto</span>
              ) : (
                top3Drivers.map((driver, idx) => (
                  <div key={driver.id} className="relative z-10 ring-2 ring-background rounded-full">
                    <DriverAvatar imageUrl={driver.imageUrl} name={driver.name} size="xs" />
                  </div>
                ))
              )}
            </div>

            <button 
              className={`p-1 rounded-full hover:bg-muted transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              disabled={isHidden}
            >
              <ChevronDownIcon className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Mobile Driver Preview (if not expanded) */}
        {!isExpanded && !isHidden && (
          <div className="mt-3 flex sm:hidden items-center justify-between border-t border-border/50 pt-3">
             <div className="flex items-center -space-x-2">
                {top3Drivers.map((driver) => (
                  <div key={driver.id} className="relative z-10 ring-2 ring-background rounded-full">
                    <DriverAvatar imageUrl={driver.imageUrl} name={driver.name} size="xs" />
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && !isHidden && (
        <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
          <PredictionTable prediction={prediction} driversById={driversById} />
          
          {(showEdit || showDelete) && (
            <div className="mt-4 flex justify-end gap-2 pt-4 border-t border-border">
              {showEdit && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit?.(prediction)
                  }}
                >
                  Modifica
                </Button>
              )}
              {showDelete && (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete?.(prediction.id)
                  }}
                >
                  Elimina
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function PredictionsViewer({
  predictions,
  drivers,
  isLoading = false,
  showUserName = false,
  onEdit,
  onDelete,
}: PredictionsViewerProps) {
  const driversById = useMemo(() => {
    const map = new Map<string, Driver>()
    for (const d of drivers) map.set(d.id, d)
    return map
  }, [drivers])

  const groupedByEvent = useMemo(() => {
    const groups = new Map<string, { event: any; predictions: PredictionWithDetails[] }>()
    for (const p of predictions) {
      const eventId = p.event.id
      const existing = groups.get(eventId)
      if (existing) {
        existing.predictions.push(p)
      } else {
        groups.set(eventId, { event: p.event, predictions: [p] })
      }
    }
    return Array.from(groups.values()).sort((a, b) => new Date(b.event.date).getTime() - new Date(a.event.date).getTime())
  }, [predictions])

  if (isLoading) {
    return (
      <Card padding="none" className="overflow-hidden">
        <div className="p-6">
          <div className="space-y-3">
            <div className="h-4 w-48 bg-muted rounded" />
            <div className="h-24 bg-muted rounded" />
            <div className="h-24 bg-muted rounded" />
          </div>
        </div>
      </Card>
    )
  }

  if (groupedByEvent.length === 0) {
    return (
      <Card padding="none" className="overflow-hidden">
        <div className="p-10 text-center">
          <div className="text-sm font-medium text-foreground">Nessun pronostico</div>
          <div className="mt-1 text-sm text-muted-foreground">Nessun pronostico disponibile.</div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {groupedByEvent.map(({ event, predictions: eventPredictions }) => {
        const circuit = deriveCircuitFromName(event.name)
        return (
          <Card key={event.id} padding="none" className="overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-border bg-muted/20">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {event.countryFlag && (
                      <img src={event.countryFlag} alt="" className="w-6 h-4 object-cover rounded-sm shadow-sm" />
                    )}
                    <h3 className="text-lg font-bold text-foreground truncate">{event.name}</h3>
                    <StatusBadge event={event} />
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground flex items-center gap-2">
                    <span className="font-medium text-foreground/80">{circuit}</span>
                    <span className="text-border">•</span>
                    <span>{formatDateTime(event.date)}</span>
                  </div>
                </div>
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground px-2 py-1 bg-background rounded border border-border">
                  {event.type === 'RACE' ? 'Gran Premio' : 'Sprint'}
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-3">
              {eventPredictions.map((prediction) => (
                <PredictionRow
                  key={prediction.id}
                  prediction={prediction}
                  driversById={driversById}
                  showUserName={showUserName}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
