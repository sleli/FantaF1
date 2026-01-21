import { PredictionWithDetails } from '@/lib/types'
import { Driver, ScoringType } from '@prisma/client'

interface PredictionDisplayProps {
  prediction: PredictionWithDetails
  drivers: Driver[]
}

export default function PredictionDisplay({ prediction, drivers }: PredictionDisplayProps) {
  const scoringType = (prediction.event as any).season?.scoringType || ScoringType.LEGACY_TOP3

  if (scoringType === ScoringType.FULL_GRID_DIFF) {
    return (
       <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Ordine di arrivo pronosticato:</h4>
          <div className="space-y-1 max-h-96 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300">
              {(prediction.rankings as string[] || []).map((id, idx) => {
                  const d = drivers?.find(driver => driver.id === id)
                  return (
                      <div key={`${prediction.id}-${idx}`} className="flex items-center text-sm py-2 border-b border-gray-100 last:border-0">
                          <span className={`w-8 font-bold ${idx < 3 ? 'text-f1-red' : 'text-gray-400'}`}>{idx + 1}.</span>
                          <span className="font-medium text-gray-700 truncate flex-1">{d ? `${d.name}` : '...'}</span>
                          {d && <span className="text-gray-500 text-xs ml-2">({d.team})</span>}
                      </div>
                  )
              })}
          </div>
          {(!prediction.rankings || (prediction.rankings as string[]).length === 0) && (
               <p className="text-sm text-gray-500 italic">Nessun pilota ordinato</p>
          )}
       </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      {/* 1° Posto */}
      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-yellow-800">🥇 1° Posto</span>
          <span className="text-xs text-yellow-600">
            {prediction.event.type === 'SPRINT' ? '12.5 pt' : '25 pt'}
          </span>
        </div>
        <div className="text-f1-dark">
          <p className="font-semibold">#{prediction.firstPlace?.number} {prediction.firstPlace?.name}</p>
          <p className="text-sm text-gray-600">{prediction.firstPlace?.team}</p>
        </div>
      </div>

      {/* 2° Posto */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-800">🥈 2° Posto</span>
          <span className="text-xs text-gray-600">
            {prediction.event.type === 'SPRINT' ? '7.5 pt' : '15 pt'}
          </span>
        </div>
        <div className="text-f1-dark">
          <p className="font-semibold">#{prediction.secondPlace?.number} {prediction.secondPlace?.name}</p>
          <p className="text-sm text-gray-600">{prediction.secondPlace?.team}</p>
        </div>
      </div>

      {/* 3° Posto */}
      <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-orange-800">🥉 3° Posto</span>
          <span className="text-xs text-orange-600">
            {prediction.event.type === 'SPRINT' ? '5 pt' : '10 pt'}
          </span>
        </div>
        <div className="text-f1-dark">
          <p className="font-semibold">#{prediction.thirdPlace?.number} {prediction.thirdPlace?.name}</p>
          <p className="text-sm text-gray-600">{prediction.thirdPlace?.team}</p>
        </div>
      </div>
    </div>
  )
}
