import { NextResponse } from 'next/server'

export async function GET() {
  const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';
  
  return NextResponse.json({
    isMaintenanceMode,
    timestamp: new Date().toISOString()
  })
}
