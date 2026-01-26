import { PredictionWithDetails } from '@/lib/types'
import { Driver, ScoringType } from '@prisma/client'
import DriverAvatar from '@/components/ui/DriverAvatar'

interface PredictionDisplayProps {
  prediction: PredictionWithDetails
  drivers: Driver[]
}

export default function PredictionDisplay({ prediction, drivers }: PredictionDisplayProps) {
  const scoringType = (prediction.event as any).season?.scoringType || ScoringType.LEGACY_TOP3

  if (scoringType === ScoringType.FULL_GRID_DIFF) {
    return (
       <div className="bg-muted rounded-lg p-4 border border-border">
          <h4 className="text-sm font-medium text-foreground mb-3">Ordine di arrivo pronosticato:</h4>
          <div className="space-y-1 max-h-96 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted">
              {(prediction.rankings as string[] || []).map((id, idx) => {
                  const d = drivers?.find(driver => driver.id === id)
                  return (
                      <div key={`${prediction.id}-${idx}`} className="flex items-center gap-3 text-sm py-2 border-b border-border/60 last:border-0">
                          <span className={`w-8 font-bold ${idx < 3 ? 'text-primary' : 'text-muted-foreground'}`}>{idx + 1}.</span>
                          {d && <DriverAvatar imageUrl={d.imageUrl} name={d.name} size="sm" />}
                          <span className="font-medium text-foreground truncate flex-1">{d ? `${d.name}` : '...'}</span>
                          {d && <span className="text-muted-foreground text-xs ml-2">({d.team})</span>}
                      </div>
                  )
              })}
          </div>
          {(!prediction.rankings || (prediction.rankings as string[]).length === 0) && (
               <p className="text-sm text-muted-foreground italic">Nessun pilota ordinato</p>
          )}
       </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      {/* 1° Posto */}
      <div className="bg-card rounded-lg p-4 border border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-yellow-500">🥇 1° Posto</span>
          <span className="text-xs text-yellow-500">
            {prediction.event.type === 'SPRINT' ? '12.5 pt' : '25 pt'}
          </span>
        </div>
        <div className="flex items-center gap-3 text-foreground">
          {prediction.firstPlace && (
            <DriverAvatar imageUrl={prediction.firstPlace.imageUrl} name={prediction.firstPlace.name} size="md" />
          )}
          <div>
            <p className="font-semibold">#{prediction.firstPlace?.number} {prediction.firstPlace?.name}</p>
            <p className="text-sm text-muted-foreground">{prediction.firstPlace?.team}</p>
          </div>
        </div>
      </div>

      {/* 2° Posto */}
      <div className="bg-card rounded-lg p-4 border border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">🥈 2° Posto</span>
          <span className="text-xs text-muted-foreground">
            {prediction.event.type === 'SPRINT' ? '7.5 pt' : '15 pt'}
          </span>
        </div>
        <div className="flex items-center gap-3 text-foreground">
          {prediction.secondPlace && (
            <DriverAvatar imageUrl={prediction.secondPlace.imageUrl} name={prediction.secondPlace.name} size="md" />
          )}
          <div>
            <p className="font-semibold">#{prediction.secondPlace?.number} {prediction.secondPlace?.name}</p>
            <p className="text-sm text-muted-foreground">{prediction.secondPlace?.team}</p>
          </div>
        </div>
      </div>

      {/* 3° Posto */}
      <div className="bg-card rounded-lg p-4 border border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-orange-500">🥉 3° Posto</span>
          <span className="text-xs text-orange-500">
            {prediction.event.type === 'SPRINT' ? '5 pt' : '10 pt'}
          </span>
        </div>
        <div className="flex items-center gap-3 text-foreground">
          {prediction.thirdPlace && (
            <DriverAvatar imageUrl={prediction.thirdPlace.imageUrl} name={prediction.thirdPlace.name} size="md" />
          )}
          <div>
            <p className="font-semibold">#{prediction.thirdPlace?.number} {prediction.thirdPlace?.name}</p>
            <p className="text-sm text-muted-foreground">{prediction.thirdPlace?.team}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
