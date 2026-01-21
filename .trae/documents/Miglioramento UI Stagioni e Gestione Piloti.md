# Piano di Miglioramento UI e Gestione Stagioni

Per risolvere i problemi di usabilità segnalati e chiarire la gestione dei piloti, propongo le seguenti modifiche:

## 1. Miglioramento UI Pagina Stagioni (`/admin/seasons`)
- **Visibilità Bottoni**:
  - Trasformare il pulsante "Imposta Attiva" in un bottone solido (es. verde/blu) sempre visibile, non solo al passaggio del mouse.
  - Aggiungere icone esplicite per le azioni.
- **Funzionalità Modifica**:
  - Aggiungere un pulsante **"Modifica"** (icona matita) per ogni stagione.
  - Permettere di riaprire il form esistente popolato con i dati della stagione per modificarne nome, date e regole.

## 2. Nuova Funzionalità: Gestione Piloti per Stagione
Per rispondere al dubbio sull'associazione piloti-stagione, implementerò un'interfaccia dedicata e chiara:

- **Nuovo Bottone "Gestione Piloti"**:
  - Nella tabella delle stagioni, aggiungere un pulsante **"Gestisci Piloti"** (icona casco/utente).
- **Modale di Selezione**:
  - Alla pressione del tasto, si aprirà una finestra che mostra **tutti i piloti** presenti nel database.
  - Una lista con checkbox permetterà di selezionare/deselezionare chi partecipa a quella specifica stagione.
  - Questo rende esplicito e visivo il collegamento "Molti-a-Molti" presente nel database.

## 3. Aggiornamenti Backend
- **API Aggiornamento**: Estendere l'API `PATCH /api/seasons/[id]` per supportare la ricezione di una lista di ID piloti (`driverIds`) da associare in blocco alla stagione.

## Nota sul Database
Il modello attuale (relazione molti-a-molti tra `Driver` e `Season`) è corretto per gestire la **partecipazione**.
*Limitazione attuale*: Se un pilota cambia scuderia (es. da Ferrari a Red Bull), cambiando il nome del team nel record del Pilota, questo cambierà anche nelle stagioni passate.
*Soluzione proposta*: Per ora manteniamo questa struttura per semplicità come richiesto. Se in futuro servirà lo storico esatto dei team, evolveremo il modello.
