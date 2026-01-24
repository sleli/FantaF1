'use client'

import { useState, useEffect } from 'react'
import { Season, ScoringType } from '@prisma/client'
import { PencilSquareIcon, UserGroupIcon, CheckCircleIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline'
import SeasonDriverSelector from '@/components/admin/SeasonDriverSelector'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'

export default function SeasonsPage() {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [processing, setProcessing] = useState(false)
  
  // Driver Selector State
  const [showDriverSelector, setShowDriverSelector] = useState(false)
  const [selectedSeasonForDrivers, setSelectedSeasonForDrivers] = useState<Season | null>(null)

  // Edit Mode State
  const [editingSeason, setEditingSeason] = useState<Season | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    scoringType: 'LEGACY_TOP3' as ScoringType,
    driverCount: 20,
    isActive: false,
    copyDriversFromSeasonId: ''
  })

  const fetchSeasons = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/seasons')
      const data = await res.json()
      if (data.seasons) setSeasons(data.seasons)
    } catch (error) {
      console.error('Error fetching seasons:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSeasons()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)
    
    try {
      const url = editingSeason ? `/api/seasons/${editingSeason.id}` : '/api/seasons'
      const method = editingSeason ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (res.ok) {
        closeForm()
        fetchSeasons()
      } else {
        const error = await res.json()
        alert(error.error || 'Errore durante l\'operazione')
      }
    } catch (error) {
      console.error('Error saving season:', error)
      alert('Errore di connessione')
    } finally {
      setProcessing(false)
    }
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingSeason(null)
    setFormData({
        name: '',
        startDate: '',
        endDate: '',
        scoringType: 'LEGACY_TOP3',
        driverCount: 20,
        isActive: false,
        copyDriversFromSeasonId: ''
    })
  }

  const handleEdit = (season: Season) => {
    setEditingSeason(season)
    setFormData({
        name: season.name,
        startDate: new Date(season.startDate).toISOString().split('T')[0],
        endDate: new Date(season.endDate).toISOString().split('T')[0],
        scoringType: season.scoringType,
        driverCount: season.driverCount,
        isActive: season.isActive,
        copyDriversFromSeasonId: ''
    })
    setShowForm(true)
  }

  const handleSetActive = async (seasonId: string) => {
    if (!confirm('Sei sicuro di voler attivare questa stagione? Le altre verranno disattivate.')) return

    setProcessing(true)
    try {
      const res = await fetch(`/api/seasons/${seasonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true })
      })

      if (res.ok) {
        fetchSeasons()
      } else {
        const error = await res.json()
        alert(error.error || 'Errore durante l\'aggiornamento')
      }
    } catch (error) {
      console.error('Error updating season:', error)
      alert('Errore di connessione')
    } finally {
      setProcessing(false)
    }
  }

  const openDriverSelector = (season: Season) => {
    setSelectedSeasonForDrivers(season)
    setShowDriverSelector(true)
  }

  const handleSaveDrivers = async (driverIds: string[]) => {
    if (!selectedSeasonForDrivers) return

    try {
      const res = await fetch(`/api/seasons/${selectedSeasonForDrivers.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverIds })
      })

      if (res.ok) {
        fetchSeasons()
      } else {
        alert('Errore durante il salvataggio dei piloti')
      }
    } catch (error) {
      console.error('Error saving drivers:', error)
      alert('Errore di connessione')
    }
  }

  const handleDelete = async (seasonId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa stagione? QUESTA AZIONE È IRREVERSIBILE.\n\nVerranno eliminati:\n- La stagione\n- Tutti gli eventi associati\n- Tutti i pronostici associati\n- Tutti i piloti della stagione')) return;
    
    setProcessing(true);
    try {
        const res = await fetch(`/api/seasons/${seasonId}`, {
            method: 'DELETE'
        });
        
        if (res.ok) {
            fetchSeasons();
        } else {
            const error = await res.json();
            alert(error.error || 'Errore durante l\'eliminazione');
        }
    } catch (error) {
        console.error('Error deleting season:', error);
        alert('Errore di connessione');
    } finally {
        setProcessing(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header with Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-secondary p-6 rounded-2xl border border-border shadow-lg relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-f1-red/10 to-transparent pointer-events-none" />
        
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-foreground">
            GESTIONE <span className="text-f1-red">STAGIONI</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Configura le stagioni, le date e le regole di punteggio.</p>
        </div>
        
        <Button 
            variant="primary"
            onClick={() => {
                setEditingSeason(null)
                setShowForm(!showForm)
            }}
            leftIcon={showForm ? undefined : <PlusIcon className="h-5 w-5" />}
            className="shadow-glow z-10"
        >
            {showForm ? 'Chiudi Form' : <><span className="hidden sm:inline">Nuova Stagione</span><span className="sm:hidden">Nuova</span></>}
        </Button>
      </div>
      
      {showForm && (
        <Card variant="default" className="p-6 border-f1-red/30">
            <h2 className="text-xl font-bold mb-6 text-foreground flex items-center gap-2">
                {editingSeason ? <PencilSquareIcon className="h-6 w-6 text-f1-red"/> : <PlusIcon className="h-6 w-6 text-f1-red"/>}
                {editingSeason ? 'Modifica Stagione' : 'Nuova Stagione'}
            </h2>
            <form onSubmit={handleCreate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input 
                        label="Nome Stagione"
                        type="text" 
                        required
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        placeholder="es. 2025"
                    />
                    <Input 
                        label="Numero Piloti"
                        type="number" 
                        required
                        min={1}
                        max={30}
                        value={formData.driverCount}
                        onChange={e => setFormData({...formData, driverCount: parseInt(e.target.value)})}
                    />
                    <Input 
                        label="Data Inizio"
                        type="date" 
                        required
                        value={formData.startDate}
                        onChange={e => setFormData({...formData, startDate: e.target.value})}
                    />
                    <Input 
                        label="Data Fine"
                        type="date" 
                        required
                        value={formData.endDate}
                        onChange={e => setFormData({...formData, endDate: e.target.value})}
                    />
                    <div className="md:col-span-2">
                        <Select
                            label="Modalità di Gioco"
                            value={formData.scoringType}
                            onChange={e => setFormData({...formData, scoringType: e.target.value as ScoringType})}
                        >
                            <option value="LEGACY_TOP3">TOP 3 (Classico)</option>
                            <option value="FULL_GRID_DIFF">Differenza Punti (Griglia Completa)</option>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-2 ml-1 flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-primary inline-block" />
                            {formData.scoringType === 'LEGACY_TOP3' 
                                ? 'I partecipanti pronosticano i primi 3 classificati. Punteggio basato su accuratezza.' 
                                : 'Pronostico intera griglia. Punteggio basato sulla differenza assoluta tra posizione pronosticata e reale.'}
                        </p>
                    </div>

                    {!editingSeason && seasons.length > 0 && (
                        <div className="md:col-span-2 border-t border-border pt-6 mt-2">
                            <Select
                                label="Importa Piloti (Opzionale)"
                                value={formData.copyDriversFromSeasonId}
                                onChange={e => setFormData({...formData, copyDriversFromSeasonId: e.target.value})}
                            >
                                <option value="">-- Non importare piloti (Crea vuota) --</option>
                                {seasons.map(s => (
                                    <option key={s.id} value={s.id}>
                                        Copia da {s.name} ({new Date(s.startDate).getFullYear()})
                                    </option>
                                ))}
                            </Select>
                            <p className="text-xs text-muted-foreground mt-2 ml-1">
                                Seleziona una stagione precedente per copiare automaticamente tutti i suoi piloti nella nuova stagione.
                            </p>
                        </div>
                    )}
                </div>
                <div className="flex justify-end pt-4 gap-3 border-t border-border">
                    <Button 
                        type="button"
                        variant="ghost"
                        onClick={closeForm}
                    >
                        Annulla
                    </Button>
                    <Button 
                        type="submit" 
                        variant="primary"
                        isLoading={processing}
                    >
                        {editingSeason ? 'Aggiorna Stagione' : 'Crea Stagione'}
                    </Button>
                </div>
            </form>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
           <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Card className="overflow-hidden bg-card border-border">
          <div className="overflow-x-auto">
            <table className="f1-table min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Regole</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Stato</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {seasons.map((season) => (
                  <tr key={season.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-foreground text-lg">{season.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(season.startDate).toLocaleDateString()} - {new Date(season.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-foreground">
                            {season.scoringType === 'FULL_GRID_DIFF' ? 'Differenza Griglia' : 'Legacy Top 3'}
                        </span>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground w-fit">
                            {season.driverCount} piloti
                        </span>
                      </div>
                    </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {season.isActive ? (
                          <Badge variant="success">Attiva</Badge>
                      ) : (
                          <Badge variant="neutral">Archiviata</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                          <button
                              onClick={() => openDriverSelector(season)}
                              className="text-muted-foreground hover:text-blue-400 p-2 rounded-lg hover:bg-blue-900/20 transition-colors"
                              title="Gestisci Piloti"
                          >
                              <UserGroupIcon className="h-5 w-5" />
                          </button>
                          <button
                              onClick={() => handleEdit(season)}
                              className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-muted transition-colors"
                              title="Modifica Stagione"
                          >
                              <PencilSquareIcon className="h-5 w-5" />
                          </button>
                          {!season.isActive && (
                              <button 
                                  onClick={() => handleSetActive(season.id)}
                                  disabled={processing}
                                  className="text-muted-foreground hover:text-green-400 p-2 rounded-lg hover:bg-green-900/20 transition-colors"
                                  title="Imposta come Attiva"
                              >
                                  <CheckCircleIcon className="h-5 w-5" />
                              </button>
                          )}
                          <button 
                              onClick={() => handleDelete(season.id)}
                              disabled={processing}
                              className="text-muted-foreground hover:text-destructive p-2 rounded-lg hover:bg-destructive/20 transition-colors"
                              title="Elimina Stagione"
                          >
                              <TrashIcon className="h-5 w-5" />
                          </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {seasons.length === 0 && (
                  <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                        <p className="text-lg font-medium">Nessuna stagione trovata</p>
                        <p className="text-sm mt-1">Crea una nuova stagione per iniziare.</p>
                      </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Driver Selector Modal */}
      {selectedSeasonForDrivers && (
        <SeasonDriverSelector
            isOpen={showDriverSelector}
            onClose={() => setShowDriverSelector(false)}
            onSave={handleSaveDrivers}
            seasonId={selectedSeasonForDrivers.id}
            seasonName={selectedSeasonForDrivers.name}
        />
      )}
    </div>
  )
}
