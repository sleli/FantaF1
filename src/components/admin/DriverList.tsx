'use client';

import { Driver } from '@prisma/client';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface DriverListProps {
  drivers: Driver[];
  onEdit: (driver: Driver) => void;
  onDelete: (driver: Driver) => void;
  isLoading?: boolean;
}

// Mobile driver card component
function DriverCard({
  driver,
  onEdit,
  onDelete,
  isLoading,
}: {
  driver: Driver;
  onEdit: () => void;
  onDelete: () => void;
  isLoading?: boolean;
}) {
  return (
    <div
      className={`
        bg-card border border-border rounded-xl p-4
        transition-all duration-200
        ${driver.active ? '' : 'opacity-60'}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Driver number badge */}
        <div
          className="
            flex-shrink-0 w-12 h-12 rounded-xl
            bg-primary/10 border border-primary/30
            flex items-center justify-center
            font-black text-lg text-primary
          "
        >
          {driver.number}
        </div>

        {/* Driver info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-foreground truncate">
              {driver.name}
            </span>
            <Badge variant={driver.active ? 'success' : 'error'} size="sm">
              {driver.active ? 'Attivo' : 'Inattivo'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {driver.team}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4 pt-3 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          disabled={isLoading}
          leftIcon={<PencilIcon className="w-4 h-4" />}
          className="flex-1"
        >
          Modifica
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={onDelete}
          disabled={isLoading}
          leftIcon={<TrashIcon className="w-4 h-4" />}
          className="flex-1"
        >
          Elimina
        </Button>
      </div>
    </div>
  );
}

export function DriverList({
  drivers,
  onEdit,
  onDelete,
  isLoading = false,
}: DriverListProps) {
  if (drivers.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <div className="text-4xl mb-4">🏎️</div>
        <p className="font-medium">Nessun pilota trovato</p>
        <p className="text-sm mt-1">Aggiungi il primo pilota per iniziare</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile layout */}
      <div className="block lg:hidden space-y-3">
        {drivers.map((driver) => (
          <DriverCard
            key={driver.id}
            driver={driver}
            onEdit={() => onEdit(driver)}
            onDelete={() => onDelete(driver)}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:block">
        <div className="bg-card text-card-foreground border border-border shadow-md rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="f1-table min-w-full divide-y divide-border">
              <thead className="bg-surface-2">
                <tr>
                  <th className="px-6 py-4 text-left text-label text-muted-foreground uppercase tracking-wider">
                    Numero
                  </th>
                  <th className="px-6 py-4 text-left text-label text-muted-foreground uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-4 text-left text-label text-muted-foreground uppercase tracking-wider">
                    Team
                  </th>
                  <th className="px-6 py-4 text-left text-label text-muted-foreground uppercase tracking-wider">
                    Stato
                  </th>
                  <th className="px-6 py-4 text-right text-label text-muted-foreground uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {drivers.map((driver) => (
                  <tr
                    key={driver.id}
                    className={`
                      hover:bg-surface-2 transition-colors
                      ${driver.active ? '' : 'opacity-60'}
                    `}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className="
                          h-10 w-10 rounded-lg
                          bg-primary/10 border border-primary/30
                          flex items-center justify-center
                          font-bold text-sm text-primary
                        "
                      >
                        {driver.number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-foreground">
                        {driver.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-muted-foreground">
                        {driver.team}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={driver.active ? 'success' : 'error'}>
                        {driver.active ? 'Attivo' : 'Inattivo'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(driver)}
                          disabled={isLoading}
                          leftIcon={<PencilIcon className="w-4 h-4" />}
                        >
                          Modifica
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => onDelete(driver)}
                          disabled={isLoading}
                          leftIcon={<TrashIcon className="w-4 h-4" />}
                        >
                          Elimina
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
