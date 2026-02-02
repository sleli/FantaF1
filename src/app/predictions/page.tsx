'use client'

import { Suspense } from 'react'
import PublicLayout from '@/components/layout/PublicLayout'
import PredictionsDashboard from '@/components/predictions/PredictionsDashboard'

function PredictionsContent() {
  return (
    <PublicLayout>
      <div className="page-container">
        <div className="page-desktop-card">
          <PredictionsDashboard />
        </div>
      </div>
    </PublicLayout>
  )
}

export default function PredictionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-f1-red"></div>
      </div>
    }>
      <PredictionsContent />
    </Suspense>
  )
}
