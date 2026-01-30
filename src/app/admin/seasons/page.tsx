'use client'

import { useState, useEffect } from 'react'
import { Season, ScoringType } from '@prisma/client'
import { PencilSquareIcon, UserGroupIcon, CheckCircleIcon, TrashIcon, PlusIcon, CloudArrowDownIcon, EyeIcon } from '@heroicons/react/24/outline'
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
    isActive: false,
    copyDriversFromSeasonId: '',
    // F1 Import fields
    year: new Date().getFullYear(),
    importDriversFromF1: false,
    importEventsFromF1: false
  })

  // F1 Import Preview State
  const [previewDrivers, setPreviewDrivers] = useState<any[]>([])
  const [previewEvents, setPreviewEvents] = useState<any[]>([])
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

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
        isActive: false,
        copyDriversFromSeasonId: '',
        year: new Date().getFullYear(),
        importDriversFromF1: false,
        importEventsFromF1: false
    })
    // Reset preview state
    setPreviewDrivers([])
    setPreviewEvents([])
    setPreviewError(null)
  }

  // F1 Import Preview Handler
  const handlePreviewImport = async () => {
    if (!formData.importDriversFromF1 && !formData.importEventsFromF1) return

    setLoadingPreview(true)
    setPreviewError(null)
    setPreviewDrivers([])
    setPreviewEvents([])

    try {
      if (formData.importDriversFromF1) {
        const res = await fetch(`/api/admin/f1-import/drivers?year=${formData.year}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Errore caricamento piloti')
        setPreviewDrivers(data.drivers || [])
      }

      if (formData.importEventsFromF1) {
        const res = await fetch(`/api/admin/f1-import/events?year=${formData.year}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Errore caricamento eventi')
        setPreviewEvents(data.events || [])
      }
    } catch (error) {
      console.error('Preview error:', error)
      setPreviewError(error instanceof Error ? error.message : 'Errore durante il caricamento')
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleEdit = (season: Season & { year?: number | null }) => {
    setEditingSeason(season)
    setFormData({
        name: season.name,
        startDate: new Date(season.startDate).toISOString().split('T')[0],
        endDate: new Date(season.endDate).toISOString().split('T')[0],
        scoringType: season.scoringType,
        isActive: season.isActive,
        copyDriversFromSeasonId: '',
        year: season.year ?? new Date().getFullYear(),
        importDriversFromF1: false,
        importEventsFromF1: false
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

                    {!editingSeason && seasons.length > 0 && !formData.importDriversFromF1 && (
                        <div className="md:col-span-2 border-t border-border pt-6 mt-2">
                            <Select
                                label="Copia Piloti da Stagione Esistente"
                                value={formData.copyDriversFromSeasonId}
                                onChange={e => setFormData({...formData, copyDriversFromSeasonId: e.target.value})}
                            >
                                <option value="">-- Non copiare piloti --</option>
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

                    {/* F1 API Import Section */}
                    {!editingSeason && (
                        <div className="md:col-span-2 border-t border-border pt-6 mt-2">
                            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                                <CloudArrowDownIcon className="h-5 w-5 text-f1-red" />
                                Importa da F1 API
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <Input
                                    label="Anno F1"
                                    type="number"
                                    min={2023}
                                    max={2030}
                                    value={formData.year}
                                    onChange={e => {
                                        setFormData({...formData, year: parseInt(e.target.value) || new Date().getFullYear()})
                                        setPreviewDrivers([])
                                        setPreviewEvents([])
                                    }}
                                />

                                <div className="flex flex-col justify-end">
                                    <label className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={formData.importDriversFromF1}
                                            onChange={e => {
                                                setFormData({
                                                    ...formData,
                                                    importDriversFromF1: e.target.checked,
                                                    copyDriversFromSeasonId: e.target.checked ? '' : formData.copyDriversFromSeasonId
                                                })
                                                setPreviewDrivers([])
                                            }}
                                            className="w-4 h-4 rounded border-border text-f1-red focus:ring-f1-red"
                                        />
                                        <span className="text-foreground text-sm font-medium">Importa Piloti</span>
                                    </label>
                                </div>

                                <div className="flex flex-col justify-end">
                                    <label className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={formData.importEventsFromF1}
                                            onChange={e => {
                                                setFormData({...formData, importEventsFromF1: e.target.checked})
                                                setPreviewEvents([])
                                            }}
                                            className="w-4 h-4 rounded border-border text-f1-red focus:ring-f1-red"
                                        />
                                        <span className="text-foreground text-sm font-medium">Importa Eventi</span>
                                    </label>
                                </div>
                            </div>

                            {(formData.importDriversFromF1 || formData.importEventsFromF1) && (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handlePreviewImport}
                                    isLoading={loadingPreview}
                                    leftIcon={<EyeIcon className="h-5 w-5" />}
                                    className="mb-4"
                                >
                                    Anteprima Import
                                </Button>
                            )}

                            {previewError && (
                                <div className="bg-destructive/10 border border-destructive/30 text-destructive p-4 rounded-lg mb-4">
                                    {previewError}
                                </div>
                            )}

                            {/* Drivers Preview */}
                            {previewDrivers.length > 0 && (
                                <div className="mb-4 p-4 bg-muted/50 rounded-lg border border-border">
                                    <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                                        <span className="bg-f1-red text-white text-xs px-2 py-0.5 rounded">
                                            {previewDrivers.length}
                                        </span>
                                        Piloti da importare
                                    </h4>
                                    <div className="max-h-48 overflow-y-auto space-y-2">
                                        {previewDrivers.map((d, i) => (
                                            <div key={i} className="flex items-center gap-3 p-2 bg-background rounded border border-border/50">
                                                {d.imageUrl ? (
                                                    <img
                                                        src={d.imageUrl}
                                                        alt={d.name}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                                                        {d.number}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-medium text-foreground text-sm">
                                                        #{d.number} {d.name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">{d.team}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Events Preview */}
                            {previewEvents.length > 0 && (
                                <div className="p-4 bg-muted/50 rounded-lg border border-border">
                                    <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                                        <span className="bg-f1-red text-white text-xs px-2 py-0.5 rounded">
                                            {previewEvents.length}
                                        </span>
                                        Eventi da importare
                                    </h4>
                                    <div className="max-h-48 overflow-y-auto space-y-2">
                                        {previewEvents.map((e, i) => (
                                            <div key={i} className="flex items-center justify-between p-2 bg-background rounded border border-border/50">
                                                <div>
                                                    <div className="font-medium text-foreground text-sm">{e.name}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {new Date(e.date).toLocaleDateString('it-IT', {
                                                            weekday: 'short',
                                                            day: 'numeric',
                                                            month: 'short'
                                                        })}
                                                    </div>
                                                </div>
                                                <span className={`text-xs px-2 py-0.5 rounded ${
                                                    e.type === 'RACE'
                                                        ? 'bg-f1-red/20 text-f1-red'
                                                        : 'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                    {e.type === 'RACE' ? 'Gara' : 'Sprint'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <p className="text-xs text-muted-foreground mt-3 ml-1">
                                Importa automaticamente piloti e calendario dal campionato F1 ufficiale tramite API.
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
