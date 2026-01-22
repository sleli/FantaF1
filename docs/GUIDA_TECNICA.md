# Guida Tecnica FantaF1 2.0

## Architettura del Sistema
Il sistema è basato su Next.js con database PostgreSQL gestito tramite Prisma ORM.

### Novità Versione 2.0
- **Supporto Multi-Stagione**: Introdotto il modello `Season` per gestire diverse edizioni del campionato con regole differenti.
- **Configurazione Dinamica**: Ogni stagione può avere un numero variabile di piloti (`driverCount`) e un diverso sistema di punteggio (`scoringType`).
- **Scoring Engine**:
  - `LEGACY_TOP3`: Sistema classico (25/15/10 punti per podio).
  - `FULL_GRID_DIFF`: Nuovo sistema basato sulla somma delle differenze assolute di posizione.

## Struttura Database (Prisma)
### Modello `Season`
- `driverCount`: Int (Default 20)
- `scoringType`: Enum (LEGACY_TOP3 | FULL_GRID_DIFF)
- `isActive`: Boolean

### Modello `Event` & `Prediction`
- Aggiunto supporto a campi JSON `results` e `rankings` per memorizzare griglie complete di qualsiasi dimensione.
- Campi legacy (`firstPlaceId`, ecc.) mantenuti per retrocompatibilità ma opzionali nei nuovi flussi.

## API Endpoints
- `GET /api/seasons`: Lista stagioni.
- `POST /api/seasons`: Creazione stagione (Admin).
- `POST /api/predictions`: Supporta ora un array `rankings` nel body per l'ordinamento completo.
- `POST /api/admin/events/[id]/calculate-scores`: Motore di calcolo ibrido. Rileva automaticamente il tipo di stagione e applica l'algoritmo corretto. Include logica di "Auto-fill" per pronostici mancanti.

## Frontend
- Utilizzo di `@dnd-kit` per l'interfaccia Drag & Drop nei pronostici.
- `PredictionForm` adattivo: mostra select dropdown per stagioni Legacy e lista ordinabile per stagioni Full Grid.
- `Leaderboard` dinamica: inverte l'ordinamento (ASC/DESC) in base al sistema di punteggio della stagione visualizzata.

## Migrazione
È disponibile uno script `scripts/migrate-seasons.ts` per inizializzare il database con la struttura a stagioni, migrando gli eventi esistenti in una stagione "Legacy".

## Refactoring (Gennaio 2026)
### Scoring Engine 2.0
Il modulo di calcolo dei punteggi (`src/lib/scoring.ts`) è stato rifattorizzato utilizzando il **Strategy Pattern** per migliorare manutenibilità e scalabilità.

- **ScoringStrategy Interface**: Definisce il contratto per gli algoritmi di calcolo.
- **Implementazioni**:
  - `LegacyTop3Strategy`: Logica per stagioni classiche (podio).
  - `FullGridDiffStrategy`: Logica per stagioni a griglia completa (differenza assoluta).
- **Centralizzazione Validazione**: Le regole di validazione dei pronostici sono ora centralizzate in `validatePrediction` e `validateEventResults`, eliminando duplicazioni nelle API.
