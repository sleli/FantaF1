'use client'

import { Driver } from '@prisma/client'

interface DriverListProps {
  drivers: Driver[]
  onEdit: (driver: Driver) => void
  onDelete: (driver: Driver) => void
  isLoading?: boolean
}

export function DriverList({ drivers, onEdit, onDelete, isLoading = false }: DriverListProps) {
  if (drivers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nessun pilota trovato.</p>
      </div>
    )
  }

  return (
    <div className="bg-card text-card-foreground border border-border shadow-md rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Numero
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Team
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Stato
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {drivers.map((driver) => (
              <tr key={driver.id} className="hover:bg-foreground/5">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {driver.number}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-foreground">
                    {driver.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-muted-foreground">
                    {driver.team}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    driver.active 
                      ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                      : 'bg-destructive/10 text-destructive border border-destructive/20'
                  }`}>
                    {driver.active ? 'Attivo' : 'Inattivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(driver)}
                      disabled={isLoading}
                      className="inline-flex items-center px-3 py-1 border border-primary/20 text-sm leading-4 font-medium rounded-md text-primary bg-primary/10 hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                    >
                      Modifica
                    </button>
                    <button
                      onClick={() => onDelete(driver)}
                      disabled={isLoading}
                      className="inline-flex items-center px-3 py-1 border border-destructive/20 text-sm leading-4 font-medium rounded-md text-destructive bg-destructive/10 hover:bg-destructive/20 focus:outline-none focus:ring-2 focus:ring-destructive disabled:opacity-50"
                    >
                      Elimina
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
