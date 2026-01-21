# Guida Amministratore FantaF1 2.0

## Gestione Stagioni
Accedi alla sezione "Stagioni" dal pannello laterale per visualizzare le stagioni configurate.

### Creazione Nuova Stagione
Attualmente la creazione avviene tramite API o DB seed, ma è predisposta per un'interfaccia UI.
Parametri chiave:
- **Nome**: Identificativo unico (es. "2024-2025").
- **Scoring Type**: Scegliere `FULL_GRID_DIFF` per il nuovo sistema.
- **Driver Count**: Impostare il numero di piloti (es. 20).

## Gestione Eventi e Risultati
Quando inserisci i risultati di un evento per la nuova stagione:
1. Assicurati di fornire l'ordine d'arrivo completo.
2. Il sistema di calcolo punteggi (`Calculate Scores`) verificherà automaticamente la presenza di tutti i piloti.

### Auto-fill dei Pronostici
Quando lanci il calcolo dei punteggi per un evento:
- Il sistema controlla chi non ha inserito il pronostico.
- Se un utente ha partecipato a gare precedenti nella stessa stagione, il suo ultimo pronostico viene clonato automaticamente per la gara corrente.
- Questa operazione è automatica e viene registrata nei log del server.

## Archiviazione
Per archiviare una stagione:
1. Impostare `isActive = false` nel database o tramite futura interfaccia.
2. Creare una nuova stagione e impostarla come `isActive = true`.
Il frontend filtrerà automaticamente mostrando la stagione attiva di default, ma permettendo di consultare lo storico.
