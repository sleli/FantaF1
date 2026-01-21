# Piano di Sviluppo FantaF1 2.0 (Revisionato)

## 1. Aggiornamento Database (Schema)

### Modifiche al Schema Prisma

* **Nuovo Enum** **`ScoringType`**:

  * `LEGACY_TOP3`: Vecchio sistema (Punti alti vincono, solo top 3).

  * `FULL_GRID_DIFF`: Nuovo sistema (Punti bassi vincono, griglia completa).

* **Nuovo Modello** **`Season`**:

  * `id`, `name` (es. "2024-2025").

  * `driverCount` (Int): Configurazione piloti specifica per la stagione (es. 20).

  * `scoringType` (ScoringType): Definisce le regole di calcolo.

  * `isActive` (Boolean).

* **Aggiornamento** **`Event`**:

  * Aggiunta relazione `seasonId`.

  * Aggiunta campo `results` (JSON) per griglia completa.

* **Aggiornamento** **`Prediction`**:

  * Aggiunta campo `rankings` (JSON) per griglia completa.

## 2. Logica di Business & Backend

### Sistema di Punteggio Ibrido

* Il sistema selezionerà l'algoritmo di calcolo in base al `scoringType` della stagione dell'evento.

  * **Legacy**: Usa la vecchia logica `calculatePoints` (High score wins).

  * **New**: Usa la nuova logica `calculateAbsoluteDifference` (Low score wins).

* **Classifiche**:

  * La dashboard filtrerà sempre per Stagione.

  * L'ordinamento della classifica si adatterà automaticamente: Decrescente per stagioni Legacy, Crescente per stagioni Nuove.

### Gestione Scadenze e Default (Solo Nuove Stagioni)

* La logica di "Auto-fill" dal pronostico precedente sarà attiva solo se la stagione è configurata per il nuovo sistema (o tramite flag opzionale).

## 3. Interfaccia Utente (Frontend)

### Adattabilità Stagionale

* **PredictionForm**:

  * Leggerà `season.driverCount` per generare il numero corretto di slot.

  * Userà **Drag & Drop (@dnd-kit)** per le nuove stagioni.

  * Manterrà (o adatterà) l'interfaccia per le vecchie stagioni se necessario (ma focus sul nuovo).

* **Leaderboard**:

  * Visualizzerà chiaramente il sistema di punteggio attivo.

  * Gestirà l'ordinamento corretto (ASC/DESC) in base alla stagione selezionata.

## 4. Migrazione

* **Script di Migrazione Intelligente**:

  1. Creazione Stagione "Legacy" (es. "2023-2024") con `scoringType: LEGACY_TOP3` e `driverCount: 20`.
  2. Spostamento di tutti gli eventi/pronostici passati nella stagione Legacy.
  3. Creazione Stagione "2024-2025" con `scoringType: FULL_GRID_DIFF` e `driverCount: 20` (o valore desiderato).
  4. Impostazione "2024-2025" come attiva.

## Dipendenze

* `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`

## Piano di Esecuzione

1. **Schema & DB**: Aggiornare Prisma con `Season` e `ScoringType`. Eseguire migrazione.
2. **Backend Core**: Aggiornare `scoring.ts` per gestire i due tipi di punteggio.
3. **API**: Aggiornare endpoints per supportare `seasonId` e nuovi formati dati.
4. **Frontend**: Implementare Drag & Drop e logica condizionale per Stagioni.
5. **Migrazione Dati**: Eseguire script per organizzare i dati esistenti.
6. **Admin & Docs**: Completare interfacce di gestione e manuali.

