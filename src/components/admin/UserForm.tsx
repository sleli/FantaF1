'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

type UserRole = 'PLAYER' | 'ADMIN';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  _count: {
    predictions: number;
  };
}

interface UserFormProps {
  user: User;
  onSave: () => void;
  onCancel: () => void;
}

export default function UserForm({ user, onSave, onCancel }: UserFormProps) {
  const [formData, setFormData] = useState({
    name: user.name,
    role: user.role as UserRole
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          role: formData.role
        })
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Errore nel salvataggio');
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Il nome è obbligatorio';
    if (formData.name.trim().length < 2) return 'Il nome deve avere almeno 2 caratteri';
    if (formData.name.trim().length > 100) return 'Il nome non può superare i 100 caratteri';
    return null;
  };

  const formError = validateForm();
  const hasChanges = formData.name !== user.name || formData.role !== user.role;

  const formatDate = (dateString: string) => {
    // Mostra la data UTC esattamente come salvata nel DB
    return new Date(dateString).toISOString().slice(0, 16).replace('T', ' ');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card text-card-foreground rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Modifica Utente
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Modifica le informazioni e il ruolo dell'utente
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground p-2"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {/* Informazioni attuali */}
          <div className="mb-6 p-4 bg-muted rounded-lg border border-border">
            <h3 className="text-sm font-medium text-foreground mb-3">Informazioni Attuali</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Email:</span>
                <span className="ml-2 font-medium">{user.email}</span>
              </div>
              <div>
                <span className="text-muted-foreground">ID:</span>
                <span className="ml-2 font-mono text-xs">{user.id}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Pronostici:</span>
                <span className="ml-2 font-medium">{user._count.predictions}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Registrato:</span>
                <span className="ml-2 font-medium">{formatDate(user.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 border border-destructive/30 bg-destructive/10 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Nome */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-2">
                Nome *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Nome dell'utente"
                required
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Il nome pubblico dell'utente (2-100 caratteri)
              </p>
            </div>

            {/* Ruolo */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-muted-foreground mb-2">
                Ruolo *
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                <option value="PLAYER">Giocatore</option>
                <option value="ADMIN">Amministratore</option>
              </select>
              <div className="text-xs text-muted-foreground mt-1">
                <p><strong>Giocatore:</strong> Può fare pronostici e vedere la classifica</p>
                <p><strong>Amministratore:</strong> Ha accesso completo al pannello di amministrazione</p>
              </div>
            </div>

            {/* Warning per cambio ruolo */}
            {formData.role !== user.role && (
              <div className="p-4 border border-yellow-500/20 bg-yellow-500/10 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-yellow-500">⚠️</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-500">
                      Attenzione: Cambio di Ruolo
                    </h3>
                    <div className="mt-2 text-sm text-yellow-500/90">
                      <p>
                        Stai cambiando il ruolo da <strong>{user.role === 'ADMIN' ? 'Amministratore' : 'Giocatore'}</strong> a{' '}
                        <strong>{formData.role === 'ADMIN' ? 'Amministratore' : 'Giocatore'}</strong>.
                      </p>
                      {formData.role === 'ADMIN' && (
                        <p className="mt-1">
                          L'utente avrà accesso completo al pannello di amministrazione.
                        </p>
                      )}
                      {formData.role === 'PLAYER' && user.role === 'ADMIN' && (
                        <p className="mt-1">
                          L'utente perderà l'accesso al pannello di amministrazione.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border bg-muted">
          <div className="text-sm text-muted-foreground">
            {hasChanges ? 'Ci sono modifiche non salvate' : 'Nessuna modifica'}
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-secondary-foreground bg-secondary border border-border rounded-md hover:bg-secondary/80 focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              Annulla
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || !!formError || !hasChanges}
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary border border-transparent rounded-md hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvataggio...' : 'Salva Modifiche'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
